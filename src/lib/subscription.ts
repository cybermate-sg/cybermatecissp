import { auth } from '@clerk/nextjs/server';
import { db, withRetry } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Access duration in days for paid subscriptions
 * Change this value to adjust how long users have access after purchase
 */
export const ACCESS_DURATION_DAYS = 180;

/**
 * Calculate remaining days for a subscription
 * @param createdAt - The subscription creation date
 * @returns Number of days remaining (0 if expired)
 */
export function calculateDaysRemaining(createdAt: Date): number {
  const startDate = new Date(createdAt);
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, ACCESS_DURATION_DAYS - daysSinceStart);
}

/**
 * Check if a subscription has expired based on creation date
 * @param createdAt - The subscription creation date
 * @returns true if expired (more than ACCESS_DURATION_DAYS since creation)
 */
export function isSubscriptionExpired(createdAt: Date): boolean {
  return calculateDaysRemaining(createdAt) === 0;
}

/**
 * Check if the current user has access to paid features
 * Checks the subscriptions table in the database for active Stripe subscription
 * Also verifies the subscription hasn't expired (180 days from creation)
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

  // User has paid access if they have an active, trialing subscription
  // past_due is included to give users grace period if payment fails
  if (!subscription) {
    return false;
  }

  // Check if subscription is active or trialing
  const hasActiveStatus = subscription.status === 'active' ||
                          subscription.status === 'trialing' ||
                          subscription.planType === 'lifetime';

  if (!hasActiveStatus) {
    return false;
  }

  // Check if subscription has expired (more than 180 days since creation)
  if (subscription.createdAt && isSubscriptionExpired(subscription.createdAt)) {
    return false;
  }

  return true;
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
 * Also checks if subscription has expired (180 days from creation)
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

  // Check if subscription has expired (more than 180 days since creation)
  if (subscription.createdAt && isSubscriptionExpired(subscription.createdAt)) {
    return 'expired';
  }

  // Return the plan type if subscription is active
  if (subscription.status === 'active' ||
      subscription.status === 'trialing' ||
      subscription.planType === 'lifetime') {
    return subscription.planType;
  }

  return 'free';
}
