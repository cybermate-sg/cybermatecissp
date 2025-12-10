import { Check } from "lucide-react";

interface FeatureItemProps {
  text: string;
}

function FeatureItem({ text }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3 text-gray-300 text-left">
      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

const features = [
  "50-Day Battle Plan – Know exactly what to study, when",
  "8-Domain Core Concept Notes – No bloat, just what passes",
  "Critical Topics Checklist – Miss nothing that matters",
  "Answer Elimination Mastery – Cut wrong answers like a pro",
  "400 Domain Quizzes – 50 targeted questions per domain",
  "400 Scenario Questions – Real-world thinking, 8 domains deep",
  "800+ Cybersecurity Drills – Exam-ready repetition",
];

export default function FeaturesList() {
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-2xl font-bold text-white">
        Your Complete CISSP Arsenal:
      </h3>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <FeatureItem key={index} text={feature} />
        ))}
      </div>

      <div className="pt-6 space-y-4">
        <p className="text-gray-300 text-left">
          Still stuck on a tough domain? Book a 1-on-1 coaching session. I'll pinpoint your weak spots and turn confusion into unstoppable confidence.
        </p>
        <a
          href="https://calendly.com/enmadhavan/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Book a 1-on-1 coaching session
        </a>
      </div>
    </div>
  );
}
