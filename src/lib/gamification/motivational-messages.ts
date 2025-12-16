/**
 * Motivational Messages for Quiz Gamification
 * Provides randomized encouraging feedback based on performance
 */

export interface MotivationalMessage {
  text: string;
  emoji?: string;
}

export const correctMessages: MotivationalMessage[] = [
  { text: "Excellent!", emoji: "✨" },
  { text: "You got it!", emoji: "🎯" },
  { text: "Perfect reasoning!", emoji: "🧠" },
  { text: "Well done!", emoji: "👏" },
  { text: "Brilliant!", emoji: "💡" },
  { text: "Spot on!", emoji: "✅" },
  { text: "Outstanding!", emoji: "⭐" },
  { text: "Nailed it!", emoji: "🔨" },
  { text: "Impressive!", emoji: "💪" },
  { text: "You're a pro!", emoji: "🏆" },
];

export const incorrectMessages: MotivationalMessage[] = [
  { text: "Almost there!", emoji: "💪" },
  { text: "Good attempt!", emoji: "👍" },
  { text: "Keep learning!", emoji: "📚" },
  { text: "Try again!", emoji: "🔄" },
  { text: "You'll get the next one!", emoji: "⭐" },
  { text: "Learning is a journey!", emoji: "🚀" },
  { text: "Every mistake is progress!", emoji: "📈" },
  { text: "Keep pushing forward!", emoji: "💫" },
  { text: "You're getting better!", emoji: "🌟" },
  { text: "Don't give up!", emoji: "💪" },
];

export const streakMessages: Record<number, MotivationalMessage> = {
  3: { text: "3 in a row!", emoji: "🔥" },
  5: { text: "Unstoppable!", emoji: "⚡" },
  7: { text: "You're on fire!", emoji: "🔥" },
  10: { text: "Legendary streak!", emoji: "👑" },
};

export const completionMessages = {
  perfect: { text: "Perfect score! You're a CISSP master!", emoji: "🏆" },
  excellent: { text: "Excellent work! Keep it up!", emoji: "🌟" },
  good: { text: "Good job! You're making progress!", emoji: "👍" },
  needsWork: { text: "Keep studying! You'll get there!", emoji: "📚" },
};

/**
 * Get a random motivational message for correct answer
 */
export function getCorrectMessage(): MotivationalMessage {
  return correctMessages[Math.floor(Math.random() * correctMessages.length)];
}

/**
 * Get a random motivational message for incorrect answer
 */
export function getIncorrectMessage(): MotivationalMessage {
  return incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
}

/**
 * Get streak milestone message if applicable
 */
export function getStreakMessage(streak: number): MotivationalMessage | null {
  return streakMessages[streak] || null;
}

/**
 * Get completion message based on score percentage
 */
export function getCompletionMessage(
  percentage: number
): MotivationalMessage {
  if (percentage === 100) return completionMessages.perfect;
  if (percentage >= 80) return completionMessages.excellent;
  if (percentage >= 60) return completionMessages.good;
  return completionMessages.needsWork;
}
