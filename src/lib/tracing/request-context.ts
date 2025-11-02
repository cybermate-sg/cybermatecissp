/**
 * Request Tracing and Context Management
 * Implements distributed tracing with request IDs
 */

import { randomBytes } from 'crypto';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${randomBytes(16).toString('hex')}`;
}

/**
 * Request context for tracing
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  path: string;
  userId?: string;
  metadata: Record<string, unknown>;
}

/**
 * Request context store (using async local storage pattern)
 */
class RequestContextStore {
  private contexts: Map<string, RequestContext>;

  constructor() {
    this.contexts = new Map();
  }

  /**
   * Create a new request context
   */
  create(requestId: string, method: string, path: string): RequestContext {
    const context: RequestContext = {
      requestId,
      startTime: Date.now(),
      method,
      path,
      metadata: {},
    };

    this.contexts.set(requestId, context);
    return context;
  }

  /**
   * Get a request context
   */
  get(requestId: string): RequestContext | undefined {
    return this.contexts.get(requestId);
  }

  /**
   * Update request context
   */
  update(requestId: string, updates: Partial<RequestContext>): void {
    const context = this.contexts.get(requestId);
    if (context) {
      Object.assign(context, updates);
    }
  }

  /**
   * Add metadata to context
   */
  addMetadata(requestId: string, key: string, value: unknown): void {
    const context = this.contexts.get(requestId);
    if (context) {
      context.metadata[key] = value;
    }
  }

  /**
   * Remove a request context
   */
  remove(requestId: string): void {
    this.contexts.delete(requestId);
  }

  /**
   * Clean up old contexts (> 1 hour old)
   */
  cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [requestId, context] of this.contexts.entries()) {
      if (now - context.startTime > oneHour) {
        this.contexts.delete(requestId);
      }
    }
  }
}

// Singleton instance
export const requestContextStore = new RequestContextStore();

// Cleanup old contexts periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    requestContextStore.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Extract request ID from headers or generate new one
 */
export function extractOrGenerateRequestId(headers: Headers): string {
  // Check for existing request ID in headers
  const existingId = headers.get('x-request-id') || headers.get('x-trace-id');

  if (existingId) {
    return existingId;
  }

  // Generate new request ID
  return generateRequestId();
}

/**
 * Create trace headers for outgoing requests
 */
export function createTraceHeaders(requestId: string): Record<string, string> {
  return {
    'X-Request-ID': requestId,
    'X-Trace-ID': requestId,
  };
}

/**
 * Log request with context
 */
export function logWithContext(
  requestId: string,
  level: 'log' | 'info' | 'warn' | 'error',
  message: string,
  ...args: unknown[]
): void {
  const context = requestContextStore.get(requestId);
  const elapsed = context ? Date.now() - context.startTime : 0;

  const logMessage = [
    `[${requestId}]`,
    context ? `[${context.method} ${context.path}]` : '',
    `[${elapsed}ms]`,
    message,
  ]
    .filter(Boolean)
    .join(' ');

  console[level](logMessage, ...args);
}
