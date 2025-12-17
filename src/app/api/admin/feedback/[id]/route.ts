import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/error-handler';
import { validateRequest } from '@/lib/api/validate';
import { updateFeedbackSchema } from '@/lib/validations/feedback';
import { sendUserFeedbackResolvedNotification } from '@/lib/email/feedback-notifications';
import { deleteImageFromBlob } from '@/lib/blob';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/logger';

/**
 * GET /api/admin/feedback/[id]
 * Get single feedback item with all relations (admin only)
 *
 * Security:
 * - Admin only
 *
 * Returns:
 * - Complete feedback details with user, content, and resolver relations
 */
async function getFeedback(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require admin authentication
    const adminUser = await requireAdmin();

    // 2. Get feedback ID from params
    const { id } = await params;

    // 3. Query feedback with all relations
    const feedback = await db.query.userFeedback.findFirst({
      where: eq(userFeedback.id, id),
      with: {
        user: {
          columns: {
            clerkUserId: true,
            email: true,
            name: true,
          },
        },
        flashcard: {
          columns: {
            id: true,
            question: true,
            answer: true,
            deckId: true,
          },
        },
        quizQuestion: {
          columns: {
            id: true,
            questionText: true,
            flashcardId: true,
          },
        },
        deckQuizQuestion: {
          columns: {
            id: true,
            questionText: true,
            deckId: true,
          },
        },
        deck: {
          columns: {
            id: true,
            name: true,
          },
        },
        class: {
          columns: {
            id: true,
            name: true,
          },
        },
        resolvedByUser: {
          columns: {
            clerkUserId: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // 4. Check if feedback exists
    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // 5. Log successful retrieval
    log.info('Admin retrieved feedback details', {
      feedbackId: id,
      adminUserId: adminUser.clerkUserId,
    });

    // 6. Return feedback
    return NextResponse.json({
      success: true,
      feedback,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, 'get feedback details', {
      endpoint: '/api/admin/feedback/[id]',
      method: 'GET',
    });
  }
}

/**
 * PATCH /api/admin/feedback/[id]
 * Update feedback status, priority, or admin response (admin only)
 *
 * Request body:
 * - status: New status (optional)
 * - priority: New priority (optional)
 * - adminResponse: Admin response text (optional)
 *
 * Security:
 * - Admin only
 * - Input validation via Zod
 *
 * Side effects:
 * - If status changed to 'resolved' or 'closed', sends email to user
 * - Auto-sets resolvedBy and resolvedAt when status → resolved/closed
 */
async function updateFeedback(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require admin authentication
    const adminUser = await requireAdmin();

    // 2. Get feedback ID from params
    const { id } = await params;

    // 3. Validate request body
    const data = await validateRequest(request, updateFeedbackSchema);

    // 4. Get existing feedback
    const existingFeedback = await db.query.userFeedback.findFirst({
      where: eq(userFeedback.id, id),
      with: {
        user: true,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // 5. Build update object
    const updateData: {
      status?: typeof data.status;
      priority?: typeof data.priority;
      adminResponse?: string | null;
      resolvedBy?: string;
      resolvedAt?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) {
      updateData.status = data.status;

      // Auto-set resolvedBy and resolvedAt when status changes to resolved/closed
      if (
        (data.status === 'resolved' || data.status === 'closed') &&
        existingFeedback.status !== 'resolved' &&
        existingFeedback.status !== 'closed'
      ) {
        updateData.resolvedBy = adminUser.clerkUserId;
        updateData.resolvedAt = new Date();
      }
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.adminResponse !== undefined) {
      updateData.adminResponse = data.adminResponse;
    }

    // 6. Update feedback in database
    const [updatedFeedback] = await db
      .update(userFeedback)
      .set(updateData)
      .where(eq(userFeedback.id, id))
      .returning();

    // 7. Send email notification if status changed to resolved/closed
    const statusChanged =
      data.status &&
      data.status !== existingFeedback.status &&
      (data.status === 'resolved' || data.status === 'closed');

    if (statusChanged && existingFeedback.user) {
      sendUserFeedbackResolvedNotification(
        id,
        existingFeedback.user,
        adminUser,
        data.adminResponse || null
      ).catch((error) => {
        log.error('Failed to send user feedback resolved notification', error as Error, {
          feedbackId: id,
          userId: existingFeedback.user?.clerkUserId,
        });
      });
    }

    // 8. Log successful update
    log.info('Admin updated feedback', {
      feedbackId: id,
      adminUserId: adminUser.clerkUserId,
      changes: data,
    });

    // 9. Return updated feedback
    return NextResponse.json({
      success: true,
      feedback: updatedFeedback,
      emailSent: statusChanged,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, 'update feedback', {
      endpoint: '/api/admin/feedback/[id]',
      method: 'PATCH',
    });
  }
}

/**
 * DELETE /api/admin/feedback/[id]
 * Delete feedback and associated screenshot (admin only)
 *
 * Security:
 * - Admin only
 *
 * Side effects:
 * - Deletes screenshot from Vercel Blob Storage if present
 * - Deletes feedback record from database
 */
async function deleteFeedback(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require admin authentication
    const adminUser = await requireAdmin();

    // 2. Get feedback ID from params
    const { id } = await params;

    // 3. Get existing feedback
    const existingFeedback = await db.query.userFeedback.findFirst({
      where: eq(userFeedback.id, id),
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // 4. Delete screenshot from blob storage if exists
    if (existingFeedback.screenshotUrl) {
      try {
        await deleteImageFromBlob(existingFeedback.screenshotUrl);
        log.info('Deleted feedback screenshot from blob storage', {
          feedbackId: id,
          screenshotUrl: existingFeedback.screenshotUrl,
        });
      } catch (error) {
        // Log error but continue with feedback deletion
        log.error('Failed to delete feedback screenshot from blob storage', error as Error, {
          feedbackId: id,
          screenshotUrl: existingFeedback.screenshotUrl,
        });
      }
    }

    // 5. Delete feedback from database
    await db
      .delete(userFeedback)
      .where(eq(userFeedback.id, id));

    // 6. Log successful deletion
    log.info('Admin deleted feedback', {
      feedbackId: id,
      adminUserId: adminUser.clerkUserId,
    });

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, 'delete feedback', {
      endpoint: '/api/admin/feedback/[id]',
      method: 'DELETE',
    });
  }
}

export const GET = getFeedback;
export const PATCH = updateFeedback;
export const DELETE = deleteFeedback;
