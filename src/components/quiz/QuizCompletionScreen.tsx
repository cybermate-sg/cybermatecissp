"use client";

import { Trophy, Award, BookOpen, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "./ScoreCircle";
import { PerformanceStats } from "./PerformanceStats";
import { AchievementBadge } from "./AchievementBadge";
import type { AchievementId } from "@/lib/gamification/achievements";
import type { MotivationalMessage } from "@/lib/gamification/motivational-messages";
import { cn } from "@/lib/utils";

interface QuizCompletionScreenProps {
  correctAnswers: number;
  totalQuestions: number;
  maxStreak: number;
  totalXP: number;
  achievements: AchievementId[];
  completionMessage: MotivationalMessage;
  onRetake: () => void;
  onClose: () => void;
  accentColor?: "purple" | "blue";
  className?: string;
}

export function QuizCompletionScreen({
  correctAnswers,
  totalQuestions,
  maxStreak,
  totalXP,
  achievements,
  completionMessage,
  onRetake,
  onClose,
  accentColor = "purple",
  className,
}: QuizCompletionScreenProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  // Trophy icon and gradient based on performance
  const getPerformanceVisual = () => {
    if (percentage >= 90) {
      return {
        icon: Trophy,
        title: "Outstanding!",
        gradient: "from-yellow-400 to-orange-500",
        iconColor: "text-yellow-400",
      };
    }
    if (percentage >= 80) {
      return {
        icon: Trophy,
        title: "Excellent Work!",
        gradient: "from-blue-400 to-cyan-500",
        iconColor: "text-blue-400",
      };
    }
    if (percentage >= 70) {
      return {
        icon: Award,
        title: "Good Job!",
        gradient: "from-green-400 to-emerald-500",
        iconColor: "text-green-400",
      };
    }
    return {
      icon: BookOpen,
      title: "Keep Learning!",
      gradient: "from-purple-400 to-pink-500",
      iconColor: "text-purple-400",
    };
  };

  const visual = getPerformanceVisual();
  const Icon = visual.icon;

  return (
    <div className={cn("space-y-6 md:space-y-8 text-center", className)}>
      {/* Header with Trophy Icon */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "p-4 rounded-full bg-gradient-to-br",
            visual.gradient,
            "shadow-lg animate-in zoom-in-95"
          )}
        >
          <Icon className="h-12 w-12 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Quiz Completed!
          </h2>
          <p className={cn("text-xl font-semibold", visual.iconColor)}>
            {visual.title}
          </p>
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center py-4">
        <ScoreCircle percentage={percentage} size={200} />
      </div>

      {/* Completion Message */}
      <div className="flex items-center justify-center gap-2">
        <p className="text-lg text-slate-300">
          {completionMessage.text}
        </p>
        {completionMessage.emoji && (
          <span className="text-2xl">{completionMessage.emoji}</span>
        )}
      </div>

      {/* Performance Stats */}
      <PerformanceStats
        correctAnswers={correctAnswers}
        totalQuestions={totalQuestions}
        maxStreak={maxStreak}
      />

      {/* XP Earned */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30">
        <p className="text-sm text-slate-400 mb-1">Total XP Earned</p>
        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          {totalXP} XP
        </p>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Achievements Unlocked
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievementId) => (
              <AchievementBadge
                key={achievementId}
                achievementId={achievementId}
                size="md"
                showDescription
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button
          onClick={onRetake}
          variant="outline"
          className={cn(
            "gap-2 border-2",
            accentColor === "purple"
              ? "border-purple-500 text-purple-300 hover:bg-purple-500/10"
              : "border-blue-500 text-blue-300 hover:bg-blue-500/10"
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Retake Quiz
        </Button>
        <Button
          onClick={onClose}
          className={cn(
            "gap-2",
            accentColor === "purple"
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          Continue Learning
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
