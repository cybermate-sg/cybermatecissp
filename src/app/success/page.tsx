"use client";

import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SuccessPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/success");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-300 mb-2">
          Thank you for your purchase, {user?.firstName || 'there'}!
        </p>

        <p className="text-gray-300 mb-8">
          Your payment has been processed successfully.
          You now have full access to CISSP Mastery.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          A confirmation email has been sent to {user?.emailAddresses[0]?.emailAddress}.
        </p>
      </div>
    </div>
  );
}
