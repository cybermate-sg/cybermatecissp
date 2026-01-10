import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { quizQuestions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/flashcards/[id]/quiz/[questionId]
 * Delete a single quiz question (admin only)
 */
async function deleteFlashcardQuizQuestion(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    await requireAdmin();
    const { id: flashcardId, questionId } = await params;

    // Verify the question exists and belongs to this flashcard
    const existingQuestion = await db.query.quizQuestions.findFirst({
      where: and(
        eq(quizQuestions.id, questionId),
        eq(quizQuestions.flashcardId, flashcardId)
      ),
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Quiz question not found or does not belong to this flashcard' },
        { status: 404 }
      );
    }

    // Delete the question
    await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));

    return NextResponse.json({
      success: true,
      message: 'Quiz question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting flashcard quiz question:', error);
    throw error;
  }
}

export const DELETE = withTracing(
  withErrorHandling(
    deleteFlashcardQuizQuestion as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
    'delete admin flashcard quiz question'
  ),
  { logRequest: true, logResponse: false }
) as typeof deleteFlashcardQuizQuestion;
