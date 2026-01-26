/**
 * Fisher-Yates shuffle algorithm for randomizing array elements.
 * Creates a new shuffled array without mutating the original.
 *
 * @param array - The array to shuffle
 * @returns A new array with elements in random order
 */
export function shuffleArray<T>(array: T[]): T[] {
  // Create a copy to avoid mutating the original array
  const shuffled = [...array];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

/**
 * Shuffles the options array within each quiz question.
 * Creates new question objects with shuffled options, preserving all other properties.
 *
 * @param questions - Array of quiz questions with options
 * @returns New array with questions containing shuffled options
 */
export function shuffleQuestionOptions<T extends { options: QuizOption[] }>(
  questions: T[]
): T[] {
  return questions.map((question) => ({
    ...question,
    options: shuffleArray(question.options),
  })) as T[];
}
