"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreCircle({
  percentage,
  size = 200,
  strokeWidth = 12,
  className,
}: ScoreCircleProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate percentage on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  // Color based on performance
  const getColor = () => {
    if (percentage >= 90) return "text-yellow-400"; // Gold
    if (percentage >= 80) return "text-blue-400"; // Silver/Blue
    if (percentage >= 70) return "text-green-400"; // Bronze/Green
    return "text-purple-400"; // Default
  };

  const getStrokeColor = () => {
    if (percentage >= 90) return "#facc15"; // yellow-400
    if (percentage >= 80) return "#60a5fa"; // blue-400
    if (percentage >= 70) return "#4ade80"; // green-400
    return "#c084fc"; // purple-400
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: "drop-shadow(0 0 8px currentColor)",
          }}
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-5xl font-bold", getColor())}>
          {Math.round(animatedPercentage)}%
        </span>
      </div>
    </div>
  );
}
