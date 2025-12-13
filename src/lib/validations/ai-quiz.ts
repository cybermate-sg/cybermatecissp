import { z } from 'zod';

// ============================================
// AI QUIZ GENERATION REQUEST SCHEMAS
// ============================================

export const generateAiQuizSchema = z.object({
  topic: z.string()
    .min(3, 'Topic must be at least 3 characters')
    .max(500, 'Topic must be less than 500 characters')
    .trim(),
  generationType: z.enum(['flashcard', 'deck'], {
    errorMap: () => ({ message: 'Generation type must be either "flashcard" or "deck"' }),
  }),
  customQuestionCount: z.number()
    .int()
    .min(1, 'Must request at least 1 question')
    .max(50, 'Cannot request more than 50 questions')
    .optional(),
  targetFlashcardId: z.string()
    .uuid('Invalid flashcard ID format')
    .optional(),
  targetDeckId: z.string()
    .uuid('Invalid deck ID format')
    .optional(),
});

export const updateQuotaConfigSchema = z.object({
  dailyQuotaLimit: z.number()
    .int()
    .min(1, 'Daily quota must be at least 1')
    .max(500, 'Daily quota cannot exceed 500')
    .optional(),
  flashcardQuestionsDefault: z.number()
    .int()
    .min(1, 'Flashcard questions default must be at least 1')
    .max(50, 'Flashcard questions default cannot exceed 50')
    .optional(),
  deckQuestionsDefault: z.number()
    .int()
    .min(1, 'Deck questions default must be at least 1')
    .max(50, 'Deck questions default cannot exceed 50')
    .optional(),
  isEnabled: z.boolean().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

// ============================================
// AI QUIZ GENERATION RESPONSE SCHEMAS
// ============================================

export const quotaInfoSchema = z.object({
  dailyUsed: z.number().int().min(0),
  dailyLimit: z.number().int().min(0),
  remaining: z.number().int(),
  resetTime: z.string().datetime(),
  isEnabled: z.boolean(),
});

export const generationLogSchema = z.object({
  id: z.string().uuid(),
  adminId: z.string(),
  adminEmail: z.string().email().optional(),
  topic: z.string(),
  generationType: z.enum(['flashcard', 'deck']),
  numQuestionsGenerated: z.number().int(),
  status: z.enum(['pending', 'success', 'failed', 'partial']),
  errorMessage: z.string().nullable(),
  tokensUsed: z.number().int().nullable(),
  costUsd: z.string().nullable(), // Decimal as string
  responseTimeMs: z.number().int().nullable(),
  createdAt: z.string().datetime(),
});

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type GenerateAiQuizRequest = z.infer<typeof generateAiQuizSchema>;
export type UpdateQuotaConfigRequest = z.infer<typeof updateQuotaConfigSchema>;
export type QuotaInfo = z.infer<typeof quotaInfoSchema>;
export type GenerationLog = z.infer<typeof generationLogSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates AI quiz generation request data
 */
export function validateGenerateRequest(data: unknown): {
  success: true;
  data: GenerateAiQuizRequest;
} | {
  success: false;
  error: string;
} {
  try {
    const validated = generateAiQuizSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid request format' };
  }
}

/**
 * Validates quota config update request data
 */
export function validateQuotaConfigUpdate(data: unknown): {
  success: true;
  data: UpdateQuotaConfigRequest;
} | {
  success: false;
  error: string;
} {
  try {
    const validated = updateQuotaConfigSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Invalid update format' };
  }
}
