import dynamic from "next/dynamic";
import HeroSection from "@/components/sections/HeroSection";
import FeatureHighlights from "@/components/sections/FeatureHighlights";
import Testimonials from "@/components/sections/Testimonials";
import WhyStudentsPass from "@/components/sections/WhyStudentsPass";
import TrustUrgency from "@/components/sections/TrustUrgency";
import SMARTMethodology from "@/components/sections/SMARTMethodology";
import FinalCTA from "@/components/sections/FinalCTA";
import ConstructionOverlay from "@/components/ConstructionOverlay";

const ClientFloatingBadge = dynamic(
  () => import("@/components/sections/ClientFloatingBadge")
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729]">
      {/* TEMPORARY: Construction Overlay - Remove when ready to launch */}
      <ConstructionOverlay />

      {/* Floating Pass Rate Badge */}
      <ClientFloatingBadge />

      {/* Hero Section */}
      <HeroSection />

      {/* Trust + Urgency Section */}
      <TrustUrgency />

      {/* SMART Methodology Section */}
      <SMARTMethodology />

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* Social Proof / Testimonials */}
      <Testimonials />

      {/* Why Students Pass Section */}
      <WhyStudentsPass />

      {/* Final CTA Section */}
      <FinalCTA />
    </div>
  );
}
