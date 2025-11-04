/**
 * Validation schemas for Flashcard entity
 */

import { z } from 'zod';
import { commonValidators } from '@/lib/api/validate';

/**
 * Schema for flashcard media/images
 */
export const flashcardMediaSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  key: z.string().min(1, 'Media key is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  mimeType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/, 'Must be a valid image type'),
  placement: z.enum(['question', 'answer'], {
    message: 'Placement must be either "question" or "answer"',
  }),
  order: z.number().int().min(0, 'Order must be 0 or greater'),
  altText: z
    .string()
    .max(200, 'Alt text must be 200 characters or less')
    .optional()
    .nullable(),
});

/**
 * Schema for creating a new flashcard
 */
export const createFlashcardSchema = z.object({
  deckId: commonValidators.uuid,
  question: z
    .string()
    .min(1, 'Question is required')
    .max(5000, 'Question must be 5000 characters or less')
    .trim(),
  answer: z
    .string()
    .min(1, 'Answer is required')
    .max(5000, 'Answer must be 5000 characters or less')
    .trim(),
  explanation: z
    .string()
    .max(2000, 'Explanation must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),
  order: commonValidators.order,
  isPublished: commonValidators.boolean,
  media: z
    .array(flashcardMediaSchema)
    .max(10, 'Maximum 10 images per flashcard')
    .optional(),
});

/**
 * Schema for updating an existing flashcard
 */
export const updateFlashcardSchema = createFlashcardSchema.partial().omit({ deckId: true });

/**
 * Schema for flashcard query parameters
 */
export const flashcardQuerySchema = z.object({
  deckId: commonValidators.uuid.optional(),
  isPublished: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  includeMedia: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Schema for flashcard ID parameter
 */
export const flashcardIdSchema = z.object({
  id: commonValidators.uuid,
});

/**
 * Schema for recording flashcard progress
 */
export const updateProgressSchema = z.object({
  flashcardId: commonValidators.uuid,
  confidenceLevel: z
    .number()
    .int('Confidence level must be an integer')
    .min(1, 'Confidence level must be between 1 and 5')
    .max(5, 'Confidence level must be between 1 and 5'),
});

/**
 * Schema for study session creation
 */
export const createStudySessionSchema = z.object({
  deckId: commonValidators.uuid.optional(),
  classId: commonValidators.uuid.optional(),
});

/**
 * Schema for recording card in session
 */
export const recordSessionCardSchema = z.object({
  sessionId: commonValidators.uuid,
  flashcardId: commonValidators.uuid,
  confidenceRating: z
    .number()
    .int('Confidence rating must be an integer')
    .min(1, 'Confidence rating must be between 1 and 5')
    .max(5, 'Confidence rating must be between 1 and 5'),
  responseTime: z
    .number()
    .int('Response time must be an integer')
    .min(0, 'Response time must be 0 or greater')
    .optional(),
});

/**
 * Schema for ending study session
 */
export const endStudySessionSchema = z.object({
  sessionId: commonValidators.uuid,
});

/**
 * Type exports
 */
export type FlashcardMedia = z.infer<typeof flashcardMediaSchema>;
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type FlashcardQueryParams = z.infer<typeof flashcardQuerySchema>;
export type FlashcardIdParams = z.infer<typeof flashcardIdSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
export type RecordSessionCardInput = z.infer<typeof recordSessionCardSchema>;
export type EndStudySessionInput = z.infer<typeof endStudySessionSchema>;
