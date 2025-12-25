import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutWrapper from "@/components/LayoutWrapper";
import Analytics from "@/components/Analytics";

// Note: Using system fonts for better build compatibility
// If Google Fonts are needed, they can be loaded via CDN in production

export const metadata: Metadata = {
  title: "Cybermate Professional Tranining - Master CISSP with Confidence-Based Learning",
  description: "Master CISSP certification with our confidence-based flashcard system. Adaptive spaced repetition, progress tracking, and 1000+ flashcards across 8 domains.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Preconnect to critical third-party origins to reduce DNS/TCP/TLS time */}
          <link rel="preconnect" href="https://moving-doberman-55.clerk.accounts.dev" />
          <link rel="dns-prefetch" href="https://moving-doberman-55.clerk.accounts.dev" />
        </head>
        <body
          className="font-sans antialiased"
          suppressHydrationWarning
        >
          {/* Google Tag Manager */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-N83J5BNVV9"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-N83J5BNVV9');
            `}
          </Script>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
