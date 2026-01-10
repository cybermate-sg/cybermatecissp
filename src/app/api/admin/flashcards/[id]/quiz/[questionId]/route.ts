import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { quizQuestions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';
import { validateQuizQuestionUpdate } from '@/lib/validations/quiz';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/flashcards/[id]/quiz/[questionId]
 * Update a single quiz question (admin only)
 */
async function updateFlashcardQuizQuestion(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    await requireAdmin();
    const { id: flashcardId, questionId } = await params;
    const body = await request.json();

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

    // Validate the update data
    const validation = validateQuizQuestionUpdate(body, false);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Prepare update data with JSON stringified metadata
    const updateData = {
      questionText: validatedData.questionText,
      options: validatedData.options,
      explanation: validatedData.explanation || null,
      eliminationTactics: validatedData.eliminationTactics
        ? JSON.stringify(validatedData.eliminationTactics)
        : null,
      correctAnswerWithJustification: validatedData.correctAnswerWithJustification
        ? JSON.stringify(validatedData.correctAnswerWithJustification)
        : null,
      compareRemainingOptionsWithJustification: validatedData.compareRemainingOptionsWithJustification
        ? JSON.stringify(validatedData.compareRemainingOptionsWithJustification)
        : null,
      correctOptionsJustification: validatedData.correctOptionsJustification
        ? JSON.stringify(validatedData.correctOptionsJustification)
        : null,
      updatedAt: new Date(),
    };

    // Update the question
    await db.update(quizQuestions)
      .set(updateData)
      .where(eq(quizQuestions.id, questionId));

    // Fetch the updated question
    const updated = await db.query.quizQuestions.findFirst({
      where: eq(quizQuestions.id, questionId),
    });

    // Parse JSON fields for response
    const formattedQuestion = {
      id: updated!.id,
      questionText: updated!.questionText,
      options: updated!.options,
      explanation: updated!.explanation,
      eliminationTactics: updated!.eliminationTactics ? JSON.parse(updated!.eliminationTactics) : null,
      correctAnswerWithJustification: updated!.correctAnswerWithJustification
        ? JSON.parse(updated!.correctAnswerWithJustification)
        : null,
      compareRemainingOptionsWithJustification: updated!.compareRemainingOptionsWithJustification
        ? JSON.parse(updated!.compareRemainingOptionsWithJustification)
        : null,
      correctOptionsJustification: updated!.correctOptionsJustification
        ? JSON.parse(updated!.correctOptionsJustification)
        : null,
      order: updated!.order,
      createdAt: updated!.createdAt,
      createdBy: updated!.createdBy,
    };

    return NextResponse.json({
      success: true,
      question: formattedQuestion,
    });
  } catch (error) {
    console.error('Error updating flashcard quiz question:', error);
    throw error;
  }
}

export const PATCH = withTracing(
  withErrorHandling(
    updateFlashcardQuizQuestion as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
    'update admin flashcard quiz question'
  ),
  { logRequest: true, logResponse: false }
) as typeof updateFlashcardQuizQuestion;

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
