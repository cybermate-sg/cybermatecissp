import { z } from 'zod';

// Quiz option schema
export const quizOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

// Quiz question schema
export const quizQuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  options: z
    .array(quizOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed')
    .refine(
      (options) => options.filter((o) => o.isCorrect).length >= 1,
      'At least one correct answer is required'
    )
    .refine(
      (options) => options.filter((o) => o.isCorrect).length <= options.length,
      'Cannot have more correct answers than total options'
    ),
  explanation: z.string().optional(),
  elimination_tactics: z.record(z.string(), z.string()).optional(), // Object with option text as key, elimination reason as value
  correct_answer_with_justification: z.record(z.string(), z.string()).optional(), // Object with correct option as key, justification as value
  compare_remaining_options_with_justification: z.record(z.string(), z.string()).optional(), // Object comparing remaining options after elimination
  correct_options_justification: z.record(z.string(), z.string()).optional(), // Object with correct option as key, detailed justification as value
});

// Quiz file schema (for JSON upload)
export const quizFileSchema = z.object({
  questions: z
    .array(quizQuestionSchema)
    .min(1, 'At least one question is required')
    .max(50, 'Maximum 50 questions per upload'),
});

// TypeScript types
export type QuizOption = z.infer<typeof quizOptionSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizFile = z.infer<typeof quizFileSchema>;

// Schema for updating a quiz question (excludes order - read-only field)
export const quizQuestionUpdateSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  options: z
    .array(quizOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed')
    .refine(
      (options) => options.filter((o) => o.isCorrect).length >= 1,
      'At least one correct answer is required'
    ),
  explanation: z.string().optional(),
  eliminationTactics: z.record(z.string(), z.string()).optional(),
  correctAnswerWithJustification: z.record(z.string(), z.string()).optional(),
  compareRemainingOptionsWithJustification: z.record(z.string(), z.string()).optional(),
  correctOptionsJustification: z.record(z.string(), z.string()).optional(),
});

// Deck quiz update schema includes difficulty field
export const deckQuizQuestionUpdateSchema = quizQuestionUpdateSchema.extend({
  difficulty: z.number().min(1).max(5).optional().nullable(),
});

// TypeScript types for updates
export type QuizQuestionUpdate = z.infer<typeof quizQuestionUpdateSchema>;
export type DeckQuizQuestionUpdate = z.infer<typeof deckQuizQuestionUpdateSchema>;

// Helper function to validate quiz JSON
export function validateQuizFile(data: unknown): { success: true; data: QuizFile } | { success: false; error: string } {
  try {
    const validated = quizFileSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid quiz file format' };
  }
}

// Helper function to validate quiz question update
export function validateQuizQuestionUpdate(
  data: unknown,
  isDeckQuiz = false
): { success: true; data: QuizQuestionUpdate | DeckQuizQuestionUpdate } | { success: false; error: string } {
  try {
    const schema = isDeckQuiz ? deckQuizQuestionUpdateSchema : quizQuestionUpdateSchema;
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid quiz question format' };
  }
}
