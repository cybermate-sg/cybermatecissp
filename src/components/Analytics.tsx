'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';

export default function Analytics() {
  return (
    <SpeedInsights
      sampleRate={0.1}
      beforeSend={(event) => {
        // Safety check for window object
        if (typeof window === 'undefined') return event;

        const pathname = window.location.pathname;
        // Return null to drop events from admin/api routes, otherwise return the event
        return !pathname.startsWith('/admin') && !pathname.startsWith('/api') ? event : null;
      }}
    />
  );
}
