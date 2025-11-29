import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards, flashcardMedia, quizQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateFlashcardSchema } from '@/lib/validations/flashcard';
import { deleteMultipleImagesFromBlob } from '@/lib/blob';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';
import { invalidateFlashcardCache } from '@/lib/flashcard/cache';
import { insertQuizQuestions } from '@/lib/flashcard/quiz';

interface FlashcardUpdateData {
  question?: string;
  answer?: string;
  explanation?: string | null;
  order?: number;
  isPublished?: boolean;
  updatedAt: Date;
}

interface ValidatedFlashcardData {
  question?: string;
  answer?: string;
  explanation?: string | null;
  order?: number;
  isPublished?: boolean;
  media?: Array<{
    url: string;
    key: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    placement: string;
    order: number;
    altText?: string | null;
  }>;
}

/**
 * Build flashcard update data from validated input
 */
function buildFlashcardUpdateData(validatedData: ValidatedFlashcardData): FlashcardUpdateData {
  const updateData: FlashcardUpdateData = {
    updatedAt: new Date(),
  };

  if (validatedData.question !== undefined) {
    updateData.question = validatedData.question;
  }
  if (validatedData.answer !== undefined) {
    updateData.answer = validatedData.answer;
  }
  if (validatedData.explanation !== undefined) {
    updateData.explanation = validatedData.explanation || null;
  }
  if (validatedData.order !== undefined) {
    updateData.order = validatedData.order;
  }
  if (validatedData.isPublished !== undefined) {
    updateData.isPublished = validatedData.isPublished;
  }

  return updateData;
}

/**
 * Get URLs that need to be deleted from blob storage
 */
function getUrlsToDelete(
  oldMedia: Array<{ fileUrl: string }>,
  newMediaUrls: string[]
): string[] {
  return oldMedia
    .map((m) => m.fileUrl)
    .filter((url) => !newMediaUrls.includes(url));
}

/**
 * Delete old media files from blob storage
 */
async function deleteOldMediaFiles(
  oldMedia: Array<{ fileUrl: string }>,
  newMediaUrls: string[]
): Promise<void> {
  if (oldMedia.length === 0) return;

  const urlsToDelete = getUrlsToDelete(oldMedia, newMediaUrls);

  if (urlsToDelete.length === 0) return;

  try {
    await deleteMultipleImagesFromBlob(urlsToDelete);
  } catch (error) {
    console.error('Error deleting old images from blob storage:', error);
    // Continue even if blob deletion fails
  }
}

/**
 * Insert new media for a flashcard
 */
async function insertFlashcardMedia(
  flashcardId: string,
  media: ValidatedFlashcardData['media']
): Promise<void> {
  if (!media || media.length === 0) return;

  await db.insert(flashcardMedia).values(
    media.map((m) => ({
      flashcardId,
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

/**
 * Update flashcard media (delete old, insert new)
 */
async function updateFlashcardMedia(
  flashcardId: string,
  newMedia: ValidatedFlashcardData['media']
): Promise<void> {
  // Get existing media before deleting
  const oldMedia = await db.query.flashcardMedia.findMany({
    where: eq(flashcardMedia.flashcardId, flashcardId),
  });

  // Delete existing media from database
  await db.delete(flashcardMedia).where(eq(flashcardMedia.flashcardId, flashcardId));

  // Delete old images from blob storage that are no longer used
  const newMediaUrls = newMedia?.map((m) => m.url) || [];
  await deleteOldMediaFiles(oldMedia, newMediaUrls);

  // Insert new media
  await insertFlashcardMedia(flashcardId, newMedia);
}

/**
 * Update quiz questions for a flashcard
 */
async function updateQuizQuestions(
  flashcardId: string,
  quizData: unknown,
  userId: string
): Promise<NextResponse | null> {
  // Delete existing quiz questions
  await db.delete(quizQuestions).where(eq(quizQuestions.flashcardId, flashcardId));

  if (!quizData) {
    return null;
  }

  const result = await insertQuizQuestions(flashcardId, quizData, userId);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return null;
}

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

    // Build and apply the flashcard update
    const updateData = buildFlashcardUpdateData(validatedData);
    await db.update(flashcards)
      .set(updateData)
      .where(eq(flashcards.id, id));

    // Handle media updates if provided
    if (validatedData.media !== undefined) {
      await updateFlashcardMedia(id, validatedData.media);
    }

    // Handle quiz questions if provided
    if (quizData !== undefined) {
      const errorResponse = await updateQuizQuestions(id, quizData, admin.clerkUserId);
      if (errorResponse) {
        return errorResponse;
      }
    }

    // Invalidate cache after successful update
    await invalidateFlashcardCache(existingFlashcard.deckId);

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

    // Invalidate cache after successful deletion
    await invalidateFlashcardCache(existingFlashcard.deckId);

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
