import { Suspense } from "react";
import { Check, Shield, Sparkles, LucideIcon } from "lucide-react";
import { FinalCTAButtons } from "./FinalCTAButtons";

function CTAPlaceholder() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-10 py-5 rounded-full animate-pulse h-16 w-80" />
    </div>
  );
}

interface TrustBadgeProps {
  icon: LucideIcon;
  text: string;
  iconColor: string;
}

function TrustBadge({ icon: Icon, text, iconColor }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <span>{text}</span>
    </div>
  );
}

export default function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
            Ready to Pass CISSP on{" "}
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Your First Attempt?
            </span>
          </h2>

          <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto">
            Stop wasting time with outdated study materials. Join the smartest CISSP prep platform and get certified faster.
          </p>

          <Suspense fallback={<CTAPlaceholder />}>
            <FinalCTAButtons />
          </Suspense>

          <div className="pt-8 flex flex-wrap gap-6 justify-center items-center text-sm text-gray-400">
            <TrustBadge icon={Shield} text="Secure Payment" iconColor="text-green-400" />
            <div className="w-px h-4 bg-gray-700" />
            <TrustBadge icon={Check} text="12 Months Full Access" iconColor="text-green-400" />
            <div className="w-px h-4 bg-gray-700" />
            <TrustBadge icon={Sparkles} text="Instant Access" iconColor="text-purple-400" />
          </div>

          <p className="text-gray-500 text-sm max-w-2xl mx-auto pt-8">
            By purchasing, you agree to our terms of service. We respect your privacy and will never share your information. Questions? Contact us anytime at support@cybermateconsulting.com
          </p>
        </div>
      </div>
    </section>
  );
}
