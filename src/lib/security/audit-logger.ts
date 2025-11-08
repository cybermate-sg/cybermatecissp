/**
 * Security Audit Logger
 * Implements OWASP logging and monitoring best practices
 *
 * References:
 * - OWASP A09:2021 - Security Logging and Monitoring Failures
 * - OWASP Logging Cheat Sheet
 */

import { NextRequest } from 'next/server';

// Optional Sentry import
let Sentry: typeof import('@sentry/nextjs') | null = null;
(async () => {
  try {
    Sentry = await import('@sentry/nextjs');
  } catch {
    console.warn('[Audit Logger] Sentry not installed');
  }
})();

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  SESSION_EXPIRED = 'auth.session.expired',
  PASSWORD_RESET = 'auth.password.reset',

  // Authorization events
  ACCESS_DENIED = 'authz.access.denied',
  PERMISSION_ESCALATION_ATTEMPT = 'authz.escalation.attempt',
  ADMIN_ACCESS = 'authz.admin.access',

  // Data access events
  SENSITIVE_DATA_ACCESS = 'data.sensitive.access',
  DATA_EXPORT = 'data.export',
  DATA_DELETION = 'data.deletion',

  // Security violations
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  INVALID_INPUT = 'security.input.invalid',
  SQL_INJECTION_ATTEMPT = 'security.injection.sql',
  XSS_ATTEMPT = 'security.xss.attempt',
  CSRF_VIOLATION = 'security.csrf.violation',

  // System events
  CONFIG_CHANGE = 'system.config.change',
  ENCRYPTION_FAILURE = 'system.encryption.failure',
  DATABASE_ERROR = 'system.database.error',
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityEventContext {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  timestamp: string;
  requestId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  context: SecurityEventContext;
  success: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Security Audit Logger
 */
export class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log a security event
   */
  log(event: SecurityEvent): void {
    const logEntry = {
      ...event,
      environment: process.env.NODE_ENV || 'unknown',
      application: 'cisspmastery',
    };

    // Console logging (structured)
    const logMethod = this.getLogMethod(event.severity);
    logMethod('[SECURITY EVENT]', JSON.stringify(logEntry, null, 2));

    // Send to Sentry for high/critical events
    if (
      Sentry &&
      (event.severity === SecurityEventSeverity.HIGH ||
        event.severity === SecurityEventSeverity.CRITICAL)
    ) {
      const sentryLevel = event.severity === SecurityEventSeverity.CRITICAL ? 'error' : 'warning';

      Sentry.captureMessage(`Security Event: ${event.type}`, {
        level: sentryLevel,
        contexts: {
          security: {
            event_type: event.type,
            severity: event.severity,
            success: event.success,
            ...event.context,
          },
        },
        tags: {
          security_event: event.type,
          severity: event.severity,
          userId: event.context.userId,
        },
        extra: event.metadata,
      });
    }

    // In production, you might want to send to a SIEM system or logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSIEM(logEntry);
    }
  }

  /**
   * Log authentication event
   */
  logAuthEvent(
    type: SecurityEventType,
    success: boolean,
    context: Partial<SecurityEventContext>,
    metadata?: Record<string, unknown>
  ): void {
    const severity = success
      ? SecurityEventSeverity.LOW
      : type === SecurityEventType.LOGIN_FAILURE
      ? SecurityEventSeverity.MEDIUM
      : SecurityEventSeverity.HIGH;

    this.log({
      type,
      severity,
      message: `Authentication event: ${type}`,
      success,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      } as SecurityEventContext,
      metadata,
    });
  }

  /**
   * Log authorization event
   */
  logAuthzEvent(
    type: SecurityEventType,
    success: boolean,
    context: Partial<SecurityEventContext>,
    metadata?: Record<string, unknown>
  ): void {
    const severity = success
      ? SecurityEventSeverity.LOW
      : SecurityEventSeverity.HIGH;

    this.log({
      type,
      severity,
      message: `Authorization event: ${type}`,
      success,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      } as SecurityEventContext,
      metadata,
    });
  }

  /**
   * Log security violation
   */
  logSecurityViolation(
    type: SecurityEventType,
    context: Partial<SecurityEventContext>,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      type,
      severity: SecurityEventSeverity.HIGH,
      message: `Security violation detected: ${type}`,
      success: false,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      } as SecurityEventContext,
      metadata,
    });
  }

  /**
   * Log data access event
   */
  logDataAccess(
    type: SecurityEventType,
    context: Partial<SecurityEventContext>,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      type,
      severity: SecurityEventSeverity.MEDIUM,
      message: `Data access event: ${type}`,
      success: true,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      } as SecurityEventContext,
      metadata,
    });
  }

  /**
   * Extract context from request
   */
  extractRequestContext(request: NextRequest, userId?: string): Partial<SecurityEventContext> {
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    return {
      userId,
      ipAddress: ipAddress.split(',')[0].trim(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: request.url,
      method: request.method,
      requestId: request.headers.get('x-request-id') || undefined,
    };
  }

  /**
   * Get appropriate log method based on severity
   */
  private getLogMethod(severity: SecurityEventSeverity): typeof console.log {
    switch (severity) {
      case SecurityEventSeverity.CRITICAL:
      case SecurityEventSeverity.HIGH:
        return console.error;
      case SecurityEventSeverity.MEDIUM:
        return console.warn;
      default:
        return console.log;
    }
  }

  /**
   * Send to SIEM system (placeholder for integration)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private sendToSIEM(_event: SecurityEvent & { environment: string; application: string }): void {
    // TODO: Integrate with SIEM system (e.g., Splunk, ELK, DataDog)
    // This is a placeholder for future implementation
    if (process.env.SIEM_ENDPOINT) {
      // Example: fetch(process.env.SIEM_ENDPOINT, { method: 'POST', body: JSON.stringify(_event) })
      console.log('[SIEM] Event would be sent to:', process.env.SIEM_ENDPOINT);
    }
  }
}

/**
 * Singleton instance
 */
export const auditLogger = AuditLogger.getInstance();

/**
 * Helper functions for common security events
 */

export function logLoginAttempt(
  success: boolean,
  context: Partial<SecurityEventContext>,
  metadata?: Record<string, unknown>
): void {
  auditLogger.logAuthEvent(
    success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    success,
    context,
    metadata
  );
}

export function logAccessDenied(
  context: Partial<SecurityEventContext>,
  reason?: string
): void {
  auditLogger.logAuthzEvent(
    SecurityEventType.ACCESS_DENIED,
    false,
    context,
    { reason }
  );
}

export function logRateLimitExceeded(
  context: Partial<SecurityEventContext>
): void {
  auditLogger.logSecurityViolation(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    context
  );
}

export function logSQLInjectionAttempt(
  context: Partial<SecurityEventContext>,
  input: string
): void {
  auditLogger.logSecurityViolation(
    SecurityEventType.SQL_INJECTION_ATTEMPT,
    context,
    { suspiciousInput: input.substring(0, 200) } // Log only first 200 chars
  );
}

export function logXSSAttempt(
  context: Partial<SecurityEventContext>,
  input: string
): void {
  auditLogger.logSecurityViolation(
    SecurityEventType.XSS_ATTEMPT,
    context,
    { suspiciousInput: input.substring(0, 200) }
  );
}

export function logAdminAccess(
  context: Partial<SecurityEventContext>,
  action: string
): void {
  auditLogger.logAuthzEvent(
    SecurityEventType.ADMIN_ACCESS,
    true,
    context,
    { action }
  );
}

export function logSensitiveDataAccess(
  context: Partial<SecurityEventContext>,
  dataType: string
): void {
  auditLogger.logDataAccess(
    SecurityEventType.SENSITIVE_DATA_ACCESS,
    context,
    { dataType }
  );
}
