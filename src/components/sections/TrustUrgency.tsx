import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import StatsGrid from "./StatsGrid";
import FeaturesList from "./FeaturesList";

const CountdownTimer = dynamic(() => import("@/components/CountdownTimer"), {
  loading: () => <div className="h-16" />,
  ssr: true,
});

export default function TrustUrgency() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-transparent relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a2235] to-[#0f1729] border border-purple-500/50 rounded-3xl p-8 lg:p-12 shadow-2xl">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600/30 to-cyan-500/30 border border-purple-500/50 rounded-full">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-bold text-white">Limited Time Offer</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Be One of the First to Pass with This System
              </h2>

              <StatsGrid />

              <div className="space-y-4">
                <p className="text-2xl font-bold text-white">
                  <span className="text-gray-500">Invest $197 USD</span> → Ace CISSP in 60 days, earn $60 refund reward. Your fast-pass starts today – sign up!.
                </p>
                <CountdownTimer />
              </div>

              <FeaturesList />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
