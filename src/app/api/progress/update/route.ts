import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userCardProgress } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { flashcardId, confidenceLevel } = body;

    if (!flashcardId || confidenceLevel === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if progress record exists
    const [existing] = await db
      .select()
      .from(userCardProgress)
      .where(
        and(
          eq(userCardProgress.clerkUserId, userId),
          eq(userCardProgress.flashcardId, flashcardId)
        )
      )
      .limit(1);

    const now = new Date();
    const masteryStatus = confidenceLevel >= 4 ? 'mastered' : confidenceLevel >= 2 ? 'learning' : 'new';

    if (existing) {
      // Update existing record
      await db
        .update(userCardProgress)
        .set({
          confidenceLevel,
          timesSeen: (existing.timesSeen || 0) + 1,
          lastSeen: now,
          masteryStatus: masteryStatus as 'new' | 'learning' | 'mastered',
          updatedAt: now,
        })
        .where(eq(userCardProgress.id, existing.id));
    } else {
      // Create new record
      await db.insert(userCardProgress).values({
        clerkUserId: userId,
        flashcardId,
        confidenceLevel,
        timesSeen: 1,
        lastSeen: now,
        masteryStatus: masteryStatus as 'new' | 'learning' | 'mastered',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
