/**
 * Quiz Gamification Hook
 * Manages streak tracking, XP calculation, and achievements for quiz sessions
 */

import { useState, useCallback, useMemo } from "react";
import {
  getCorrectMessage,
  getIncorrectMessage,
  getStreakMessage,
  getCompletionMessage,
  type MotivationalMessage,
} from "@/lib/gamification/motivational-messages";
import {
  calculateXPForAnswer,
  calculateTotalXP,
  getLevelFromXP,
  getProgressToNextLevel,
  type Level,
} from "@/lib/gamification/xp-system";
import {
  checkAchievements,
  type AchievementId,
  type QuizStats,
} from "@/lib/gamification/achievements";

export interface UseQuizGamificationOptions {
  totalQuestions: number;
}

export interface UseQuizGamificationReturn {
  // State
  currentStreak: number;
  maxStreak: number;
  totalXP: number;
  currentLevel: Level;
  progressToNextLevel: number;
  earnedAchievements: AchievementId[];
  quizStartTime: number;

  // Actions
  recordAnswer: (isCorrect: boolean) => {
    xpEarned: number;
    message: MotivationalMessage;
    streakMessage: MotivationalMessage | null;
  };
  resetSession: () => void;
  finalizeQuiz: (correctAnswers: number, firstThreeWrong: boolean) => {
    totalXP: number;
    achievements: AchievementId[];
    completionMessage: MotivationalMessage;
    stats: QuizStats;
  };
}

export function useQuizGamification(
  options: UseQuizGamificationOptions
): UseQuizGamificationReturn {
  const { totalQuestions } = options;

  // Session state (resets per quiz)
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState<AchievementId[]>(
    []
  );
  const [quizStartTime] = useState(Date.now());

  // Calculate current level
  const currentLevel = useMemo(() => getLevelFromXP(totalXP), [totalXP]);
  const progressToNextLevel = useMemo(
    () => getProgressToNextLevel(totalXP),
    [totalXP]
  );

  /**
   * Record an answer and update gamification stats
   */
  const recordAnswer = useCallback(
    (isCorrect: boolean) => {
      // Update streak
      const newStreak = isCorrect ? currentStreak + 1 : 0;
      setCurrentStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      // Calculate XP earned
      const xpEarned = calculateXPForAnswer(isCorrect, newStreak);
      setTotalXP((prev) => prev + xpEarned);

      // Get motivational message
      const message = isCorrect ? getCorrectMessage() : getIncorrectMessage();
      const streakMessage = isCorrect ? getStreakMessage(newStreak) : null;

      return {
        xpEarned,
        message,
        streakMessage,
      };
    },
    [currentStreak, maxStreak]
  );

  /**
   * Reset session state for a new quiz
   */
  const resetSession = useCallback(() => {
    setCurrentStreak(0);
    setMaxStreak(0);
    setTotalXP(0);
    setEarnedAchievements([]);
  }, []);

  /**
   * Finalize quiz and check achievements
   */
  const finalizeQuiz = useCallback(
    (correctAnswers: number, firstThreeWrong: boolean) => {
      const completionTimeSeconds = Math.floor((Date.now() - quizStartTime) / 1000);

      // Calculate final XP
      const finalTotalXP = calculateTotalXP(
        correctAnswers,
        totalQuestions,
        maxStreak
      );
      setTotalXP(finalTotalXP);

      // Build quiz stats
      const stats: QuizStats = {
        correctAnswers,
        totalQuestions,
        maxStreak,
        completionTimeSeconds,
        firstThreeWrong,
      };

      // Check achievements
      const achievements = checkAchievements(stats);
      setEarnedAchievements(achievements);

      // Get completion message
      const percentage = (correctAnswers / totalQuestions) * 100;
      const completionMessage = getCompletionMessage(percentage);

      return {
        totalXP: finalTotalXP,
        achievements,
        completionMessage,
        stats,
      };
    },
    [totalQuestions, maxStreak, quizStartTime]
  );

  return useMemo(
    () => ({
      // State
      currentStreak,
      maxStreak,
      totalXP,
      currentLevel,
      progressToNextLevel,
      earnedAchievements,
      quizStartTime,

      // Actions
      recordAnswer,
      resetSession,
      finalizeQuiz,
    }),
    [
      currentStreak,
      maxStreak,
      totalXP,
      currentLevel,
      progressToNextLevel,
      earnedAchievements,
      quizStartTime,
      recordAnswer,
      resetSession,
      finalizeQuiz,
    ]
  );
}
