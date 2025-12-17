import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userFeedback, users } from '@/lib/db/schema';
import { validateRequest } from '@/lib/api/validate';
import { handleApiError, assertAuthenticated } from '@/lib/api/error-handler';
import { withRateLimit } from '@/lib/middleware/with-rate-limit';
import { createFeedbackSchema } from '@/lib/validations/feedback';
import { sendAdminFeedbackNotification } from '@/lib/email/feedback-notifications';
import { log } from '@/lib/logger';
import { eq } from 'drizzle-orm';

/**
 * POST /api/feedback
 * Submit user feedback on flashcards or quiz questions
 *
 * Rate limit: 10 submissions per hour per user
 *
 * Security:
 * - User must be authenticated
 * - Input sanitization via Zod validation
 * - Rate limiting to prevent spam
 * - Screenshot URLs validated
 */
async function submitFeedback(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    assertAuthenticated(userId);

    // 2. Validate request body
    const data = await validateRequest(request, createFeedbackSchema);

    // 3. Get user details for email
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Insert feedback into database
    const [feedback] = await db.insert(userFeedback).values({
      clerkUserId: userId,
      flashcardId: data.flashcardId || null,
      quizQuestionId: data.quizQuestionId || null,
      deckQuizQuestionId: data.deckQuizQuestionId || null,
      deckId: data.deckId || null,
      classId: data.classId || null,
      feedbackType: data.feedbackType,
      feedbackText: data.feedbackText,
      screenshotUrl: data.screenshot?.url || null,
      screenshotKey: data.screenshot?.key || null,
      userAgent: data.userAgent || request.headers.get('user-agent') || null,
      pageUrl: data.pageUrl || null,
      status: 'pending',
      priority: 'medium', // Default priority
    }).returning();

    // 5. Send email notification to all admins (async, don't wait)
    sendAdminFeedbackNotification(feedback.id, user)
      .catch((error) => {
        log.error('Failed to send admin feedback notification', error as Error, {
          feedbackId: feedback.id,
          userId: user.clerkUserId,
        });
      });

    // 6. Log successful submission
    log.info('Feedback submitted successfully', {
      feedbackId: feedback.id,
      userId: user.clerkUserId,
      type: data.feedbackType,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback! Our team will review it shortly.',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error, 'submit feedback', {
      endpoint: '/api/feedback',
      method: 'POST',
    });
  }
}

// Apply rate limiting: 10 requests per hour per user
export const POST = withRateLimit(submitFeedback, {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyPrefix: 'feedback-submit',
  getUserId: async () => {
    const { userId } = await auth();
    return userId || undefined;
  },
});
