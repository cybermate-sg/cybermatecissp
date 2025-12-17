import { z } from 'zod';

/**
 * Feedback type enum
 */
export const FeedbackType = {
  CONTENT_ERROR: 'content_error',
  TYPO: 'typo',
  UNCLEAR_EXPLANATION: 'unclear_explanation',
  TECHNICAL_ISSUE: 'technical_issue',
  GENERAL_SUGGESTION: 'general_suggestion',
} as const;

/**
 * Feedback status enum
 */
export const FeedbackStatus = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REJECTED: 'rejected',
} as const;

/**
 * Feedback priority enum
 */
export const FeedbackPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

/**
 * UUID validator
 */
const uuidSchema = z.string().uuid();

/**
 * Screenshot file validation
 */
export const feedbackScreenshotSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  key: z.string().min(1, 'Screenshot key is required'),
});

/**
 * Schema for creating feedback
 *
 * Validation rules:
 * - One of flashcardId, quizQuestionId, or deckQuizQuestionId must be provided
 * - feedbackText max 500 characters
 * - Screenshot optional but validated if provided
 */
export const createFeedbackSchema = z.object({
  // Content reference (at least one required)
  flashcardId: uuidSchema.optional().nullable(),
  quizQuestionId: uuidSchema.optional().nullable(),
  deckQuizQuestionId: uuidSchema.optional().nullable(),

  // Context fields (auto-filled by frontend)
  deckId: uuidSchema.optional().nullable(),
  classId: uuidSchema.optional().nullable(),

  // Feedback details
  feedbackType: z.enum([
    FeedbackType.CONTENT_ERROR,
    FeedbackType.TYPO,
    FeedbackType.UNCLEAR_EXPLANATION,
    FeedbackType.TECHNICAL_ISSUE,
    FeedbackType.GENERAL_SUGGESTION,
  ], {
    message: 'Invalid feedback type',
  }),

  feedbackText: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(500, 'Feedback must be 500 characters or less')
    .trim(),

  // Screenshot upload (optional)
  screenshot: feedbackScreenshotSchema.optional().nullable(),

  // Metadata
  userAgent: z.string().optional(),
  pageUrl: z.string().url().optional(),
}).refine(
  (data) => data.flashcardId || data.quizQuestionId || data.deckQuizQuestionId,
  {
    message: 'At least one of flashcardId, quizQuestionId, or deckQuizQuestionId must be provided',
    path: ['flashcardId'],
  }
);

/**
 * Schema for updating feedback (admin only)
 */
export const updateFeedbackSchema = z.object({
  status: z.enum([
    FeedbackStatus.PENDING,
    FeedbackStatus.IN_REVIEW,
    FeedbackStatus.RESOLVED,
    FeedbackStatus.CLOSED,
    FeedbackStatus.REJECTED,
  ]).optional(),

  priority: z.enum([
    FeedbackPriority.LOW,
    FeedbackPriority.MEDIUM,
    FeedbackPriority.HIGH,
    FeedbackPriority.CRITICAL,
  ]).optional(),

  adminResponse: z
    .string()
    .max(1000, 'Admin response must be 1000 characters or less')
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schema for feedback query parameters (admin dashboard)
 */
export const feedbackQuerySchema = z.object({
  status: z.enum([
    FeedbackStatus.PENDING,
    FeedbackStatus.IN_REVIEW,
    FeedbackStatus.RESOLVED,
    FeedbackStatus.CLOSED,
    FeedbackStatus.REJECTED,
  ]).optional(),

  type: z.enum([
    FeedbackType.CONTENT_ERROR,
    FeedbackType.TYPO,
    FeedbackType.UNCLEAR_EXPLANATION,
    FeedbackType.TECHNICAL_ISSUE,
    FeedbackType.GENERAL_SUGGESTION,
  ]).optional(),

  priority: z.enum([
    FeedbackPriority.LOW,
    FeedbackPriority.MEDIUM,
    FeedbackPriority.HIGH,
    FeedbackPriority.CRITICAL,
  ]).optional(),

  flashcardId: uuidSchema.optional(),
  deckId: uuidSchema.optional(),
  classId: uuidSchema.optional(),

  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),

  sortBy: z.enum(['createdAt', 'priority', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Type exports
 */
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type FeedbackQueryParams = z.infer<typeof feedbackQuerySchema>;
export type FeedbackScreenshot = z.infer<typeof feedbackScreenshotSchema>;
