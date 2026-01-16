"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2, ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isValidUrl } from "@/lib/middleware/request-validation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const priceId = searchParams.get("priceId");

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/status");
      const data = await response.json();

      if (data.hasPaidAccess) {
        // User already has paid access, redirect to dashboard
        router.push("/dashboard?message=already_subscribed");
      } else {
        setCheckingSubscription(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      // Continue to checkout on error
      setCheckingSubscription(false);
    }
  }, [router]);

  useEffect(() => {
    // Redirect to home if no priceId provided
    if (isLoaded && !priceId) {
      router.push("/");
      return;
    }

    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/checkout?priceId=${priceId}`)}`);
      return;
    }

    // Check if user already has paid access
    if (isLoaded && isSignedIn) {
      checkSubscriptionStatus();
    }
  }, [isLoaded, isSignedIn, priceId, router, checkSubscriptionStatus]);

  const handleCheckout = async () => {
    if (!priceId) {
      setError("Price ID is missing");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if API wants us to redirect (e.g., user already has paid access)
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        if (!isValidUrl(data.url, ['stripe.com'])) {
          throw new Error("Invalid checkout URL returned");
        }
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  // Show loading while checking auth or subscription
  if (!isLoaded || !isSignedIn || !priceId || checkingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-4">
          Complete Your Purchase
        </h1>

        <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300">Account:</span>
            <span className="text-white font-semibold">{user?.emailAddresses[0]?.emailAddress}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Product:</span>
            <span className="text-white font-semibold">CISSP Mastery 180-Day Access</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Proceed to Payment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancel and go back
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-xs text-gray-400 text-center">
            You will be redirected to Stripe for secure payment processing.
            Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
