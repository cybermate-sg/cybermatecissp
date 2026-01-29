import dynamic from "next/dynamic";
import FeatureHighlights from "@/components/sections/FeatureHighlights";
import Testimonials from "@/components/sections/Testimonials";
import WhyStudentsPass from "@/components/sections/WhyStudentsPass";
import TrustUrgency from "@/components/sections/TrustUrgency";
import SMARTMethodology from "@/components/sections/SMARTMethodology";
import FinalCTA from "@/components/sections/FinalCTA";

import { HomePageJsonLd } from "@/components/JsonLd";

// Dynamic imports for client components (bundle-dynamic-imports rule)
// HeroSection uses useAuth and is critical for LCP, but can be code-split
const HeroSection = dynamic(
  () => import("@/components/sections/HeroSection"),
  { ssr: true }
);

const ClientFloatingBadge = dynamic(
  () => import("@/components/sections/ClientFloatingBadge")
);

// NativeLanguageSupport contains heavy static data (19 countries) - code split
const NativeLanguageSupport = dynamic(
  () => import("@/components/sections/NativeLanguageSupport")
);
//import ConstructionOverlay from "@/components/ConstructionOverlay";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729]">
      {/* Structured Data for SEO */}
      <HomePageJsonLd />
      {/* TEMPORARY: Construction Overlay - Remove when ready to launch 
      <ConstructionOverlay />*/}

      {/* Native Language Support Section */}
      <NativeLanguageSupport />

      {/* Floating Pass Rate Badge */}
      <ClientFloatingBadge />

      {/* Hero Section */}
      <HeroSection />

      {/* SMART Methodology Section */}
      <SMARTMethodology />

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* Social Proof / Testimonials */}
      <Testimonials />

      {/* Why Students Pass Section */}
      <WhyStudentsPass />

      {/* Trust + Urgency Section */}
      <TrustUrgency />

      {/* Final CTA Section */}
      <FinalCTA />
    </div>
  );
}
