import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards, flashcardMedia, quizQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateFlashcardSchema } from '@/lib/validations/flashcard';
import { validateQuizFile } from '@/lib/validations/quiz';
import { deleteMultipleImagesFromBlob } from '@/lib/blob';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * PATCH /api/admin/flashcards/[id]
 * Update an existing flashcard with optional media and quiz questions
 * Admin only
 */
async function updateFlashcard(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Check if flashcard exists
    const existingFlashcard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, id),
    });

    if (!existingFlashcard) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    // Extract quiz data and media if present
    const { quizData, media, ...flashcardData } = body;

    // Validate flashcard data
    const validation = updateFlashcardSchema.safeParse({ ...flashcardData, media });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Update the flashcard
    const updateData: {
      question?: string;
      answer?: string;
      explanation?: string | null;
      order?: number;
      isPublished?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (validatedData.question !== undefined) updateData.question = validatedData.question;
    if (validatedData.answer !== undefined) updateData.answer = validatedData.answer;
    if (validatedData.explanation !== undefined) updateData.explanation = validatedData.explanation || null;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished;

    await db.update(flashcards)
      .set(updateData)
      .where(eq(flashcards.id, id));

    // Handle media updates if provided
    if (validatedData.media !== undefined) {
      // Get existing media before deleting
      const oldMedia = await db.query.flashcardMedia.findMany({
        where: eq(flashcardMedia.flashcardId, id),
      });

      // Delete existing media from database
      await db.delete(flashcardMedia).where(eq(flashcardMedia.flashcardId, id));

      // Delete old images from blob storage that are no longer used
      if (oldMedia.length > 0) {
        const newMediaUrls = validatedData.media.map((m) => m.url);
        const urlsToDelete = oldMedia
          .map((m) => m.fileUrl)
          .filter((url) => !newMediaUrls.includes(url));

        if (urlsToDelete.length > 0) {
          try {
            await deleteMultipleImagesFromBlob(urlsToDelete);
          } catch (error) {
            console.error('Error deleting old images from blob storage:', error);
            // Continue even if blob deletion fails
          }
        }
      }

      // Insert new media
      if (validatedData.media.length > 0) {
        await db.insert(flashcardMedia).values(
          validatedData.media.map((m) => ({
            flashcardId: id,
            fileUrl: m.url,
            fileKey: m.key,
            fileName: m.fileName,
            fileSize: m.fileSize,
            mimeType: m.mimeType,
            placement: m.placement,
            order: m.order,
            altText: m.altText || null,
          }))
        );
      }
    }

    // Handle quiz questions if provided
    if (quizData !== undefined) {
      // Delete existing quiz questions
      await db.delete(quizQuestions).where(eq(quizQuestions.flashcardId, id));

      if (quizData) {
        const quizValidation = validateQuizFile(quizData);
        if (!quizValidation.success) {
          return NextResponse.json(
            { error: `Invalid quiz data: ${quizValidation.error}` },
            { status: 400 }
          );
        }

        if (quizValidation.data.questions.length > 0) {
          await db.insert(quizQuestions).values(
            quizValidation.data.questions.map((q, index) => ({
              flashcardId: id,
              questionText: q.question,
              options: q.options,
              explanation: q.explanation || null,
              eliminationTactics: q.elimination_tactics ? JSON.stringify(q.elimination_tactics) : null,
              correctAnswerWithJustification: q.correct_answer_with_justification ? JSON.stringify(q.correct_answer_with_justification) : null,
              compareRemainingOptionsWithJustification: q.compare_remaining_options_with_justification ? JSON.stringify(q.compare_remaining_options_with_justification) : null,
              correctOptionsJustification: q.correct_options_justification ? JSON.stringify(q.correct_options_justification) : null,
              order: index,
              difficulty: null,
              createdBy: admin.clerkUserId,
            }))
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Flashcard updated successfully',
    });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
}

export const PATCH = withTracing(
  withErrorHandling(updateFlashcard as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'update admin flashcard'),
  { logRequest: true, logResponse: false }
) as typeof updateFlashcard;

/**
 * DELETE /api/admin/flashcards/[id]
 * Delete a flashcard and all associated media and quiz questions
 * Admin only
 */
async function deleteFlashcard(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if flashcard exists and get its media
    const existingFlashcard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, id),
      with: {
        media: true,
      },
    });

    if (!existingFlashcard) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    // Delete images from blob storage first
    if (existingFlashcard.media && existingFlashcard.media.length > 0) {
      const imageUrls = existingFlashcard.media.map((m) => m.fileUrl);
      try {
        await deleteMultipleImagesFromBlob(imageUrls);
      } catch (error) {
        console.error('Error deleting images from blob storage:', error);
        // Continue with database deletion even if blob deletion fails
        // This prevents orphaned database records
      }
    }

    // Delete the flashcard (cascades to media and quiz questions in database)
    await db.delete(flashcards).where(eq(flashcards.id, id));

    return NextResponse.json({
      success: true,
      message: 'Flashcard deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
}

export const DELETE = withTracing(
  withErrorHandling(deleteFlashcard as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'delete admin flashcard'),
  { logRequest: true, logResponse: false }
) as typeof deleteFlashcard;
