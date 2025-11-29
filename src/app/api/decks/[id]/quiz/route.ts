import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { deckQuizQuestions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/decks/[id]/quiz
 * Fetch all quiz questions for a deck
 * Used by users when taking a deck test
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: deckId } = await params;

    // Fetch quiz questions for the deck ordered by order field
    const questions = await db.query.deckQuizQuestions.findMany({
      where: eq(deckQuizQuestions.deckId, deckId),
      orderBy: [asc(deckQuizQuestions.order)],
    });

    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No quiz questions available for this deck',
        questions: [],
      });
    }

    // Helper function to safely parse JSON strings
    const safeJsonParse = (str: string | null): Record<string, string> | null => {
      if (!str) return null;
      try {
        const parsed = JSON.parse(str);
        return typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    };

    // Return questions without exposing sensitive fields like createdBy
    return NextResponse.json({
      success: true,
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options, // Already in JSON format: [{text, isCorrect}]
        explanation: q.explanation,
        eliminationTactics: safeJsonParse(q.eliminationTactics),
        correctAnswerWithJustification: safeJsonParse(q.correctAnswerWithJustification),
        compareRemainingOptionsWithJustification: safeJsonParse(q.compareRemainingOptionsWithJustification),
        correctOptionsJustification: safeJsonParse(q.correctOptionsJustification),
        order: q.order,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    console.error('Error fetching deck quiz questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz questions' },
      { status: 500 }
    );
  }
}
