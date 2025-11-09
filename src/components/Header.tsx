import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
            />
            <div className="text-2xl font-bold">
              <span className="text-amber-400">Cybermate</span>
              <span className="text-white"> Mastery</span>
            </div>
          </Link>

          {/* Navigation and Auth buttons */}
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
        </div>
      </div>
    </header>
  );
}
