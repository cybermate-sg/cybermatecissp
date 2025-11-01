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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Optimize for different screen sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Smaller image sizes for icons/thumbnails
    minimumCacheTTL: 60, // Cache images for 60 seconds minimum
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@clerk/nextjs'],
    optimizeCss: true, // Optimize CSS delivery
  },
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true, // Enable React strict mode for better error handling
};

export default nextConfig;
