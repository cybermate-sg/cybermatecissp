/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 *
 * This is the perfect place to initialize:
 * - Database connection warmup
 * - Performance monitoring
 * - Any server-side initialization
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for Node.js runtime
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Organization: inner-sharp-consulting-pty-ltd
      // Project: cissp-mastery

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        // Filter out sensitive data from request
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-clerk-auth'];
        }

        // Filter out sensitive data from context
        if (event.contexts?.user) {
          delete event.contexts.user.email;
          delete event.contexts.user.ip_address;
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
      ],
    });

    // Import and start database warmup
    const { startWarmup } = await import('./lib/db/warmup');
    startWarmup();

    console.log('[Instrumentation] Server initialized with:');
    console.log('  ✅ Sentry monitoring enabled');
    console.log('  ✅ Database connection warmup enabled');
    console.log('  ✅ Performance monitoring active');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialize Sentry for Edge runtime
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Organization: inner-sharp-consulting-pty-ltd
      // Project: cissp-mastery

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
  }
) {
  Sentry.captureException(err, {
    contexts: {
      nextjs: {
        request_path: request.path,
        router_kind: context.routerKind,
        router_path: context.routePath,
        route_type: context.routeType,
      },
    },
  });
}
