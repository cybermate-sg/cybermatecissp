import {
  Brain,
  Target,
  BarChart3,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import SectionHeader from "../ui/SectionHeader";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  colorScheme: "purple" | "cyan";
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Smart Flashcards",
    description: "Concise, high-yield notes designed for spaced repetition. No fluff, just what you need to know.",
    colorScheme: "purple"
  },
  {
    icon: Target,
    title: "1000+ Realistic Questions",
    description: "Exam-quality practice questions with detailed explanations. Full mock exams included.",
    colorScheme: "cyan"
  },
  {
    icon: Brain,
    title: "Weakness Eliminator",
    description: "Real-time tracking spots your blind spots and drills them with precision CBK questions — no guesswork.",
    colorScheme: "purple"
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track mastery by domain. See exactly where you stand and what needs work.",
    colorScheme: "cyan"
  }
];

function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon, title, description, colorScheme } = feature;
  const isPurple = colorScheme === "purple";

  return (
    <div className={`group relative bg-gradient-to-br from-[#1a2235] to-[#0f1729] border border-gray-800 hover:border-${colorScheme}-500/50 rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-${colorScheme}-${isPurple ? '600' : '500'}/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className={`w-14 h-14 bg-gradient-to-br from-${colorScheme}-${isPurple ? '600' : '500'} to-${colorScheme}-${isPurple ? '500' : '400'} rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-${colorScheme}-500/50 transition-shadow`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function FeatureHighlights() {
  return (
    <section className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Everything You Need to"
            highlightedText="Pass First Try"
            subtitle="Stop wasting time on bloated books and outdated dumps.
My battle-tested handwritten notes + precise CBK breakdowns give you exactly what you need to master all 8 domains."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
