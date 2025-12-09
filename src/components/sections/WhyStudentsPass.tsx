import {
  Brain,
  Target,
  Zap,
  TrendingUp,
  LucideIcon,
} from "lucide-react";
import SectionHeader from "../ui/SectionHeader";

interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
  colorScheme: "purple" | "cyan";
}

const reasons: Reason[] = [
  {
    icon: Zap,
    title: "No Rote Memorization",
    description: "Focus on understanding concepts, not mindless cramming. The exam tests thinking, not recall.",
    colorScheme: "purple"
  },
  {
    icon: Target,
    title: "Laser-Focused Practice",
    description: "Skip what you know. Double down only on what you don’t — real-time tracking keeps you in the danger zones until they disappear.",
    colorScheme: "cyan"
  },
  {
    icon: Brain,
    title: "Core Concept Based Questions",
    description: "Practice with questions that mirror the real CISSP format, difficulty, and thinking style.",
    colorScheme: "purple"
  },
  {
    icon: TrendingUp,
    title: "Lifetime Updates",
    description: "CISSP evolves. So does our content. You get every update, forever, at no extra cost.",
    colorScheme: "cyan"
  }
];

function ReasonCard({ reason }: { reason: Reason }) {
  const { icon: Icon, title, description, colorScheme } = reason;
  const isPurple = colorScheme === "purple";

  return (
    <div className="text-center space-y-4">
      <div className={`w-16 h-16 bg-gradient-to-br from-${colorScheme}-${isPurple ? '600' : '500'} to-${colorScheme}-${isPurple ? '500' : '400'} rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-${colorScheme}-500/50`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function WhyStudentsPass() {
  return (
    <section className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Why Students Pass on"
            highlightedText="Their First Attempt"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((reason, index) => (
              <ReasonCard key={index} reason={reason} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
