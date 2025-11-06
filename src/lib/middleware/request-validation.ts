/**
 * Request Validation Middleware
 * Implements OWASP best practices for request validation
 *
 * References:
 * - OWASP A04:2021 - Insecure Design
 * - OWASP Input Validation Cheat Sheet
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RequestSizeLimits {
  maxBodySize: number; // in bytes
  maxUrlLength: number;
  maxHeaderSize: number;
  maxFileSize: number;
}

/**
 * Default request size limits
 */
export const DEFAULT_SIZE_LIMITS: RequestSizeLimits = {
  maxBodySize: 10 * 1024 * 1024, // 10MB for regular requests
  maxUrlLength: 2048, // 2KB URL length
  maxHeaderSize: 8192, // 8KB headers
  maxFileSize: 50 * 1024 * 1024, // 50MB for file uploads
};

/**
 * Validate request size limits
 */
export async function validateRequestSize(
  request: NextRequest,
  limits: Partial<RequestSizeLimits> = {}
): Promise<{ valid: boolean; error?: string }> {
  const activeLimits = { ...DEFAULT_SIZE_LIMITS, ...limits };

  // Check URL length
  if (request.url.length > activeLimits.maxUrlLength) {
    return {
      valid: false,
      error: `URL length exceeds maximum of ${activeLimits.maxUrlLength} characters`,
    };
  }

  // Check header size
  const headerSize = Array.from(request.headers.entries())
    .reduce((total, [key, value]) => total + key.length + value.length, 0);

  if (headerSize > activeLimits.maxHeaderSize) {
    return {
      valid: false,
      error: `Header size exceeds maximum of ${activeLimits.maxHeaderSize} bytes`,
    };
  }

  // Check body size (if present)
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const bodySize = parseInt(contentLength, 10);
    const maxSize = request.url.includes('/upload')
      ? activeLimits.maxFileSize
      : activeLimits.maxBodySize;

    if (bodySize > maxSize) {
      return {
        valid: false,
        error: `Request body size exceeds maximum of ${maxSize} bytes`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove control characters (except newline, tab, carriage return)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check for common SQL injection patterns
 * Note: This is a defense-in-depth measure; use parameterized queries as primary defense
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|WHERE|FROM|HAVING|GROUP BY|ORDER BY)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /('|"|`|;|\||&)/,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<img[\s\S]*?onerror[\s\S]*?>/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize user input
 */
export function validateInput(input: string, options: {
  allowHTML?: boolean;
  maxLength?: number;
  checkInjection?: boolean;
} = {}): { valid: boolean; sanitized: string; error?: string } {
  const {
    allowHTML = false,
    maxLength = 10000,
    checkInjection = true,
  } = options;

  // Check length
  if (input.length > maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: `Input exceeds maximum length of ${maxLength} characters`,
    };
  }

  // Sanitize
  let sanitized = sanitizeString(input);

  // Check for injection attempts
  if (checkInjection) {
    if (detectSQLInjection(sanitized)) {
      return {
        valid: false,
        sanitized: '',
        error: 'Input contains potentially malicious SQL patterns',
      };
    }

    if (!allowHTML && detectXSS(sanitized)) {
      return {
        valid: false,
        sanitized: '',
        error: 'Input contains potentially malicious script patterns',
      };
    }
  }

  return { valid: true, sanitized };
}

/**
 * Middleware wrapper for request size validation
 */
export function withRequestSizeValidation(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limits?: Partial<RequestSizeLimits>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateRequestSize(request, limits);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          code: 'REQUEST_TOO_LARGE',
        },
        { status: 413 }
      );
    }

    return handler(request);
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = DEFAULT_SIZE_LIMITS.maxFileSize,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize} bytes`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Rate limit identifier generator
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip.split(',')[0].trim()}`;
}
