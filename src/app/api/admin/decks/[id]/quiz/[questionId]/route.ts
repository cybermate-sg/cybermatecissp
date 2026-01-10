import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { deckQuizQuestions, decks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';
import { CacheInvalidation } from '@/lib/redis/invalidation';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/decks/[id]/quiz/[questionId]
 * Delete a single deck quiz question (admin only)
 */
async function deleteDeckQuizQuestion(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    await requireAdmin();
    const { id: deckId, questionId } = await params;

    // Verify the question exists and belongs to this deck
    const existingQuestion = await db.query.deckQuizQuestions.findFirst({
      where: and(
        eq(deckQuizQuestions.id, questionId),
        eq(deckQuizQuestions.deckId, deckId)
      ),
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Quiz question not found or does not belong to this deck' },
        { status: 404 }
      );
    }

    // Get deck info for cache invalidation
    const deck = await db.query.decks.findFirst({
      where: eq(decks.id, deckId),
      columns: { classId: true },
    });

    // Delete the question
    await db.delete(deckQuizQuestions).where(eq(deckQuizQuestions.id, questionId));

    // Invalidate cache
    if (deck?.classId) {
      await CacheInvalidation.deck(deckId, deck.classId);
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting deck quiz question:', error);
    throw error;
  }
}

export const DELETE = withTracing(
  withErrorHandling(
    deleteDeckQuizQuestion as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
    'delete admin deck quiz question'
  ),
  { logRequest: true, logResponse: false }
) as typeof deleteDeckQuizQuestion;
