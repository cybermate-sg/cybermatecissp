import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  quizSessions,
  quizSessionAnswers,
  userQuizProgress,
  deckQuizProgress,
  flashcards,
  decks,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';
import { ensureUserExists } from '@/lib/db/ensure-user';
import { CacheInvalidation, safeInvalidate } from '@/lib/redis/invalidation';

interface QuizAnswer {
  questionId: string;
  questionType: 'flashcard' | 'deck';
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpent?: number;
  questionOrder: number;
}

interface CompleteQuizRequest {
  flashcardId?: string;
  deckId?: string;
  quizType: 'flashcard' | 'deck';
  answers: QuizAnswer[];
  totalQuestions: number;
  correctAnswers: number;
  startTime: number; // timestamp when quiz started
}

/**
 * Calculate mastery status based on quiz scores
 * mastered: avg >= 80% and best >= 90%
 * learning: avg >= 60% or best >= 70%
 * new: otherwise
 */
function calculateQuizMasteryStatus(
  avgScore: number,
  bestScore: number
): 'new' | 'learning' | 'mastered' {
  if (avgScore >= 80 && bestScore >= 90) return 'mastered';
  if (avgScore >= 60 || bestScore >= 70) return 'learning';
  return 'new';
}

/**
 * Update or create flashcard quiz progress aggregate
 */
async function updateFlashcardQuizProgress(
  userId: string,
  flashcardId: string,
  score: number,
  questions: number,
  correct: number
) {
  const existing = await db.query.userQuizProgress.findFirst({
    where: and(
      eq(userQuizProgress.clerkUserId, userId),
      eq(userQuizProgress.flashcardId, flashcardId)
    ),
  });

  const now = new Date();

  if (existing) {
    const newTimesTaken = (existing.timesTaken || 0) + 1;
    const newTotalQuestions = (existing.totalQuestionsAnswered || 0) + questions;
    const newTotalCorrect = (existing.totalCorrectAnswers || 0) + correct;
    const newAvgScore = (newTotalCorrect / newTotalQuestions) * 100;
    const newBestScore = Math.max(
      existing.bestScore ? parseFloat(existing.bestScore) : 0,
      score
    );
    const masteryStatus = calculateQuizMasteryStatus(newAvgScore, newBestScore);

    await db
      .update(userQuizProgress)
      .set({
        timesTaken: newTimesTaken,
        totalQuestionsAnswered: newTotalQuestions,
        totalCorrectAnswers: newTotalCorrect,
        averageScore: newAvgScore.toFixed(2),
        bestScore: newBestScore.toFixed(2),
        lastScore: score.toFixed(2),
        lastTaken: now,
        masteryStatus,
        updatedAt: now,
      })
      .where(eq(userQuizProgress.id, existing.id));

    return masteryStatus;
  } else {
    const masteryStatus = calculateQuizMasteryStatus(score, score);

    await db.insert(userQuizProgress).values({
      clerkUserId: userId,
      flashcardId,
      timesTaken: 1,
      totalQuestionsAnswered: questions,
      totalCorrectAnswers: correct,
      averageScore: score.toFixed(2),
      bestScore: score.toFixed(2),
      lastScore: score.toFixed(2),
      lastTaken: now,
      masteryStatus,
    });

    return masteryStatus;
  }
}

/**
 * Update or create deck quiz progress aggregate
 */
async function updateDeckQuizProgress(
  userId: string,
  deckId: string,
  score: number,
  questions: number,
  correct: number
) {
  const existing = await db.query.deckQuizProgress.findFirst({
    where: and(
      eq(deckQuizProgress.clerkUserId, userId),
      eq(deckQuizProgress.deckId, deckId)
    ),
  });

  const now = new Date();

  if (existing) {
    const newTimesTaken = (existing.timesTaken || 0) + 1;
    const newTotalQuestions = (existing.totalQuestionsAnswered || 0) + questions;
    const newTotalCorrect = (existing.totalCorrectAnswers || 0) + correct;
    const newAvgScore = (newTotalCorrect / newTotalQuestions) * 100;
    const newBestScore = Math.max(
      existing.bestScore ? parseFloat(existing.bestScore) : 0,
      score
    );

    await db
      .update(deckQuizProgress)
      .set({
        timesTaken: newTimesTaken,
        totalQuestionsAnswered: newTotalQuestions,
        totalCorrectAnswers: newTotalCorrect,
        averageScore: newAvgScore.toFixed(2),
        bestScore: newBestScore.toFixed(2),
        lastScore: score.toFixed(2),
        lastTaken: now,
        masteryPercentage: newAvgScore.toFixed(2), // Use average score as mastery %
        updatedAt: now,
      })
      .where(eq(deckQuizProgress.id, existing.id));
  } else {
    await db.insert(deckQuizProgress).values({
      clerkUserId: userId,
      deckId,
      timesTaken: 1,
      totalQuestionsAnswered: questions,
      totalCorrectAnswers: correct,
      averageScore: score.toFixed(2),
      bestScore: score.toFixed(2),
      lastScore: score.toFixed(2),
      lastTaken: now,
      masteryPercentage: score.toFixed(2),
    });
  }
}

/**
 * POST /api/quiz-sessions/complete
 * Save completed quiz session with all answers and update aggregate stats
 */
async function completeQuizSession(request: NextRequest) {
  // 1. Validate authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureUserExists(userId);

  // 2. Parse and validate request body
  const body: CompleteQuizRequest = await request.json();
  const {
    flashcardId,
    deckId,
    quizType,
    answers,
    totalQuestions,
    correctAnswers,
    startTime,
  } = body;

  // Validate quiz type
  if (!quizType || (quizType !== 'flashcard' && quizType !== 'deck')) {
    return NextResponse.json({ error: 'Invalid quiz type' }, { status: 400 });
  }

  // Validate required fields based on quiz type
  if (quizType === 'flashcard' && !flashcardId) {
    return NextResponse.json(
      { error: 'flashcardId required for flashcard quiz' },
      { status: 400 }
    );
  }

  if (quizType === 'deck' && !deckId) {
    return NextResponse.json(
      { error: 'deckId required for deck quiz' },
      { status: 400 }
    );
  }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Answers array required' }, { status: 400 });
  }

  if (totalQuestions === undefined || correctAnswers === undefined) {
    return NextResponse.json(
      { error: 'totalQuestions and correctAnswers required' },
      { status: 400 }
    );
  }

  // 3. Calculate quiz metrics
  const now = new Date();
  const startDate = new Date(startTime);
  const quizDuration = Math.floor((now.getTime() - startDate.getTime()) / 1000); // in seconds
  const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // 4. Insert quiz session record
  const [session] = await db
    .insert(quizSessions)
    .values({
      clerkUserId: userId,
      flashcardId: quizType === 'flashcard' ? flashcardId : null,
      deckId: quizType === 'deck' ? deckId : null,
      quizType,
      startedAt: startDate,
      endedAt: now,
      totalQuestions,
      correctAnswers,
      scorePercentage: scorePercentage.toFixed(2),
      quizDuration,
    })
    .returning();

  // 5. Bulk insert all quiz answers
  if (answers.length > 0) {
    const answersToInsert = answers.map((answer) => ({
      sessionId: session.id,
      quizQuestionId: answer.questionType === 'flashcard' ? answer.questionId : null,
      deckQuizQuestionId: answer.questionType === 'deck' ? answer.questionId : null,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect: answer.isCorrect,
      timeSpent: answer.timeSpent || 0,
      questionOrder: answer.questionOrder,
    }));

    await db.insert(quizSessionAnswers).values(answersToInsert);
  }

  // 6. Update aggregate progress tables
  let masteryStatus: string | undefined;

  if (quizType === 'flashcard' && flashcardId) {
    masteryStatus = await updateFlashcardQuizProgress(
      userId,
      flashcardId,
      scorePercentage,
      totalQuestions,
      correctAnswers
    );
  } else if (quizType === 'deck' && deckId) {
    await updateDeckQuizProgress(
      userId,
      deckId,
      scorePercentage,
      totalQuestions,
      correctAnswers
    );
  }

  // 7. Invalidate cache for class progress
  try {
    if (flashcardId) {
      const flashcard = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, flashcardId),
        with: { deck: true },
      });
      if (flashcard?.deck) {
        await safeInvalidate(() =>
          CacheInvalidation.quizProgress(userId, flashcard.deck.classId)
        );
      }
    } else if (deckId) {
      const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
      });
      if (deck) {
        await safeInvalidate(() =>
          CacheInvalidation.quizProgress(userId, deck.classId)
        );
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    // Don't throw - cache invalidation failure shouldn't break the request
  }

  // 8. Return success response
  return NextResponse.json({
    success: true,
    sessionId: session.id,
    scorePercentage: parseFloat(scorePercentage.toFixed(2)),
    masteryStatus,
  });
}

export const POST = withTracing(
  withErrorHandling(completeQuizSession, 'complete quiz session'),
  { logRequest: true, logResponse: false }
);
