import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { deckQuizQuestions, decks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';
import { CacheInvalidation } from '@/lib/redis/invalidation';
import { validateQuizQuestionUpdate } from '@/lib/validations/quiz';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/decks/[id]/quiz/[questionId]
 * Update a single deck quiz question (admin only)
 */
async function updateDeckQuizQuestion(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    await requireAdmin();
    const { id: deckId, questionId } = await params;
    const body = await request.json();

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

    // Validate the update data (deck quiz = true for difficulty field)
    const validation = validateQuizQuestionUpdate(body, true);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Prepare update data with JSON stringified metadata
    const updateData: Record<string, unknown> = {
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

    // Add difficulty if present (deck quiz specific)
    if ('difficulty' in validatedData) {
      updateData.difficulty = validatedData.difficulty;
    }

    // Update the question
    await db.update(deckQuizQuestions)
      .set(updateData)
      .where(eq(deckQuizQuestions.id, questionId));

    // Fetch the updated question
    const updated = await db.query.deckQuizQuestions.findFirst({
      where: eq(deckQuizQuestions.id, questionId),
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
      difficulty: updated!.difficulty,
      createdAt: updated!.createdAt,
      createdBy: updated!.createdBy,
    };

    // Get deck info for cache invalidation
    const deck = await db.query.decks.findFirst({
      where: eq(decks.id, deckId),
      columns: { classId: true },
    });

    // Invalidate cache
    if (deck?.classId) {
      await CacheInvalidation.deck(deckId, deck.classId);
    }

    return NextResponse.json({
      success: true,
      question: formattedQuestion,
    });
  } catch (error) {
    console.error('Error updating deck quiz question:', error);
    throw error;
  }
}

export const PATCH = withTracing(
  withErrorHandling(
    updateDeckQuizQuestion as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
    'update admin deck quiz question'
  ),
  { logRequest: true, logResponse: false }
) as typeof updateDeckQuizQuestion;

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
