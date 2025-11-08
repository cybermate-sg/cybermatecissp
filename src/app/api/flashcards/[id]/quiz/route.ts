import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quizQuestions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/flashcards/[id]/quiz
 * Get quiz questions for a flashcard (public endpoint for users)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch quiz questions for this flashcard, ordered by order field
    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.flashcardId, id),
      orderBy: [asc(quizQuestions.order)],
    });

    return NextResponse.json({
      success: true,
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options, // Already a JSON array
        explanation: q.explanation,
        order: q.order,
      })),
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quiz questions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
