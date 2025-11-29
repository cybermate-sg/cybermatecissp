import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sessionCards } from '@/lib/db/schema';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

async function saveSessionCard(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, flashcardId, confidenceRating, responseTime } = body;

    if (!sessionId || !flashcardId || confidenceRating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert session card record
    await db.insert(sessionCards).values({
      sessionId,
      flashcardId,
      confidenceRating,
      responseTime: responseTime || 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving session card:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(saveSessionCard, 'save session card'),
  { logRequest: true, logResponse: false }
);
