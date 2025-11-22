import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - CISSP Mastery",
  description: "Sign in to CISSP Mastery",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return only children - ClerkProvider and html/body come from root layout
  // This layout just prevents Header/Footer from rendering on auth pages
  return <>{children}</>;
}
