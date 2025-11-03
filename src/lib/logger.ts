/**
 * Centralized logging utility with Sentry integration
 *
 * Replaces all console.log/error statements throughout the application
 */

// Optional Sentry import - only used if package is installed
let Sentry: typeof import('@sentry/nextjs') | null = null;
try {
  Sentry = require('@sentry/nextjs');
} catch {
  // Sentry not installed - logging will still work without it
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Logger] Sentry not installed - error tracking disabled');
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

interface LogMessage {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

/**
 * Format log message for console output
 */
function formatLogMessage(logMessage: LogMessage): string {
  const { level, message, timestamp } = logMessage;
  const prefix = `[${level.toUpperCase()}] [${timestamp}]`;
  return `${prefix} ${message}`;
}

/**
 * Should log to console based on environment and level
 */
function shouldLogToConsole(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, only log warnings and errors to console
  return level === 'warn' || level === 'error';
}

/**
 * Internal logging function
 */
function logMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  const logData: LogMessage = {
    level,
    message,
    context,
    error,
    timestamp: new Date().toISOString(),
  };

  // Console logging
  if (shouldLogToConsole(level)) {
    const formattedMessage = formatLogMessage(logData);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context);
        break;
      case 'info':
        console.info(formattedMessage, context);
        break;
      case 'warn':
        console.warn(formattedMessage, context);
        break;
      case 'error':
        console.error(formattedMessage, error || '', context);
        break;
    }
  }

  // Send to Sentry (production only, warn and error levels)
  if (Sentry && process.env.NODE_ENV === 'production') {
    if (level === 'error' && error) {
      Sentry.captureException(error, {
        level: 'error',
        contexts: {
          log: context,
        },
        tags: {
          logLevel: level,
        },
      });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: 'warning',
        contexts: {
          log: context,
        },
      });
    }
  }
}

/**
 * Centralized logger
 */
export const log = {
  /**
   * Debug level logging (development only)
   *
   * @example
   * ```typescript
   * log.debug('Cache hit for key', { key: 'user:123', ttl: 300 });
   * ```
   */
  debug: (message: string, context?: LogContext): void => {
    logMessage('debug', message, context);
  },

  /**
   * Info level logging
   *
   * @example
   * ```typescript
   * log.info('User created successfully', { userId: user.id, email: user.email });
   * ```
   */
  info: (message: string, context?: LogContext): void => {
    logMessage('info', message, context);
  },

  /**
   * Warning level logging (sent to Sentry in production)
   *
   * @example
   * ```typescript
   * log.warn('Deprecated API endpoint called', { endpoint: '/api/old', userId });
   * ```
   */
  warn: (message: string, context?: LogContext): void => {
    logMessage('warn', message, context);
  },

  /**
   * Error level logging (sent to Sentry in production)
   *
   * @example
   * ```typescript
   * try {
   *   await riskyOperation();
   * } catch (error) {
   *   log.error('Failed to complete operation', error as Error, { userId, operation: 'riskyOp' });
   * }
   * ```
   */
  error: (message: string, error: Error, context?: LogContext): void => {
    logMessage('error', message, context, error);
  },

  /**
   * Start a performance timer
   *
   * @example
   * ```typescript
   * const timer = log.startTimer();
   * await longOperation();
   * timer.end('Long operation completed', { userId });
   * ```
   */
  startTimer: () => {
    const startTime = Date.now();

    return {
      end: (message: string, context?: LogContext): void => {
        const duration = Date.now() - startTime;
        log.info(`${message} (${duration}ms)`, {
          ...context,
          duration,
        });
      },
    };
  },

  /**
   * Log with custom Sentry breadcrumb
   *
   * @example
   * ```typescript
   * log.breadcrumb('User clicked button', 'ui', { buttonId: 'submit-form' });
   * ```
   */
  breadcrumb: (
    message: string,
    category: string = 'default',
    data?: Record<string, unknown>,
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'
  ): void => {
    if (Sentry) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level,
        timestamp: Date.now() / 1000,
      });
    }
  },
};

/**
 * Set user context for Sentry
 *
 * @example
 * ```typescript
 * setUserContext({
 *   id: user.clerkUserId,
 *   email: user.email,
 *   role: user.role,
 * });
 * ```
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}): void {
  if (Sentry) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      ...user,
    });
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  if (Sentry) {
    Sentry.setUser(null);
  }
}

/**
 * Set custom context for debugging
 *
 * @example
 * ```typescript
 * setContext('payment', {
 *   amount: 9999,
 *   currency: 'USD',
 *   stripeCustomerId: 'cus_xxx',
 * });
 * ```
 */
export function setContext(
  key: string,
  context: Record<string, unknown>
): void {
  if (Sentry) {
    Sentry.setContext(key, context);
  }
}

/**
 * Add tags for filtering in Sentry
 *
 * @example
 * ```typescript
 * setTags({
 *   environment: 'production',
 *   feature: 'flashcards',
 *   version: '1.0.0',
 * });
 * ```
 */
export function setTags(tags: Record<string, string>): void {
  if (Sentry) {
    Sentry.setTags(tags);
  }
}

/**
 * Capture a custom message in Sentry
 *
 * @example
 * ```typescript
 * captureMessage('Unusual activity detected', 'warning', {
 *   userId: user.id,
 *   activityType: 'multiple_failed_logins',
 * });
 * ```
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: LogContext
): void {
  if (Sentry) {
    Sentry.captureMessage(message, {
      level,
      contexts: {
        custom: context,
      },
    });
  }
}

/**
 * Manually capture an exception
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error as Error, { userId, operation: 'riskyOp' });
 *   // Handle error gracefully
 * }
 * ```
 */
export function captureException(
  error: Error,
  context?: LogContext
): void {
  if (Sentry) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  }
}
