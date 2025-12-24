import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, subscriptions, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Ensure user exists in database, create if not
 * This is a fallback for when the Clerk webhook doesn't fire
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!existingUser) {
    // User doesn't exist, create them (webhook might have failed)
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error('Unable to fetch user from Clerk');
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;

    try {
      // Create user
      await db.insert(users).values({
        clerkUserId: userId,
        email: email!,
        name,
        role: 'user',
      });

      // Create free subscription
      await db.insert(subscriptions).values({
        clerkUserId: userId,
        planType: 'free',
        status: 'active',
      });

      // Initialize user stats
      await db.insert(userStats).values({
        clerkUserId: userId,
        totalCardsStudied: 0,
        studyStreakDays: 0,
        totalStudyTime: 0,
        dailyCardsStudiedToday: 0,
      });

      console.log('[ensureUserExists] User auto-created:', userId);
    } catch (error) {
      console.error('[ensureUserExists] Error auto-creating user:', error);
      throw error;
    }
  }
}
