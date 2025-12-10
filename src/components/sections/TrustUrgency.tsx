import dynamic from "next/dynamic";
import { Check, Sparkles } from "lucide-react";

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

              <div className="grid sm:grid-cols-3 gap-8 py-8">
                <div className="space-y-2">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    $100
                  </div>
                  <div className="text-gray-400">One-time payment</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    12 Months
                  </div>
                  <div className="text-gray-400">unlimited access</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    $0
                  </div>
                  <div className="text-gray-400">No subscription</div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-2xl font-bold text-white">
                  <span className="text-gray-500">$100 USD</span> → A year of access for the price is the cherry on top.
                </p>
                <CountdownTimer />
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-2xl font-bold text-white">
                  What this learning kit contains:
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>50 Days Study Plan (Sample)</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Core Concepts Notes for all 8 Domains</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Curated Targeted Topics not to be missed</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Training you on how to eliminate wrong answers from the given options</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Domain based Quiz on Core Concepts (50 Questions for each Domain)</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Scenario based Questions on 8 Domains (50 Questions each)</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Cybersecurity Kick (800 Questions)</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300 text-left">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Option to book additional paid coaching to address the learning gaps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
