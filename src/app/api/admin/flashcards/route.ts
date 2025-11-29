import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards, flashcardMedia, quizQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createFlashcardSchema } from '@/lib/validations/flashcard';
import { validateQuizFile } from '@/lib/validations/quiz';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * POST /api/admin/flashcards
 * Create a new flashcard with optional media and quiz questions
 * Admin only
 */
async function createFlashcard(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    // Extract quiz data if present (not part of the flashcard schema)
    const { quizData, media, ...flashcardData } = body;

    // Validate flashcard data
    const validation = createFlashcardSchema.safeParse({ ...flashcardData, media });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Create the flashcard
    const [newFlashcard] = await db.insert(flashcards).values({
      deckId: validatedData.deckId,
      question: validatedData.question,
      answer: validatedData.answer,
      explanation: validatedData.explanation || null,
      order: validatedData.order,
      isPublished: validatedData.isPublished,
      createdBy: admin.clerkUserId,
    }).returning();

    // Insert media if provided
    if (validatedData.media && validatedData.media.length > 0) {
      await db.insert(flashcardMedia).values(
        validatedData.media.map((m) => ({
          flashcardId: newFlashcard.id,
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

    // Insert quiz questions if provided
    if (quizData) {
      const quizValidation = validateQuizFile(quizData);
      if (!quizValidation.success) {
        // Delete the flashcard if quiz validation fails
        await db.delete(flashcards).where(eq(flashcards.id, newFlashcard.id));
        return NextResponse.json(
          { error: `Invalid quiz data: ${quizValidation.error}` },
          { status: 400 }
        );
      }

      if (quizValidation.data.questions.length > 0) {
        await db.insert(quizQuestions).values(
          quizValidation.data.questions.map((q, index) => ({
            flashcardId: newFlashcard.id,
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

    return NextResponse.json({
      success: true,
      flashcard: newFlashcard,
      message: 'Flashcard created successfully',
    });
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(createFlashcard, 'create admin flashcard'),
  { logRequest: true, logResponse: false }
);
