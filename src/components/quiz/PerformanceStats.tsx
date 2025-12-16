"use client";

import { CheckCircle2, XCircle, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceStatsProps {
  correctAnswers: number;
  totalQuestions: number;
  maxStreak: number;
  className?: string;
}

export function PerformanceStats({
  correctAnswers,
  totalQuestions,
  maxStreak,
  className,
}: PerformanceStatsProps) {
  const incorrectAnswers = totalQuestions - correctAnswers;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  const stats = [
    {
      label: "Correct",
      value: correctAnswers,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      label: "Incorrect",
      value: incorrectAnswers,
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      label: "Accuracy",
      value: `${accuracy}%`,
      icon: Target,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
    },
    {
      label: "Best Streak",
      value: maxStreak,
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4", className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border",
              stat.bgColor,
              stat.borderColor
            )}
          >
            <Icon className={cn("h-6 w-6 mb-2", stat.color)} />
            <span className="text-2xl font-bold text-white mb-1">
              {stat.value}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {stat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
