import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern image formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Optimize for different screen sizes (reduced for smaller bundles)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Smaller image sizes for icons/thumbnails
    minimumCacheTTL: 31536000, // Cache images for 1 year (aggressive caching)
    qualities: [75, 85, 90, 100], // Supported quality values
    dangerouslyAllowSVG: false, // Disable SVG for security
    contentDispositionType: 'inline', // Inline display for better caching
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable SWC minification for faster builds and smaller bundles
    styledComponents: false,
    // Remove React properties for smaller bundle
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  // Runtime performance optimizations
  ...(process.env.NODE_ENV === 'production' && {
    productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  }),
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@clerk/nextjs',
      '@radix-ui/react-toast',
      '@sentry/nextjs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts'
    ],
    optimizeCss: true, // Optimize CSS delivery
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'], // Track all web vitals
    // Use lighter runtime for better performance
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Webpack configuration for fallbacks and optimization
  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = { async_hooks: false };

    // Optimize for better TBT
    if (!dev && !isServer) {
      // Split chunks more aggressively for better caching and parallel loading
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000, // ~244KB max for better parallel loading
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, Next.js)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              maxSize: 200000, // 200KB max chunks
            },
            // Separate chunk for Clerk authentication
            clerk: {
              name: 'clerk',
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Separate chunk for Sentry
            sentry: {
              name: 'sentry',
              test: /[\\/]node_modules[\\/]@sentry[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // UI libraries chunk
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
  // Performance optimizations
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      skipDefaultConversion: true,
    },
  },
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true, // Enable React strict mode for better error handling

  // Reduce polyfills for modern browsers to decrease bundle size
  swcMinify: true, // Use SWC for faster minification

  // Optimize output for modern browsers
  transpilePackages: [], // Only transpile what's necessary
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "inner-sharp-consulting-pty-ltd",

  project: "cissp-mastery",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload source maps only in CI/production builds to speed up local development
  widenClientFileUpload: !!process.env.CI,

  // Disable source maps functionality completely in local development for MUCH faster builds
  sourcemaps: {
    disable: !process.env.CI,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // Disabled tunnel route to improve LCP - using direct Sentry connection instead
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Disable automatic instrumentation to reduce bundle size and runtime overhead
  autoInstrumentServerFunctions: false,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: false // Disable to reduce overhead
});