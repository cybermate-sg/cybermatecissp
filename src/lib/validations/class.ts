/**
 * Validation schemas for Class (formerly Domain) entity
 */

import { z } from 'zod';
import { commonValidators } from '@/lib/api/validate';

/**
 * Schema for creating a new class
 */
export const createClassSchema = z.object({
  name: commonValidators.name,
  description: commonValidators.description,
  order: commonValidators.order,
  icon: commonValidators.icon,
  color: commonValidators.color,
  isPublished: commonValidators.boolean,
});

/**
 * Schema for updating an existing class
 */
export const updateClassSchema = createClassSchema.partial();

/**
 * Schema for class query parameters
 */
export const classQuerySchema = z.object({
  isPublished: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  includeDecks: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Schema for class ID parameter
 */
export const classIdSchema = z.object({
  id: commonValidators.uuid,
});

/**
 * Type exports
 */
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassQueryParams = z.infer<typeof classQuerySchema>;
export type ClassIdParams = z.infer<typeof classIdSchema>;
