/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and secure
 *
 * References:
 * - OWASP A05:2021 - Security Misconfiguration
 * - OWASP A02:2021 - Cryptographic Failures
 */

import { z } from 'zod';

/**
 * Define required environment variables schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  POSTGRES_URL: z.string().optional(),

  // Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // Payment (Stripe)
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_LIFETIME_PRICE_ID: z.string().min(1),

  // Caching (Vercel KV)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // Error Tracking (Sentry)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Optional: Diagnostics
  DIAGNOSTICS_KEY: z.string().optional(),

  // Optional: SIEM
  SIEM_ENDPOINT: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    console.log('[Security] Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Security] Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Environment variable validation failed');
    }
    throw error;
  }
}

/**
 * Check for insecure configurations
 */
export function checkSecurityConfig(): {
  secure: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check if running in production
  const isProduction = process.env.NODE_ENV === 'production';

  // Check HTTPS enforcement
  if (isProduction && !process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
    warnings.push('Production app URL should use HTTPS');
  }

  // Check for default/weak secrets (common patterns)
  const secretKeys = [
    'CLERK_SECRET_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CLERK_WEBHOOK_SECRET',
  ];

  secretKeys.forEach((key) => {
    const value = process.env[key];
    if (value) {
      // Check for common test/default values
      if (
        value.includes('test') ||
        value.includes('demo') ||
        value.includes('example') ||
        value.length < 20
      ) {
        warnings.push(`${key} appears to be a test/weak value`);
      }
    }
  });

  // Check for exposed secrets in public vars
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      const value = process.env[key];
      if (value && (
        value.includes('secret') ||
        value.includes('key') ||
        value.includes('token')
      )) {
        warnings.push(`${key} may contain sensitive data (public variable)`);
      }
    }
  });

  // Check Redis configuration in production
  if (isProduction && (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)) {
    warnings.push('Redis (KV) not configured in production - rate limiting may not work');
  }

  return {
    secure: warnings.length === 0,
    warnings,
  };
}

/**
 * Sanitize environment variable value for logging
 */
export function sanitizeEnvValue(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  // Show first 4 and last 4 characters
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

/**
 * Log environment configuration (safely)
 */
export function logEnvConfig(): void {
  const config = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '✓ (configured)' : '✗ (missing)',
    CLERK_AUTH: process.env.CLERK_SECRET_KEY ? '✓' : '✗',
    STRIPE: process.env.STRIPE_SECRET_KEY ? '✓' : '✗',
    REDIS_KV: process.env.KV_REST_API_URL ? '✓' : '✗',
    SENTRY: process.env.NEXT_PUBLIC_SENTRY_DSN ? '✓' : '✗',
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  console.log('[Security] Environment configuration:', config);

  // Check security
  const securityCheck = checkSecurityConfig();
  if (!securityCheck.secure) {
    console.warn('[Security] Configuration warnings:');
    securityCheck.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`);
    });
  }
}

/**
 * Ensure required secrets are present
 */
export function requireSecrets(secrets: string[]): void {
  const missing: string[] = [];

  secrets.forEach((secret) => {
    if (!process.env[secret]) {
      missing.push(secret);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get safe environment info for client
 */
export function getPublicEnvInfo(): {
  environment: string;
  appUrl: string;
  features: {
    analytics: boolean;
    errorTracking: boolean;
  };
} {
  return {
    environment: process.env.NODE_ENV || 'unknown',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    features: {
      analytics: false, // Not implemented yet
      errorTracking: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
  };
}

/**
 * Validate database connection string
 */
export function validateDatabaseUrl(url: string): {
  valid: boolean;
  error?: string;
  info?: {
    protocol: string;
    host: string;
    database: string;
    ssl: boolean;
  };
} {
  try {
    const parsed = new URL(url);

    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'Invalid database protocol (must be postgres or postgresql)',
      };
    }

    return {
      valid: true,
      info: {
        protocol: parsed.protocol,
        host: parsed.hostname,
        database: parsed.pathname.substring(1),
        ssl: parsed.searchParams.has('sslmode'),
      },
    };
  } catch {
    return {
      valid: false,
      error: 'Invalid database URL format',
    };
  }
}

// Run validation on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
    logEnvConfig();
  } catch (error) {
    console.error('[Security] Failed to validate environment:', error);
    if (process.env.NODE_ENV === 'production') {
      // In production, fail hard if environment is invalid
      process.exit(1);
    }
  }
}
