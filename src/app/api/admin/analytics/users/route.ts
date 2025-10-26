import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { users, userStats, userCardProgress, domains, flashcards } from '@/lib/db/schema';
import { eq, sql, desc, and, inArray } from 'drizzle-orm';

/**
 * GET /api/admin/analytics/users
 * Get performance analytics for all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const domainId = searchParams.get('domainId');

    // If specific user requested
    if (userId) {
      return getUserAnalytics(userId, domainId);
    }

    // Get all users with their stats
    const allUsers = await db
      .select({
        clerkUserId: users.clerkUserId,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        totalCardsStudied: userStats.totalCardsStudied,
        studyStreakDays: userStats.studyStreakDays,
        totalStudyTime: userStats.totalStudyTime,
        lastActiveDate: userStats.lastActiveDate,
      })
      .from(users)
      .leftJoin(userStats, eq(users.clerkUserId, userStats.clerkUserId))
      .orderBy(desc(userStats.totalCardsStudied));

    // For each user, get their domain-wise progress
    const usersWithProgress = await Promise.all(
      allUsers.map(async (user) => {
        // Get mastery breakdown
        const progressRecords = await db
          .select({
            masteryStatus: userCardProgress.masteryStatus,
            count: sql<number>`count(*)::int`,
          })
          .from(userCardProgress)
          .where(eq(userCardProgress.clerkUserId, user.clerkUserId))
          .groupBy(userCardProgress.masteryStatus);

        const masteryBreakdown = {
          new: 0,
          learning: 0,
          mastered: 0,
        };

        progressRecords.forEach((record) => {
          masteryBreakdown[record.masteryStatus as keyof typeof masteryBreakdown] = record.count;
        });

        return {
          ...user,
          masteryBreakdown,
          totalCardsInProgress: masteryBreakdown.new + masteryBreakdown.learning + masteryBreakdown.mastered,
        };
      })
    );

    return NextResponse.json({
      users: usersWithProgress,
      total: usersWithProgress.length,
    });

  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * Get detailed analytics for a specific user
 */
async function getUserAnalytics(userId: string, domainId: string | null) {
  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
    with: {
      stats: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get all domains
  const allDomains = await db.query.domains.findMany({
    with: {
      topics: {
        with: {
          decks: {
            with: {
              flashcards: {
                where: eq(flashcards.isPublished, true),
              },
            },
          },
        },
      },
    },
  });

  // Calculate progress per domain
  const domainProgress = await Promise.all(
    allDomains.map(async (domain) => {
      const flashcardIds = domain.topics.flatMap((topic) =>
        topic.decks.flatMap((deck) => deck.flashcards.map((card) => card.id))
      );

      if (flashcardIds.length === 0) {
        return {
          domainId: domain.id,
          domainName: domain.name,
          totalCards: 0,
          studiedCards: 0,
          masteredCards: 0,
          learningCards: 0,
          newCards: 0,
          progress: 0,
        };
      }

      const progressRecords = await db
        .select()
        .from(userCardProgress)
        .where(
          and(
            eq(userCardProgress.clerkUserId, userId),
            inArray(userCardProgress.flashcardId, flashcardIds)
          )
        );

      const studiedCards = progressRecords.length;
      const masteredCards = progressRecords.filter((p) => p.masteryStatus === 'mastered').length;
      const learningCards = progressRecords.filter((p) => p.masteryStatus === 'learning').length;
      const newCardsCount = progressRecords.filter((p) => p.masteryStatus === 'new').length;

      return {
        domainId: domain.id,
        domainName: domain.name,
        totalCards: flashcardIds.length,
        studiedCards,
        masteredCards,
        learningCards,
        newCards: newCardsCount,
        progress: flashcardIds.length > 0 ? Math.round((studiedCards / flashcardIds.length) * 100) : 0,
      };
    })
  );

  // If specific domain requested, get card-level details
  let cardDetails = null;
  if (domainId) {
    const domain = allDomains.find((d) => d.id === domainId);
    if (domain) {
      const flashcardIds = domain.topics.flatMap((topic) =>
        topic.decks.flatMap((deck) => deck.flashcards.map((card) => card.id))
      );

      if (flashcardIds.length > 0) {
        cardDetails = await db
          .select({
            flashcardId: userCardProgress.flashcardId,
            confidenceLevel: userCardProgress.confidenceLevel,
            timesSeen: userCardProgress.timesSeen,
            masteryStatus: userCardProgress.masteryStatus,
            lastSeen: userCardProgress.lastSeen,
          })
          .from(userCardProgress)
          .where(
            and(
              eq(userCardProgress.clerkUserId, userId),
              inArray(userCardProgress.flashcardId, flashcardIds)
            )
          );
      }
    }
  }

  return NextResponse.json({
    user: {
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    stats: user.stats,
    domainProgress,
    cardDetails,
  });
}
