import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { studySessions, userStats, sessionCards } from '@/lib/db/schema';
import { eq, and, avg } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

async function endSession(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, cardsStudied } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the session
    const [session] = await db
      .select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.id, sessionId),
          eq(studySessions.clerkUserId, userId)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const endedAt = new Date();
    const studyDuration = Math.floor((endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000); // in seconds

    // Get average confidence from session cards using safe aggregate function
    const sessionCardRecords = await db
      .select({
        avgConfidence: avg(sessionCards.confidenceRating).as('avg_confidence'),
      })
      .from(sessionCards)
      .where(eq(sessionCards.sessionId, sessionId));

    const averageConfidence = sessionCardRecords[0]?.avgConfidence
      ? parseFloat(sessionCardRecords[0].avgConfidence.toString()).toFixed(2)
      : "0.00";

    // Update the session
    await db
      .update(studySessions)
      .set({
        endedAt,
        cardsStudied: cardsStudied || 0,
        studyDuration,
        averageConfidence,
      })
      .where(eq(studySessions.id, sessionId));

    // Update user stats
    const [userStatsRecord] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.clerkUserId, userId))
      .limit(1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (userStatsRecord) {
      const lastActiveDate = userStatsRecord.lastActiveDate ? new Date(userStatsRecord.lastActiveDate) : null;
      const lastActiveDateOnly = lastActiveDate ? new Date(lastActiveDate) : null;
      if (lastActiveDateOnly) {
        lastActiveDateOnly.setHours(0, 0, 0, 0);
      }

      let newStreakDays = userStatsRecord.studyStreakDays || 0;

      // Check if this is a new day
      if (!lastActiveDateOnly || lastActiveDateOnly.getTime() < today.getTime()) {
        // Check if the streak should continue (studied yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActiveDateOnly && lastActiveDateOnly.getTime() === yesterday.getTime()) {
          newStreakDays += 1; // Continue streak
        } else if (!lastActiveDateOnly || lastActiveDateOnly.getTime() < yesterday.getTime()) {
          newStreakDays = 1; // Start new streak
        }
      }

      await db
        .update(userStats)
        .set({
          totalCardsStudied: (userStatsRecord.totalCardsStudied || 0) + (cardsStudied || 0),
          totalStudyTime: (userStatsRecord.totalStudyTime || 0) + studyDuration,
          studyStreakDays: newStreakDays,
          lastActiveDate: endedAt,
        })
        .where(eq(userStats.clerkUserId, userId));
    } else {
      // Create new user stats record
      await db.insert(userStats).values({
        clerkUserId: userId,
        totalCardsStudied: cardsStudied || 0,
        totalStudyTime: studyDuration,
        studyStreakDays: 1,
        lastActiveDate: endedAt,
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        cardsStudied: cardsStudied || 0,
        studyDuration,
        averageConfidence,
      },
    });
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(endSession, 'end study session'),
  { logRequest: true, logResponse: false }
);
