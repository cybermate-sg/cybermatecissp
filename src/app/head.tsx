export default function Head() {
  return (
    <>
      {/* Preload hero image for faster LCP */}
      <link rel="preload" as="image" href="/images/raju.jpg" fetchPriority="high" />

      {/* OPTIMIZATION: Preconnect to critical third-party domains for faster resource loading */}
      {/* Clerk authentication - preconnect for faster avatar/profile images */}
      <link rel="preconnect" href="https://img.clerk.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://images.clerk.dev" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://clerk.com" />

      {/* Vercel Blob Storage - preconnect for flashcard images (major LCP improvement) */}
      <link
        rel="preconnect"
        href="https://y5u6hqy1qkvsmk2y.public.blob.vercel-storage.com"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://vercel-storage.com" />

      {/* Sentry error tracking - dns-prefetch only (non-critical) */}
      <link rel="dns-prefetch" href="https://o4509370465058816.ingest.us.sentry.io" />

      {/* Inline critical CSS for instant rendering */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; }
            .min-h-screen { min-height: 100vh; }
            /* Prevent layout shift for header */
            header { height: 64px; }
          `,
        }}
      />
    </>
  );
}
