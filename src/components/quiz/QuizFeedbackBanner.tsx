"use client";

import { CheckCircle2, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MotivationalMessage } from "@/lib/gamification/motivational-messages";

interface QuizFeedbackBannerProps {
  isCorrect: boolean;
  message: MotivationalMessage;
  xpEarned: number;
  streakMessage?: MotivationalMessage | null;
  accentColor?: "purple" | "blue";
  className?: string;
}

export function QuizFeedbackBanner({
  isCorrect,
  message,
  xpEarned,
  streakMessage,
  accentColor = "purple",
  className,
}: QuizFeedbackBannerProps) {
  return (
    <div
      className={cn(
        "mt-6 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 animate-in slide-in-from-bottom-2",
        isCorrect
          ? "bg-green-500/10 border-green-500/50"
          : "bg-orange-500/10 border-orange-500/50",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        {isCorrect ? (
          <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-6 w-6 text-orange-400 flex-shrink-0 mt-0.5" />
        )}

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-lg font-semibold",
                isCorrect ? "text-green-300" : "text-orange-300"
              )}
            >
              {message.text}
            </span>
            {message.emoji && (
              <span className="text-lg">{message.emoji}</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* XP Earned */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/20 border border-yellow-500/30">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">
                +{xpEarned} XP
              </span>
            </div>

            {/* Streak Message */}
            {streakMessage && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md border",
                  accentColor === "purple"
                    ? "bg-purple-500/20 border-purple-500/30"
                    : "bg-blue-500/20 border-blue-500/30"
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    accentColor === "purple" ? "text-purple-300" : "text-blue-300"
                  )}
                >
                  {streakMessage.text}
                </span>
                {streakMessage.emoji && (
                  <span className="text-sm">{streakMessage.emoji}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
