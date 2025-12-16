/**
 * XP System for Quiz Gamification
 * Handles experience points calculation and leveling
 */

export const XP_CONFIG = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: 5,
  PERFECT_QUIZ_BONUS: 50,
  STREAK_BONUS_MULTIPLIER: 2, // Extra XP for streak milestones
};

export interface Level {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string; // Tailwind color class
}

export const LEVELS: Level[] = [
  {
    level: 1,
    title: "Security Novice",
    minXP: 0,
    maxXP: 49,
    color: "slate",
  },
  {
    level: 2,
    title: "Security Apprentice",
    minXP: 50,
    maxXP: 149,
    color: "blue",
  },
  {
    level: 3,
    title: "Security Analyst",
    minXP: 150,
    maxXP: 299,
    color: "cyan",
  },
  {
    level: 4,
    title: "Security Expert",
    minXP: 300,
    maxXP: 499,
    color: "purple",
  },
  {
    level: 5,
    title: "CISSP Pro",
    minXP: 500,
    maxXP: Infinity,
    color: "yellow",
  },
];

/**
 * Calculate XP earned for an answer
 */
export function calculateXPForAnswer(
  isCorrect: boolean,
  streak: number = 0
): number {
  const baseXP = isCorrect ? XP_CONFIG.CORRECT_ANSWER : XP_CONFIG.WRONG_ANSWER;

  // Bonus XP for streak milestones
  const streakBonus =
    isCorrect && [3, 5, 7, 10].includes(streak)
      ? XP_CONFIG.STREAK_BONUS_MULTIPLIER * streak
      : 0;

  return baseXP + streakBonus;
}

/**
 * Calculate total XP for a quiz session
 */
export function calculateTotalXP(
  correctAnswers: number,
  totalQuestions: number,
  maxStreak: number = 0
): number {
  const correctXP = correctAnswers * XP_CONFIG.CORRECT_ANSWER;
  const wrongXP = (totalQuestions - correctAnswers) * XP_CONFIG.WRONG_ANSWER;

  // Perfect quiz bonus
  const perfectBonus =
    correctAnswers === totalQuestions ? XP_CONFIG.PERFECT_QUIZ_BONUS : 0;

  return correctXP + wrongXP + perfectBonus;
}

/**
 * Get current level based on total XP
 */
export function getLevelFromXP(totalXP: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Calculate progress percentage to next level
 */
export function getProgressToNextLevel(totalXP: number): number {
  const currentLevel = getLevelFromXP(totalXP);

  // If max level, return 100%
  if (currentLevel.level === LEVELS.length) {
    return 100;
  }

  const currentLevelMinXP = currentLevel.minXP;
  const nextLevelMinXP = currentLevel.maxXP + 1;
  const xpInCurrentLevel = totalXP - currentLevelMinXP;
  const xpNeededForNextLevel = nextLevelMinXP - currentLevelMinXP;

  return Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100);
}

/**
 * Get XP needed for next level
 */
export function getXPToNextLevel(totalXP: number): number {
  const currentLevel = getLevelFromXP(totalXP);

  // If max level, return 0
  if (currentLevel.level === LEVELS.length) {
    return 0;
  }

  return currentLevel.maxXP + 1 - totalXP;
}
