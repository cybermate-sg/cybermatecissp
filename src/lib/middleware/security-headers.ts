/**
 * Security Headers Middleware
 * Implements OWASP security best practices for HTTP headers
 *
 * References:
 * - OWASP Secure Headers Project
 * - https://owasp.org/www-project-secure-headers/
 * - OWASP A05:2021 - Security Misconfiguration
 */

import { NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableFrameGuard?: boolean;
  customCSP?: string;
  reportOnly?: boolean;
}

/**
 * Get security headers based on configuration
 */
export function getSecurityHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableFrameGuard = true,
    customCSP,
    reportOnly = false,
  } = config;

  const headers: Record<string, string> = {};

  // Content Security Policy (CSP)
  // Prevents XSS, clickjacking, and other code injection attacks
  if (enableCSP) {
    const cspDirectives = customCSP || [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.cisspmastery.com.au https://js.stripe.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com https://clerk.cisspmastery.com.au https://*.xata.sh https://*.vercel.app https://*.sentry.io",
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    const cspHeader = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    headers[cspHeader] = cspDirectives;
  }

  // HTTP Strict Transport Security (HSTS)
  // Forces HTTPS connections for 1 year, including subdomains
  if (enableHSTS) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // X-Frame-Options
  // Prevents clickjacking attacks
  if (enableFrameGuard) {
    headers['X-Frame-Options'] = 'DENY';
  }

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  headers['X-Content-Type-Options'] = 'nosniff';

  // X-XSS-Protection
  // Enables XSS filtering (legacy browsers)
  headers['X-XSS-Protection'] = '1; mode=block';

  // Referrer-Policy
  // Controls how much referrer information is shared
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

  // Permissions-Policy
  // Controls which browser features can be used
  headers['Permissions-Policy'] = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
  ].join(', ');

  // X-DNS-Prefetch-Control
  // Controls DNS prefetching
  headers['X-DNS-Prefetch-Control'] = 'on';

  // Cross-Origin-Opener-Policy
  // Prevents cross-origin attacks
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';

  // Cross-Origin-Resource-Policy
  // Controls resource loading
  // Note: Using 'cross-origin' to allow Vercel Blob images
  headers['Cross-Origin-Resource-Policy'] = 'cross-origin';

  // Cross-Origin-Embedder-Policy
  // Controls cross-origin embedding
  // Note: Using 'credentialless' to allow cross-origin images without CORP headers
  // This is more secure than 'unsafe-none' and allows Vercel Blob images to load
  headers['Cross-Origin-Embedder-Policy'] = 'credentialless';

  return headers;
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  config?: SecurityHeadersConfig
): NextResponse {
  const headers = getSecurityHeaders(config);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Get CORS headers for API routes
 */
export function getCORSHeaders(allowedOrigins: string[] = []): Record<string, string> {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigins.length > 0 ? allowedOrigins.join(', ') : origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };

  return headers;
}

/**
 * Apply CORS headers to a NextResponse
 */
export function applyCORSHeaders(
  response: NextResponse,
  allowedOrigins?: string[]
): NextResponse {
  const headers = getCORSHeaders(allowedOrigins);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware to handle CORS preflight requests
 */
export function handleCORSPreflight(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    applyCORSHeaders(response);
    return response;
  }
  return null;
}

/**
 * Complete security middleware for API routes
 */
export function withSecurityHeaders(
  response: NextResponse,
  options: {
    enableCORS?: boolean;
    allowedOrigins?: string[];
    securityConfig?: SecurityHeadersConfig;
  } = {}
): NextResponse {
  const { enableCORS = false, allowedOrigins, securityConfig } = options;

  // Apply security headers
  applySecurityHeaders(response, securityConfig);

  // Apply CORS headers if enabled
  if (enableCORS) {
    applyCORSHeaders(response, allowedOrigins);
  }

  return response;
}
