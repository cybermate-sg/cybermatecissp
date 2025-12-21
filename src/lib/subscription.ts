import { auth } from '@clerk/nextjs/server';
import { db, withRetry } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if the current user has access to paid features
 * Checks the subscriptions table in the database for active Stripe subscription
 */
export async function hasPaidAccess() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  // Query the database for an active subscription
  const subscription = await withRetry(
    () => db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, userId),
    }),
    { queryName: 'check-paid-access' }
  );

  // User has paid access if they have an active, trialing, or past_due subscription
  // past_due is included to give users grace period if payment fails
  if (!subscription) {
    return false;
  }

  return subscription.status === 'active' ||
         subscription.status === 'trialing' ||
         subscription.planType === 'lifetime';
}

/**
 * Check if the current user is on the free plan
 */
export async function hasFreeAccess() {
  const { userId } = await auth();
  return !!userId;
}

/**
 * Get the user's current plan
 * Returns plan type from the database or 'free' if no subscription
 */
export async function getUserPlan() {
  const { userId } = await auth();

  if (!userId) {
    return 'free';
  }

  const subscription = await withRetry(
    () => db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, userId),
    }),
    { queryName: 'get-user-plan' }
  );

  if (!subscription) {
    return 'free';
  }

  // Return the plan type if subscription is active
  if (subscription.status === 'active' ||
      subscription.status === 'trialing' ||
      subscription.planType === 'lifetime') {
    return subscription.planType;
  }

  return 'free';
}
