import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { studySessions } from '@/lib/db/schema';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

async function createSession(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deckIds } = body;

    if (!deckIds || !Array.isArray(deckIds) || deckIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one deck must be selected' },
        { status: 400 }
      );
    }

    // Create a new study session
    // Note: We'll store the first deckId, but in a real implementation
    // you might want to create a separate table for session-deck relationships
    const [session] = await db
      .insert(studySessions)
      .values({
        clerkUserId: userId,
        deckId: deckIds[0], // Store first deck ID
        startedAt: new Date(),
        cardsStudied: 0,
      })
      .returning();

    return NextResponse.json({
      sessionId: session.id,
      startedAt: session.startedAt,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(createSession, 'create study session'),
  { logRequest: true, logResponse: true }
);
