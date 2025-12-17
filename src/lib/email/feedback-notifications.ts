import { resend, EmailConfig } from './client';
import { db } from '@/lib/db';
import { users, userFeedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/logger';
import {
  getAdminFeedbackNotificationHtml,
  getAdminFeedbackNotificationText,
} from './templates/admin-feedback-notification';
import {
  getUserFeedbackResolvedHtml,
  getUserFeedbackResolvedText,
} from './templates/user-feedback-resolved';

/**
 * Send email notification to all admin users about new feedback
 */
export async function sendAdminFeedbackNotification(
  feedbackId: string,
  submittingUser: { clerkUserId: string; email: string; name: string | null }
): Promise<void> {
  try {
    // 1. Fetch feedback details with related content
    const feedback = await db.query.userFeedback.findFirst({
      where: eq(userFeedback.id, feedbackId),
      with: {
        flashcard: true,
        quizQuestion: true,
        deckQuizQuestion: true,
      },
    });

    if (!feedback) {
      throw new Error(`Feedback ${feedbackId} not found`);
    }

    // 2. Get all admin users
    const adminUsers = await db.query.users.findMany({
      where: eq(users.role, 'admin'),
    });

    if (adminUsers.length === 0) {
      log.warn('No admin users found to send feedback notification', {
        feedbackId,
      });
      return;
    }

    // 3. Determine content type and preview
    let contentType: 'flashcard' | 'flashcard_quiz' | 'deck_quiz' = 'flashcard';
    let contentPreview = 'Content not available';

    if (feedback.flashcard) {
      contentType = 'flashcard';
      const question = feedback.flashcard.question;
      contentPreview = question.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    } else if (feedback.quizQuestion) {
      contentType = 'flashcard_quiz';
      contentPreview = feedback.quizQuestion.questionText.substring(0, 200) + '...';
    } else if (feedback.deckQuizQuestion) {
      contentType = 'deck_quiz';
      contentPreview = feedback.deckQuizQuestion.questionText.substring(0, 200) + '...';
    }

    // 4. Build dashboard URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/admin/feedback?id=${feedbackId}`;

    // 5. Prepare email data
    const emailProps = {
      feedbackId,
      userName: submittingUser.name || 'Anonymous',
      userEmail: submittingUser.email,
      feedbackType: feedback.feedbackType,
      feedbackText: feedback.feedbackText,
      contentType,
      contentPreview,
      dashboardUrl,
      screenshotUrl: feedback.screenshotUrl || undefined,
    };

    // 6. Send email to each admin
    const emailPromises = adminUsers.map((admin) =>
      resend.emails.send({
        from: EmailConfig.from,
        to: admin.email,
        replyTo: submittingUser.email, // Allow admins to reply directly to user
        subject: EmailConfig.adminNotificationSubject,
        html: getAdminFeedbackNotificationHtml(emailProps),
        text: getAdminFeedbackNotificationText(emailProps),
      })
    );

    await Promise.all(emailPromises);

    log.info('Admin feedback notifications sent', {
      feedbackId,
      adminCount: adminUsers.length,
    });
  } catch (error) {
    log.error('Failed to send admin feedback notification', error as Error, {
      feedbackId,
    });
    throw error;
  }
}

/**
 * Send email notification to user when feedback is resolved/closed
 */
export async function sendUserFeedbackResolvedNotification(
  feedbackId: string,
  user: { clerkUserId: string; email: string; name: string | null },
  admin: { clerkUserId: string; email: string; name: string | null },
  adminResponse: string | null
): Promise<void> {
  try {
    // 1. Fetch feedback details with related content
    const feedback = await db.query.userFeedback.findFirst({
      where: eq(userFeedback.id, feedbackId),
      with: {
        flashcard: true,
        quizQuestion: true,
        deckQuizQuestion: true,
      },
    });

    if (!feedback) {
      throw new Error(`Feedback ${feedbackId} not found`);
    }

    // 2. Determine content type and preview
    let contentType: 'flashcard' | 'flashcard_quiz' | 'deck_quiz' = 'flashcard';
    let contentPreview = 'Content not available';

    if (feedback.flashcard) {
      contentType = 'flashcard';
      const question = feedback.flashcard.question;
      contentPreview = question.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    } else if (feedback.quizQuestion) {
      contentType = 'flashcard_quiz';
      contentPreview = feedback.quizQuestion.questionText.substring(0, 200) + '...';
    } else if (feedback.deckQuizQuestion) {
      contentType = 'deck_quiz';
      contentPreview = feedback.deckQuizQuestion.questionText.substring(0, 200) + '...';
    }

    // 3. Prepare email data
    const emailProps = {
      userName: user.name || 'there',
      feedbackType: feedback.feedbackType,
      feedbackText: feedback.feedbackText,
      adminResponse,
      status: feedback.status,
      contentType,
      contentPreview,
    };

    // 4. Send email to user
    await resend.emails.send({
      from: EmailConfig.from,
      to: user.email,
      replyTo: EmailConfig.replyTo,
      subject: EmailConfig.userResolvedSubject,
      html: getUserFeedbackResolvedHtml(emailProps),
      text: getUserFeedbackResolvedText(emailProps),
    });

    log.info('User feedback resolved notification sent', {
      feedbackId,
      userId: user.clerkUserId,
    });
  } catch (error) {
    log.error('Failed to send user feedback resolved notification', error as Error, {
      feedbackId,
      userId: user.clerkUserId,
    });
    throw error;
  }
}
