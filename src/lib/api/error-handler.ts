import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ZodError } from 'zod';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error context for logging and debugging
 */
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  body?: unknown;
  params?: unknown;
  [key: string]: unknown;
}

/**
 * Determine HTTP status code from error
 */
function getStatusCode(error: unknown, context?: string): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  if (error instanceof ZodError) {
    return 400;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Admin/Authorization errors
    if (message.includes('admin') || message.includes('unauthorized')) {
      return 403;
    }

    // Authentication errors
    if (message.includes('unauthenticated') || message.includes('not authenticated')) {
      return 401;
    }

    // Not found errors
    if (message.includes('not found')) {
      return 404;
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('required')) {
      return 400;
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many')) {
      return 429;
    }
  }

  return 500;
}

/**
 * Format error message for user display
 */
function getErrorMessage(error: unknown, context?: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return `Validation error: ${firstError.path.join('.')} - ${firstError.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return context ? `Failed to ${context}` : 'An unexpected error occurred';
}

/**
 * Get detailed error information for Sentry
 */
function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof ZodError) {
    return {
      issues: error.errors,
      formattedError: error.format(),
    };
  }

  return {};
}

/**
 * Centralized API error handler
 *
 * @param error - The error that occurred
 * @param context - Context string describing what operation failed (e.g., "create class")
 * @param additionalContext - Additional context for debugging
 * @returns NextResponse with appropriate error response
 *
 * @example
 * ```typescript
 * try {
 *   const admin = await requireAdmin();
 *   // ... do something
 * } catch (error) {
 *   return handleApiError(error, 'create class', { classId, userId: admin.clerkUserId });
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context?: string,
  additionalContext?: ErrorContext
): NextResponse {
  const statusCode = getStatusCode(error, context);
  const message = getErrorMessage(error, context);
  const errorDetails = getErrorDetails(error);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error] ${context || 'Unknown operation'}:`, {
      message,
      statusCode,
      error: error instanceof Error ? error.stack : error,
      context: additionalContext,
      details: errorDetails,
    });
  }

  // Send to Sentry in production (only for 500+ errors or ApiErrors)
  if (
    process.env.NODE_ENV === 'production' &&
    (statusCode >= 500 || error instanceof ApiError)
  ) {
    Sentry.captureException(error, {
      level: statusCode >= 500 ? 'error' : 'warning',
      contexts: {
        api: {
          operation: context,
          statusCode,
          ...additionalContext,
        },
      },
      tags: {
        endpoint: additionalContext?.endpoint,
        method: additionalContext?.method,
        statusCode: statusCode.toString(),
      },
      extra: errorDetails,
    });
  }

  // Return appropriate error response
  const response: Record<string, unknown> = {
    error: message,
    statusCode,
  };

  // Include validation details for 400 errors
  if (statusCode === 400 && error instanceof ZodError) {
    response.details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
  }

  // Include error code if available
  if (error instanceof ApiError && error.code) {
    response.code = error.code;
  }

  // Include additional details in development
  if (process.env.NODE_ENV === 'development' && errorDetails) {
    response.debug = errorDetails;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create a standardized ApiError
 *
 * @example
 * ```typescript
 * throw createApiError('Class not found', 404, 'CLASS_NOT_FOUND');
 * ```
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): ApiError {
  return new ApiError(message, statusCode, code, details);
}

/**
 * Wrap an async handler with error handling
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandling(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * }, 'fetch data');
 * ```
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Assert condition or throw error
 *
 * @example
 * ```typescript
 * assertExists(user, 'User not found', 404);
 * ```
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = 'Resource not found',
  statusCode: number = 404
): asserts value is T {
  if (value === null || value === undefined) {
    throw createApiError(message, statusCode);
  }
}

/**
 * Assert user has admin role
 */
export function assertAdmin(isAdmin: boolean): void {
  if (!isAdmin) {
    throw createApiError('Admin access required', 403, 'ADMIN_REQUIRED');
  }
}

/**
 * Assert user is authenticated
 */
export function assertAuthenticated(userId: string | null): asserts userId is string {
  if (!userId) {
    throw createApiError('Authentication required', 401, 'UNAUTHENTICATED');
  }
}
