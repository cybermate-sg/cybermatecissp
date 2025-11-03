/**
 * Request validation utility with Zod integration
 *
 * Provides type-safe request validation with automatic error handling
 */

import { z, ZodError, ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import { createApiError } from './error-handler';

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/**
 * Format Zod errors into user-friendly format
 */
export function formatValidationErrors(error: ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Validate request body against Zod schema
 *
 * @throws ApiError with 400 status if validation fails
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     const data = await validateRequest(request, createClassSchema);
 *     // data is now type-safe and validated
 *   } catch (error) {
 *     return handleApiError(error, 'create class');
 *   }
 * }
 * ```
 */
export async function validateRequest<T>(
  request: Request | NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatValidationErrors(error);
      throw createApiError(
        `Validation failed: ${details[0].field} - ${details[0].message}`,
        400,
        'VALIDATION_ERROR',
        details
      );
    }
    if (error instanceof SyntaxError) {
      throw createApiError(
        'Invalid JSON in request body',
        400,
        'INVALID_JSON'
      );
    }
    throw error;
  }
}

/**
 * Validate query parameters against Zod schema
 *
 * @example
 * ```typescript
 * const params = validateQueryParams(request, z.object({
 *   limit: z.coerce.number().min(1).max(100).default(10),
 *   offset: z.coerce.number().min(0).default(0),
 * }));
 * ```
 */
export function validateQueryParams<T>(
  request: Request | NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatValidationErrors(error);
      throw createApiError(
        `Invalid query parameter: ${details[0].field} - ${details[0].message}`,
        400,
        'INVALID_QUERY_PARAMS',
        details
      );
    }
    throw error;
  }
}

/**
 * Validate route parameters (path params)
 *
 * @example
 * ```typescript
 * const { id } = validatePathParams({ id: params.id }, z.object({
 *   id: z.string().uuid(),
 * }));
 * ```
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatValidationErrors(error);
      throw createApiError(
        `Invalid path parameter: ${details[0].field} - ${details[0].message}`,
        400,
        'INVALID_PATH_PARAMS',
        details
      );
    }
    throw error;
  }
}

/**
 * Partial validation - makes all fields optional
 * Useful for PATCH/update endpoints
 *
 * @example
 * ```typescript
 * const updates = await validatePartial(request, createClassSchema);
 * // Only provided fields are validated
 * ```
 */
export async function validatePartial<T>(
  request: Request | NextRequest,
  schema: ZodSchema<T>
): Promise<Partial<T>> {
  try {
    const body = await request.json();
    const partialSchema = schema.partial();
    return partialSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatValidationErrors(error);
      throw createApiError(
        `Validation failed: ${details[0].field} - ${details[0].message}`,
        400,
        'VALIDATION_ERROR',
        details
      );
    }
    throw error;
  }
}

/**
 * Safe parse - returns result object instead of throwing
 *
 * @example
 * ```typescript
 * const result = await safeParse(request, createClassSchema);
 * if (result.success) {
 *   const data = result.data;
 * } else {
 *   const errors = result.errors;
 * }
 * ```
 */
export async function safeParse<T>(
  request: Request | NextRequest,
  schema: ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; errors: ValidationErrorDetail[] }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: formatValidationErrors(result.error),
      };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: [
          {
            field: 'body',
            message: 'Invalid JSON in request body',
            code: 'invalid_json',
          },
        ],
      };
    }
    throw error;
  }
}

// ============================================
// Common Validation Schemas
// ============================================

/**
 * Common field validators
 */
export const commonValidators = {
  // IDs
  uuid: z.string().uuid({ message: 'Must be a valid UUID' }),
  clerkUserId: z.string().min(1, 'User ID is required'),

  // Strings
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .trim(),

  shortText: z
    .string()
    .max(500, 'Text must be 500 characters or less')
    .trim()
    .optional(),

  longText: z
    .string()
    .max(5000, 'Text must be 5000 characters or less')
    .trim(),

  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),

  // Numbers
  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order must be 0 or greater')
    .optional()
    .default(0),

  positiveInt: z
    .number()
    .int('Must be an integer')
    .positive('Must be greater than 0'),

  // Booleans
  boolean: z.boolean().optional().default(false),

  // Enums
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: 'Role must be either "user" or "admin"' }),
  }),

  planType: z.enum(['free', 'pro_monthly', 'pro_yearly', 'lifetime'], {
    errorMap: () => ({
      message: 'Invalid plan type',
    }),
  }),

  subscriptionStatus: z.enum([
    'active',
    'canceled',
    'past_due',
    'trialing',
    'inactive',
  ]),

  masteryStatus: z.enum(['new', 'learning', 'mastered']),

  // Dates
  isoDate: z.string().datetime({ message: 'Must be a valid ISO date' }),

  // Email
  email: z
    .string()
    .email('Must be a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .trim()
    .toLowerCase(),

  // URLs
  url: z.string().url('Must be a valid URL').optional().nullable(),

  // Pagination
  pagination: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(10),
    offset: z.coerce
      .number()
      .int()
      .min(0, 'Offset must be 0 or greater')
      .optional()
      .default(0),
  }),

  // Colors (hex or named)
  color: z
    .string()
    .max(50, 'Color must be 50 characters or less')
    .optional()
    .nullable(),

  // Icons (emoji or icon names)
  icon: z
    .string()
    .max(100, 'Icon must be 100 characters or less')
    .optional()
    .nullable(),
};

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: commonValidators.uuid,
});

/**
 * Pagination query params validation
 */
export const paginationSchema = commonValidators.pagination;
