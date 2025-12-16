"use client";

import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestionHeaderProps {
  questionText: string;
  questionNumber: number;
  className?: string;
}

export function QuizQuestionHeader({
  questionText,
  questionNumber,
  className,
}: QuizQuestionHeaderProps) {
  // Strip HTML tags but preserve line breaks
  const cleanText = questionText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex-shrink-0">
          <HelpCircle className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-400">
          Question {questionNumber}
        </span>
      </div>

      <h3 className="text-xl md:text-2xl font-semibold text-white leading-relaxed whitespace-pre-wrap">
        {cleanText}
      </h3>
    </div>
  );
}
