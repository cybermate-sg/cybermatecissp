import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutWrapper from "@/components/LayoutWrapper";
import Analytics from "@/components/Analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cisspmastery.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "CISSP Mastery | Pass CISSP First Time with 98.2% Success Rate",
    template: "%s | CISSP Mastery"
  },
  description: "Master CISSP certification with our confidence-based flashcard system. 1000+ flashcards, adaptive spaced repetition, and a proven 98.2% first-time pass rate. Start your 50-day journey today.",
  keywords: [
    "CISSP",
    "CISSP certification",
    "CISSP study guide",
    "CISSP practice questions",
    "CISSP flashcards",
    "CISSP exam prep",
    "cybersecurity certification",
    "ISC2 CISSP",
    "CISSP training",
    "pass CISSP first time",
    "CISSP course online",
    "information security certification"
  ],
  authors: [{ name: "Raju Ragavan", url: "https://www.linkedin.com/in/rajuragavan/" }],
  creator: "Cybermate Professional Training",
  publisher: "Cybermate Consulting",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'CISSP Mastery',
    title: 'CISSP Mastery | Pass CISSP First Time with 98.2% Success Rate',
    description: 'Master CISSP certification with our confidence-based flashcard system. 1000+ flashcards, adaptive spaced repetition, and a proven 98.2% first-time pass rate.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CISSP Mastery - Pass CISSP Certification on Your First Attempt',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CISSP Mastery | Pass CISSP First Time with 98.2% Success Rate',
    description: 'Master CISSP certification with our confidence-based flashcard system. 1000+ flashcards and a proven 98.2% first-time pass rate.',
    images: ['/images/og-image.png'],
    creator: '@cybermateconsulting',
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: 'education',
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
          className={`${inter.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <GoogleAnalytics gaId="G-N83J5BNVV9" />
          <LayoutWrapper>{children}</LayoutWrapper>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
