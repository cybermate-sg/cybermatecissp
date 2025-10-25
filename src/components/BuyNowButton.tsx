"use client";

import { useState } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";

interface BuyNowButtonProps {
  priceId: string;
  className?: string;
  text?: string;
}

export default function BuyNowButton({
  priceId,
  className = "",
  text = "BUY NOW"
}: BuyNowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");

  const handleCheckout = async (guestEmail?: string) => {
    try {
      setIsLoading(true);

      // Call our API to create checkout session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          email: guestEmail || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout using the URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    setShowEmailDialog(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }
    setShowEmailDialog(false);
    handleCheckout(email);
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {text}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowEmailDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">
              Enter Your Email
            </h2>
            <p className="text-gray-300 mb-6">
              We'll send you a sign-in link after your purchase is complete.
            </p>

            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
                required
                autoFocus
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Continue to Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
