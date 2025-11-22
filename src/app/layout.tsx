import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutWrapper from "@/components/LayoutWrapper";

// Note: Using system fonts for better build compatibility
// If Google Fonts are needed, they can be loaded via CDN in production

export const metadata: Metadata = {
  title: "CISSP Mastery - Master CISSP with Confidence-Based Learning",
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
        <body
          className="font-sans antialiased"
          suppressHydrationWarning
        >
          <LayoutWrapper>{children}</LayoutWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
