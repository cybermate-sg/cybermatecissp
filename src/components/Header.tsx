"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load Clerk components to reduce initial bundle
const SignedIn = dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignedIn })), {
  ssr: false,
});

const SignedOut = dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignedOut })), {
  ssr: false,
});

const UserButton = dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.UserButton })), {
  ssr: false,
});

// Loading skeleton for auth buttons
function AuthButtonsSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-9 bg-slate-700/50 rounded animate-pulse" />
      <div className="w-20 h-9 bg-slate-700/50 rounded animate-pulse" />
    </div>
  );
}

export default function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/cybermate-logo.jpeg"
              alt="Cybermate Logo"
              width={40}
              height={40}
              className="rounded"
              quality={75}
              sizes="40px"
            />
            <div className="text-2xl font-bold">
              <span className="text-amber-400">Cybermate</span>
              <span className="text-white"> Mastery</span>
            </div>
          </Link>

          {/* Navigation and Auth buttons */}
          <Suspense fallback={<AuthButtonsSkeleton />}>
            <div className="flex items-center gap-3">
              <SignedOut>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-white hover:text-purple-400 hover:bg-slate-800">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                    Sign up
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
