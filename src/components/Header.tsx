"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="border-b border-gray-700/30 bg-[#0f1729] sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/cybermate-logo-trans.png"
              alt="Cybermate Logo"
              width={40}
              height={40}
              className="rounded"
              quality={75}
              sizes="40px"
              priority
              fetchPriority="high"
            />
            <div className="text-2xl font-bold">
              <span className="text-[#B79A42]">Cybermate</span>
              <span className="text-white"> Professional Training</span>
            </div>
          </Link>

          {/* Navigation and Auth buttons */}
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
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
        </div>
      </div>
    </header>
  );
}
