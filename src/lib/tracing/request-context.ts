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
 * Sanitize a value for safe logging (prevents log injection)
 */
function sanitizeForLog(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  let str: string;
  if (typeof value === 'object') {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }

  // Remove ANSI escape codes and control characters
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/[\x00-\x1f\x7f]/g, '');
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

  const sanitizedRequestId = sanitizeForLog(requestId);
  const sanitizedMessage = sanitizeForLog(message);
  const sanitizedArgs = args.map(sanitizeForLog);

  // Build format string and arguments separately to avoid string concatenation
  const formatParts: string[] = ['[%s]'];
  const formatArgs: string[] = [sanitizedRequestId];

  if (context) {
    formatParts.push('[%s %s]');
    formatArgs.push(sanitizeForLog(context.method), sanitizeForLog(context.path));
  }

  formatParts.push('[%sms]');
  formatArgs.push(String(elapsed));

  formatParts.push('%s');
  formatArgs.push(sanitizedMessage);

  const formatString = formatParts.join(' ');

  switch (level) {
    case 'log':
      console.log(formatString, ...formatArgs, ...sanitizedArgs);
      break;
    case 'info':
      console.info(formatString, ...formatArgs, ...sanitizedArgs);
      break;
    case 'warn':
      console.warn(formatString, ...formatArgs, ...sanitizedArgs);
      break;
    case 'error':
      console.error(formatString, ...formatArgs, ...sanitizedArgs);
      break;
    default:
      // Safe fallback for any unexpected values
      console.log(formatString, ...formatArgs, ...sanitizedArgs);
  }
}
