"use client";

import { CheckCircle2, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizOptionCardProps {
  option: {
    text: string;
    isCorrect: boolean;
  };
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isDisabled: boolean;
  onClick: () => void;
  accentColor?: "purple" | "blue";
}

export function QuizOptionCard({
  option,
  isSelected,
  isCorrect,
  isWrong,
  isDisabled,
  onClick,
  accentColor = "purple",
}: QuizOptionCardProps) {
  // Strip HTML tags from option text
  const cleanText = option.text.replace(/<[^>]*>/g, "").trim();

  // Determine styling based on state
  const getCardStyles = () => {
    // After submission states
    if (isCorrect) {
      return "border-green-500 bg-green-500/20 text-white cursor-default";
    }
    if (isWrong) {
      return "border-red-500 bg-red-500/20 text-white cursor-default";
    }

    // Before submission states
    if (isDisabled) {
      return "border-slate-600 bg-slate-800/40 text-slate-400 cursor-default";
    }

    if (isSelected) {
      if (accentColor === "purple") {
        return "border-purple-500 bg-purple-500/20 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40";
      }
      return "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40";
    }

    return "border-slate-600 bg-slate-800/60 text-white hover:border-slate-500 hover:bg-slate-800/80 cursor-pointer";
  };

  // Icon based on state
  const renderIcon = () => {
    if (isCorrect) {
      return <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />;
    }
    if (isWrong) {
      return <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />;
    }
    if (isSelected) {
      if (accentColor === "purple") {
        return <Circle className="h-6 w-6 text-purple-500 fill-purple-500 flex-shrink-0" />;
      }
      return <Circle className="h-6 w-6 text-blue-500 fill-blue-500 flex-shrink-0" />;
    }
    return <Circle className="h-6 w-6 text-slate-400 flex-shrink-0" />;
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full min-h-[64px] md:min-h-[72px] p-4 md:p-5 rounded-xl border-2 transition-all duration-200",
        "flex items-center gap-4 text-left",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        accentColor === "purple" ? "focus:ring-purple-500" : "focus:ring-blue-500",
        !isDisabled && !isCorrect && !isWrong && "hover:scale-[1.01]",
        getCardStyles()
      )}
      aria-label={`Option: ${cleanText}`}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
    >
      {renderIcon()}
      <span className="flex-1 text-base md:text-lg font-medium leading-relaxed">
        {cleanText}
      </span>
    </button>
  );
}
