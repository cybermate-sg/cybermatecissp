"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Level } from "@/lib/gamification/xp-system";

interface XPDisplayProps {
  totalXP: number;
  level: Level;
  progressToNextLevel: number;
  showDetails?: boolean;
  className?: string;
}

export function XPDisplay({
  totalXP,
  level,
  progressToNextLevel,
  showDetails = false,
  className,
}: XPDisplayProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white">{totalXP} XP</span>
        </div>

        {showDetails && (
          <span className="text-xs text-slate-400 font-medium">
            {level.title}
          </span>
        )}
      </div>

      {showDetails && (
        <div className="space-y-1">
          <Progress value={progressToNextLevel} className="h-1.5" />
          <p className="text-xs text-slate-500">
            {progressToNextLevel}% to Level {level.level + 1}
          </p>
        </div>
      )}
    </div>
  );
}
