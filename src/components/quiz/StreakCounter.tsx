"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  maxStreak: number;
  className?: string;
}

export function StreakCounter({
  streak,
  maxStreak,
  className,
}: StreakCounterProps) {
  if (streak === 0 && maxStreak === 0) return null;

  const isActive = streak > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
        isActive
          ? "bg-orange-500/20 border-orange-500 text-orange-300"
          : "bg-slate-800/60 border-slate-600 text-slate-400",
        className
      )}
      aria-label={`Current streak: ${streak}, Max streak: ${maxStreak}`}
    >
      <Flame
        className={cn(
          "h-4 w-4",
          isActive && "animate-pulse"
        )}
      />
      <div className="flex items-baseline gap-1 text-sm font-semibold">
        <span>{streak}</span>
        {maxStreak > 0 && (
          <>
            <span className="text-xs opacity-60">/</span>
            <span className="text-xs opacity-60">{maxStreak}</span>
          </>
        )}
      </div>
    </div>
  );
}
