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
  "50 Days Study Plan (Sample)",
  "Core Concepts Notes for all 8 Domains",
  "Curated Targeted Topics not to be missed",
  "Training you on how to eliminate wrong answers from the given options",
  "Domain based Quiz on Core Concepts (50 Questions for each Domain)",
  "Scenario based Questions on 8 Domains (50 Questions each)",
  "Cybersecurity Kick (800 Questions)",
  "Option to book additional paid coaching to address the learning gaps",
];

export default function FeaturesList() {
  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-2xl font-bold text-white">
        What this learning kit contains:
      </h3>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <FeatureItem key={index} text={feature} />
        ))}
      </div>
    </div>
  );
}
