import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deckQuizQuestions } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/decks/[id]/has-quiz
 * Check if a deck has quiz questions
 * Used to show/hide the "Take Deck Test" button
 *
 * Public endpoint (no auth required) for performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    // Count quiz questions for this deck
    const result = await db
      .select({ count: count() })
      .from(deckQuizQuestions)
      .where(eq(deckQuizQuestions.deckId, deckId));

    const questionCount = result[0]?.count || 0;
    const hasQuiz = questionCount > 0;

    return NextResponse.json({
      hasQuiz,
      count: questionCount
    });
  } catch (error) {
    console.error('Error checking deck quiz:', error);
    return NextResponse.json(
      { error: 'Failed to check quiz availability' },
      { status: 500 }
    );
  }
}
