/**
 * Validation schemas for User, Subscription, and Payment entities
 */

import { z } from 'zod';
import { commonValidators } from '@/lib/api/validate';

/**
 * Schema for user creation (from Clerk webhook)
 */
export const createUserSchema = z.object({
  clerkUserId: commonValidators.clerkUserId,
  email: commonValidators.email,
  name: z
    .string()
    .max(255, 'Name must be 255 characters or less')
    .trim()
    .optional()
    .nullable(),
  linkedinId: z
    .string()
    .max(255, 'LinkedIn ID must be 255 characters or less')
    .optional()
    .nullable(),
  role: commonValidators.role.optional().default('user'),
});

/**
 * Schema for updating user
 */
export const updateUserSchema = createUserSchema.partial().omit({
  clerkUserId: true,
});

/**
 * Schema for subscription creation
 */
export const createSubscriptionSchema = z.object({
  clerkUserId: commonValidators.clerkUserId,
  stripeCustomerId: z
    .string()
    .max(255, 'Stripe customer ID must be 255 characters or less')
    .optional()
    .nullable(),
  stripeSubscriptionId: z
    .string()
    .max(255, 'Stripe subscription ID must be 255 characters or less')
    .optional()
    .nullable(),
  planType: commonValidators.planType,
  status: commonValidators.subscriptionStatus,
  currentPeriodStart: commonValidators.isoDate.optional().nullable(),
  currentPeriodEnd: commonValidators.isoDate.optional().nullable(),
  cancelAtPeriodEnd: commonValidators.boolean,
});

/**
 * Schema for updating subscription
 */
export const updateSubscriptionSchema = createSubscriptionSchema
  .partial()
  .omit({ clerkUserId: true });

/**
 * Schema for creating checkout session
 */
export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  email: commonValidators.email.optional(),
});

/**
 * Schema for payment record
 */
export const createPaymentSchema = z.object({
  clerkUserId: commonValidators.clerkUserId,
  stripePaymentIntentId: z
    .string()
    .min(1, 'Stripe payment intent ID is required')
    .max(255),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .toUpperCase()
    .default('USD'),
  status: z.enum(['succeeded', 'failed', 'pending']),
  paymentMethod: z
    .string()
    .max(100, 'Payment method must be 100 characters or less')
    .optional()
    .nullable(),
});

/**
 * Schema for user query parameters
 */
export const userQuerySchema = z.object({
  role: commonValidators.role.optional(),
  email: commonValidators.email.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Schema for user stats update
 */
export const updateUserStatsSchema = z.object({
  totalCardsStudied: z.number().int().min(0).optional(),
  studyStreakDays: z.number().int().min(0).optional(),
  totalStudyTime: z.number().int().min(0).optional(),
  dailyCardsStudiedToday: z.number().int().min(0).optional(),
});

/**
 * Type exports
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
export type UpdateUserStatsInput = z.infer<typeof updateUserStatsSchema>;
