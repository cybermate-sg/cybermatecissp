"use client";

import { Button } from "@/components/ui/button";

interface ConfidenceRatingProps {
  onRate: (confidence: number) => void;
  disabled?: boolean;
}

const CONFIDENCE_LEVELS = [
  { value: 1, label: "Not at all", color: "bg-red-600 hover:bg-red-700", description: "I don't know this" },
  { value: 2, label: "Barely", color: "bg-orange-600 hover:bg-orange-700", description: "I barely remember" },
  { value: 3, label: "Somewhat", color: "bg-yellow-600 hover:bg-yellow-700", description: "I sort of know this" },
  { value: 4, label: "Mostly", color: "bg-lime-600 hover:bg-lime-700", description: "I know this well" },
  { value: 5, label: "Perfectly", color: "bg-green-600 hover:bg-green-700", description: "I know this perfectly" }
];

export default function ConfidenceRating({ onRate, disabled = false }: ConfidenceRatingProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          How well did you know this?
        </h3>
        <p className="text-sm text-gray-400">
          Be honest - this helps us optimize your learning
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {CONFIDENCE_LEVELS.map((level) => (
          <Button
            key={level.value}
            onClick={() => onRate(level.value)}
            disabled={disabled}
            className={`${level.color} text-white h-auto py-4 flex flex-col items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-2xl font-bold">{level.value}</span>
            <span className="text-xs font-semibold">{level.label}</span>
            <span className="text-xs opacity-90 hidden sm:block">
              {level.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
