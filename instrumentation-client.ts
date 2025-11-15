// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Defer Sentry initialization to reduce TBT
if (typeof window !== 'undefined') {
  // Wait for page load to complete before initializing Sentry
  if (document.readyState === 'complete') {
    deferSentryInit();
  } else {
    window.addEventListener('load', deferSentryInit);
  }
}

function deferSentryInit() {
  // Use requestIdleCallback to initialize Sentry during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initializeSentry(), { timeout: 3000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(initializeSentry, 2000);
  }
}

function initializeSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Organization: inner-sharp-consulting-pty-ltd
    // Project: cissp-mastery

    // Reduced trace sample rate for better performance
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 0.5,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.01,

    // Lazy load replay integration
    integrations: [],

  // Improve performance by only tracking important transactions
  beforeSendTransaction(transaction) {
    // Only send page loads and navigation transactions
    if (transaction.contexts?.trace?.op === 'pageload' ||
        transaction.contexts?.trace?.op === 'navigation') {
      return transaction;
    }
    // Drop other transactions to reduce overhead
    return null;
  },

  // Filter out sensitive data
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Filter out sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    return event;
  },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
}
