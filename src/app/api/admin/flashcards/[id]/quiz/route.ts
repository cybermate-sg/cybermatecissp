import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { quizQuestions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/flashcards/[id]/quiz
 * List all quiz questions for a flashcard (admin only)
 */
async function listFlashcardQuizQuestions(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: flashcardId } = await params;

    // Fetch all quiz questions for this flashcard, ordered by order field
    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.flashcardId, flashcardId),
      orderBy: [asc(quizQuestions.order)],
    });

    // Parse JSON fields for frontend consumption
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      explanation: q.explanation,
      eliminationTactics: q.eliminationTactics ? JSON.parse(q.eliminationTactics) : null,
      correctAnswerWithJustification: q.correctAnswerWithJustification
        ? JSON.parse(q.correctAnswerWithJustification)
        : null,
      compareRemainingOptionsWithJustification: q.compareRemainingOptionsWithJustification
        ? JSON.parse(q.compareRemainingOptionsWithJustification)
        : null,
      correctOptionsJustification: q.correctOptionsJustification
        ? JSON.parse(q.correctOptionsJustification)
        : null,
      order: q.order,
      createdAt: q.createdAt,
      createdBy: q.createdBy,
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error('Error fetching flashcard quiz questions:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(
    listFlashcardQuizQuestions as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
    'list admin flashcard quiz questions'
  ),
  { logRequest: true, logResponse: false }
) as typeof listFlashcardQuizQuestions;
