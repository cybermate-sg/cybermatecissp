/**
 * Achievement System for Quiz Gamification
 * Defines achievements and logic for unlocking them
 */

import { Award, Trophy, Star, Zap, Target, Shield, Flame } from "lucide-react";

export type AchievementId =
  | "first_blood"
  | "perfect_score"
  | "speed_demon"
  | "comeback_kid"
  | "streak_master"
  | "domain_master"
  | "quiz_veteran"
  | "hundred_percent";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: typeof Award;
  color: string; // Tailwind color class
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_blood: {
    id: "first_blood",
    title: "First Blood",
    description: "Get your first correct answer",
    icon: Target,
    color: "green",
    rarity: "common",
  },
  perfect_score: {
    id: "perfect_score",
    title: "Perfect Score",
    description: "Complete a quiz with 100% accuracy",
    icon: Trophy,
    color: "yellow",
    rarity: "epic",
  },
  speed_demon: {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Complete a quiz in under 2 minutes",
    icon: Zap,
    color: "cyan",
    rarity: "rare",
  },
  comeback_kid: {
    id: "comeback_kid",
    title: "Comeback Kid",
    description: "Score 80%+ after getting the first 3 wrong",
    icon: Shield,
    color: "purple",
    rarity: "epic",
  },
  streak_master: {
    id: "streak_master",
    title: "Streak Master",
    description: "Achieve a 10-question streak",
    icon: Flame,
    color: "orange",
    rarity: "rare",
  },
  domain_master: {
    id: "domain_master",
    title: "Domain Master",
    description: "Score 90%+ on all quizzes in a domain",
    icon: Award,
    color: "blue",
    rarity: "legendary",
  },
  quiz_veteran: {
    id: "quiz_veteran",
    title: "Quiz Veteran",
    description: "Complete 50 quizzes",
    icon: Star,
    color: "purple",
    rarity: "rare",
  },
  hundred_percent: {
    id: "hundred_percent",
    title: "The Perfectionist",
    description: "Achieve 100% on 10 different quizzes",
    icon: Trophy,
    color: "yellow",
    rarity: "legendary",
  },
};

export interface QuizStats {
  correctAnswers: number;
  totalQuestions: number;
  maxStreak: number;
  completionTimeSeconds: number;
  firstThreeWrong: boolean;
}

/**
 * Check which achievements were unlocked in this quiz session
 */
export function checkAchievements(stats: QuizStats): AchievementId[] {
  const unlocked: AchievementId[] = [];
  const percentage = (stats.correctAnswers / stats.totalQuestions) * 100;

  // First Blood - at least one correct
  if (stats.correctAnswers > 0) {
    unlocked.push("first_blood");
  }

  // Perfect Score - 100% accuracy
  if (percentage === 100) {
    unlocked.push("perfect_score");
  }

  // Speed Demon - complete under 2 minutes
  if (stats.completionTimeSeconds < 120) {
    unlocked.push("speed_demon");
  }

  // Comeback Kid - 80%+ after first 3 wrong
  if (stats.firstThreeWrong && percentage >= 80) {
    unlocked.push("comeback_kid");
  }

  // Streak Master - 10 question streak
  if (stats.maxStreak >= 10) {
    unlocked.push("streak_master");
  }

  return unlocked;
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Achievement["rarity"]): string {
  switch (rarity) {
    case "common":
      return "text-gray-400 border-gray-400";
    case "rare":
      return "text-blue-400 border-blue-400";
    case "epic":
      return "text-purple-400 border-purple-400";
    case "legendary":
      return "text-yellow-400 border-yellow-400";
  }
}
