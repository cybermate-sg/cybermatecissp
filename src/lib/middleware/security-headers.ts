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

function buildCSPDirectives(customCSP?: string): string {
  return customCSP || [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.cisspmastery.com.au https://js.stripe.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://www.googletagmanager.com https://*.google-analytics.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com https://clerk.cisspmastery.com.au https://*.xata.sh https://*.vercel.app https://*.sentry.io https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function addCSPHeaders(headers: Record<string, string>, customCSP?: string, reportOnly?: boolean) {
  const cspDirectives = buildCSPDirectives(customCSP);
  const cspHeader = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  headers[cspHeader] = cspDirectives;
}

function addSecurityPolicyHeaders(headers: Record<string, string>) {
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  headers['Permissions-Policy'] = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
  ].join(', ');
  headers['X-DNS-Prefetch-Control'] = 'on';
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';
  headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
  headers['Cross-Origin-Embedder-Policy'] = 'credentialless';
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

  if (enableCSP) {
    addCSPHeaders(headers, customCSP, reportOnly);
  }

  if (enableHSTS) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  if (enableFrameGuard) {
    headers['X-Frame-Options'] = 'DENY';
  }

  addSecurityPolicyHeaders(headers);

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
