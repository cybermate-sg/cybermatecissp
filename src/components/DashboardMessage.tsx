"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, X } from "lucide-react";

export default function DashboardMessage() {
  const searchParams = useSearchParams();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "already_subscribed") {
      setShowMessage(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowMessage(false), 5000);
    }
  }, [searchParams]);

  if (!showMessage) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className="bg-green-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">You already have access!</h3>
          <p className="text-sm text-green-100">
            You already have an active subscription. No need to purchase again.
          </p>
        </div>
        <button
          onClick={() => setShowMessage(false)}
          className="text-white hover:text-green-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
