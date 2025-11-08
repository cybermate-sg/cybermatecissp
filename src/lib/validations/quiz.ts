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

// Helper function to validate quiz JSON
export function validateQuizFile(data: unknown): { success: true; data: QuizFile } | { success: false; error: string } {
  try {
    const validated = quizFileSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid quiz file format' };
  }
}
