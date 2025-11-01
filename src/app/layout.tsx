import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // Use font-display: swap for better FCP
  preload: true, // Preload the font
});

export const metadata: Metadata = {
  title: "CISSP Mastery - Master CISSP with Confidence-Based Learning",
  description: "Master CISSP certification with our confidence-based flashcard system. Adaptive spaced repetition, progress tracking, and 1000+ flashcards across 8 domains.",
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
          className={`${inter.className} antialiased`}
          suppressHydrationWarning
        >
          <Header />
          {children}
          <Footer />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
