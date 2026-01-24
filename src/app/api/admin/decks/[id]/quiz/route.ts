import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { deckQuizQuestions, topics, subTopics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateQuizFile, QuizFile } from '@/lib/validations/quiz';
import { CacheInvalidation } from '@/lib/redis/invalidation';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

export const dynamic = 'force-dynamic';

/**
 * Helper function to resolve sub_topic_id from topic_code and sub_topic_name
 */
async function resolveSubTopicId(
  topicCode: string | undefined,
  subTopicName: string | undefined
): Promise<string | null> {
  if (!topicCode || !subTopicName) {
    return null;
  }

  try {
    // Find the topic by code
    const topic = await db.query.topics.findFirst({
      where: eq(topics.topicCode, topicCode),
    });

    if (!topic) {
      console.warn(`Topic not found for code: ${topicCode}`);
      return null;
    }

    // Find sub-topics for this topic
    const allSubTopics = await db.query.subTopics.findMany({
      where: eq(subTopics.topicId, topic.id),
    });

    // Try exact match first, then partial match
    const matchedSubTopic = allSubTopics.find(
      (st) => st.subTopicName.toLowerCase() === subTopicName.toLowerCase()
    ) || allSubTopics.find(
      (st) => st.subTopicName.toLowerCase().includes(subTopicName.toLowerCase()) ||
        subTopicName.toLowerCase().includes(st.subTopicName.toLowerCase())
    );

    if (!matchedSubTopic) {
      console.warn(`Sub-topic not found: "${subTopicName}" under topic ${topicCode}`);
      return null;
    }

    return matchedSubTopic.id;
  } catch (error) {
    console.error('Error resolving sub-topic:', error);
    return null;
  }
}

/**
 * PUT /api/admin/decks/[id]/quiz
 * Create or update quiz questions for a deck
 * Admin only
 */
async function updateDeckQuiz(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id: deckId } = await params;
    const body = await request.json();
    const { quizData, classId } = body as { quizData: QuizFile | null; classId?: string };

    // If quizData is null, delete all existing quiz questions
    if (quizData === null) {
      await db.delete(deckQuizQuestions).where(eq(deckQuizQuestions.deckId, deckId));

      // Invalidate cache
      if (classId) {
        await CacheInvalidation.deck(deckId, classId);
      }

      return NextResponse.json({
        success: true,
        message: 'Deck quiz questions deleted',
      });
    }

    // Validate quiz data using the same validator as flashcard quizzes
    const validationResult = validateQuizFile(quizData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: `Invalid quiz data: ${validationResult.error}` },
        { status: 400 }
      );
    }

    // Get existing questions to calculate the starting order
    const existingQuestions = await db.query.deckQuizQuestions.findMany({
      where: eq(deckQuizQuestions.deckId, deckId),
      orderBy: (questions, { desc }) => [desc(questions.order)],
      limit: 1,
    });

    const startingOrder = existingQuestions.length > 0 ? existingQuestions[0].order + 1 : 0;

    // Insert new quiz questions (append to existing)
    if (validationResult.data.questions.length > 0) {
      // Resolve sub-topic IDs for all questions that have topic references
      const questionsWithSubTopics = await Promise.all(
        validationResult.data.questions.map(async (q, index) => {
          // Resolve sub-topic ID if topic_code and sub_topic_name are provided
          const subTopicId = await resolveSubTopicId(q.topic_code, q.sub_topic_name);

          return {
            deckId: deckId,
            questionText: q.question,
            options: q.options, // JSON array: [{text, isCorrect}]
            explanation: q.explanation || null,
            eliminationTactics: q.elimination_tactics ? JSON.stringify(q.elimination_tactics) : null,
            correctAnswerWithJustification: q.correct_answer_with_justification ? JSON.stringify(q.correct_answer_with_justification) : null,
            compareRemainingOptionsWithJustification: q.compare_remaining_options_with_justification ? JSON.stringify(q.compare_remaining_options_with_justification) : null,
            correctOptionsJustification: q.correct_options_justification ? JSON.stringify(q.correct_options_justification) : null,
            order: startingOrder + index,
            difficulty: null, // Could be added to quiz validation schema later
            subTopicId: subTopicId, // Link to sub-topic for categorization
            createdBy: admin.clerkUserId,
          };
        })
      );

      await db.insert(deckQuizQuestions).values(questionsWithSubTopics);
    }

    // Get total count after insertion
    const totalQuestions = await db.query.deckQuizQuestions.findMany({
      where: eq(deckQuizQuestions.deckId, deckId),
    });

    // Invalidate cache
    if (classId) {
      await CacheInvalidation.deck(deckId, classId);
    }

    return NextResponse.json({
      success: true,
      message: `${validationResult.data.questions.length} quiz question(s) added. Total: ${totalQuestions.length} questions`,
      count: totalQuestions.length,
      added: validationResult.data.questions.length,
    });
  } catch (error) {
    console.error('Error updating deck quiz:', error);
    throw error;
  }
}

export const PUT = withTracing(
  withErrorHandling(updateDeckQuiz as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'update admin deck quiz'),
  { logRequest: true, logResponse: false }
) as typeof updateDeckQuiz;

/**
 * DELETE /api/admin/decks/[id]/quiz
 * Delete all quiz questions for a deck
 * Admin only
 */
async function deleteDeckQuiz(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: deckId } = await params;

    // Delete all quiz questions for this deck
    await db.delete(deckQuizQuestions).where(eq(deckQuizQuestions.deckId, deckId));

    return NextResponse.json({
      success: true,
      message: 'Deck quiz questions deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting deck quiz:', error);
    throw error;
  }
}

export const DELETE = withTracing(
  withErrorHandling(deleteDeckQuiz as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'delete admin deck quiz'),
  { logRequest: true, logResponse: false }
) as typeof deleteDeckQuiz;
