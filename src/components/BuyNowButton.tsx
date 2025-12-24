"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface BuyNowButtonProps {
  priceId: string;
  className?: string;
  text?: string;
  disabled?: boolean;
}

export default function BuyNowButton({
  priceId,
  className = "",
  text = "BUY NOW",
  disabled = false
}: BuyNowButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const handleButtonClick = async () => {
    // If Clerk hasn't loaded yet, do nothing
    if (!isLoaded) {
      return;
    }

    // If user is signed in, check subscription status first
    if (isSignedIn) {
      setIsChecking(true);
      try {
        const response = await fetch("/api/subscription/status");
        const data = await response.json();

        if (data.hasPaidAccess) {
          // User already has paid access, redirect to dashboard
          window.location.href = "/dashboard?message=already_subscribed";
          return;
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        // Continue to checkout on error
      } finally {
        setIsChecking(false);
      }
    }

    // Redirect to checkout page (which will handle auth check if needed)
    window.location.href = `/checkout?priceId=${priceId}`;
  };

  return (
    <button
      onClick={handleButtonClick}
      disabled={disabled || !isLoaded || isChecking}
      className={`group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      {isChecking ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          {text}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}
