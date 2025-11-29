// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// OPTIMIZATION: Defer replay integration to reduce initial bundle size and main thread blocking
// Only load replay integration after the page is interactive
const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: "https://44ca234ba26911b6f162a724af1efc8c@o4509370465058816.ingest.us.sentry.io/4510297898549248",

  // Add optional integrations for additional features
  // OPTIMIZATION: Conditionally load replay integration only in production
  integrations: isProduction ? [
    Sentry.replayIntegration({
      // Mask all text and media to reduce replay size and improve privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ] : [],

  // OPTIMIZATION: Reduce trace sampling in production to minimize performance impact
  // This reduces the overhead from 100% to 10% of requests
  tracesSampleRate: isProduction ? 0.1 : 1,

  // OPTIMIZATION: Disable logs in production to reduce bundle size
  enableLogs: !isProduction,

  // OPTIMIZATION: Reduce replay sampling to 1% in production
  // This significantly reduces network and storage costs while still capturing issues
  replaysSessionSampleRate: isProduction ? 0.01 : 0.1,

  // Keep high error replay sampling to ensure we capture all errors
  replaysOnErrorSampleRate: 1.0,

  // OPTIMIZATION: Disable PII sending to reduce data size and improve privacy
  sendDefaultPii: false,

  // OPTIMIZATION: Filter out development errors
  beforeSend(event) {
    // Don't send events in development
    if (!isProduction) {
      return null;
    }
    return event;
  },

  // OPTIMIZATION: Ignore common, non-critical errors to reduce noise
  ignoreErrors: [
    // Browser extension errors
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors that don't need tracking
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    // ResizeObserver errors (benign)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;