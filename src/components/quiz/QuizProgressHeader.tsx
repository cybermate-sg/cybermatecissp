"use client";

import { Progress } from "@/components/ui/progress";
import { StreakCounter } from "./StreakCounter";
import { XPDisplay } from "./XPDisplay";
import type { Level } from "@/lib/gamification/xp-system";
import { cn } from "@/lib/utils";

interface QuizProgressHeaderProps {
  progress: {
    currentQuestion: number;
    totalQuestions: number;
  };
  score: number;
  streak: {
    current: number;
    max: number;
  };
  xp: {
    total: number;
    level: Level;
    progressToNextLevel: number;
  };
  className?: string;
}

export function QuizProgressHeader({
  progress,
  score,
  streak,
  xp,
  className,
}: QuizProgressHeaderProps) {
  const progressPercentage = (progress.currentQuestion / progress.totalQuestions) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Row: All Stats on Left to avoid close button */}
      <div className="flex items-center gap-3 flex-wrap pr-12">
        <span className="text-sm font-medium text-slate-300">
          Question {progress.currentQuestion} of {progress.totalQuestions}
        </span>
        <span className="text-sm font-semibold text-white">
          Score: {score}/{progress.currentQuestion}
        </span>
        <StreakCounter streak={streak.current} maxStreak={streak.max} />
        <XPDisplay
          totalXP={xp.total}
          level={xp.level}
          progressToNextLevel={xp.progressToNextLevel}
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={progressPercentage}
          className="h-2"
          aria-label={`Quiz progress: ${progress.currentQuestion} of ${progress.totalQuestions} questions completed`}
        />
      </div>
    </div>
  );
}
