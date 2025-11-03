/**
 * Validation schemas for Deck entity
 */

import { z } from 'zod';
import { commonValidators } from '@/lib/api/validate';

/**
 * Schema for creating a new deck
 */
export const createDeckSchema = z.object({
  classId: commonValidators.uuid,
  name: commonValidators.name,
  description: commonValidators.description,
  order: commonValidators.order,
  isPremium: commonValidators.boolean,
  isPublished: commonValidators.boolean,
});

/**
 * Schema for updating an existing deck
 */
export const updateDeckSchema = createDeckSchema.partial().omit({ classId: true });

/**
 * Schema for deck query parameters
 */
export const deckQuerySchema = z.object({
  classId: commonValidators.uuid.optional(),
  isPublished: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  isPremium: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  includeFlashcards: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Schema for deck ID parameter
 */
export const deckIdSchema = z.object({
  id: commonValidators.uuid,
});

/**
 * Type exports
 */
export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type DeckQueryParams = z.infer<typeof deckQuerySchema>;
export type DeckIdParams = z.infer<typeof deckIdSchema>;
