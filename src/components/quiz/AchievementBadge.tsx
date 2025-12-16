"use client";

import { cn } from "@/lib/utils";
import { ACHIEVEMENTS, getRarityColor, type AchievementId } from "@/lib/gamification/achievements";

interface AchievementBadgeProps {
  achievementId: AchievementId;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}

export function AchievementBadge({
  achievementId,
  size = "md",
  showDescription = false,
  className,
}: AchievementBadgeProps) {
  const achievement = ACHIEVEMENTS[achievementId];
  const Icon = achievement.icon;
  const rarityClass = getRarityColor(achievement.rarity);

  const sizeClasses = {
    sm: "p-2 gap-2",
    md: "p-3 gap-3",
    lg: "p-4 gap-4",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:scale-105 animate-in zoom-in-95",
        sizeClasses[size],
        rarityClass,
        className
      )}
      role="status"
      aria-label={`Achievement unlocked: ${achievement.title}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center rounded-full",
            size === "lg" ? "p-2" : "p-1.5",
            `bg-${achievement.color}-500/20`
          )}
        >
          <Icon className={cn(iconSizes[size], `text-${achievement.color}-400`)} />
        </div>

        <div className="flex-1 min-w-0">
          <h5
            className={cn(
              "font-semibold truncate",
              textSizes[size],
              `text-${achievement.color}-300`
            )}
          >
            {achievement.title}
          </h5>
          {showDescription && (
            <p className={cn("text-slate-400 truncate", textSizes[size])}>
              {achievement.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
