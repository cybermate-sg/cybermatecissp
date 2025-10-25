import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-300 mb-8">
          Thank you for your purchase! Your payment has been processed successfully.
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
          A confirmation email has been sent to your email address.
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
