import { auth } from '@clerk/nextjs/server';

/**
 * Check if the current user has access to paid features
 * Uses Clerk's has() method to verify subscription status
 */
export function hasPaidAccess() {
  const { has } = auth();
  return has({ plan: 'paid' });
}

/**
 * Check if the current user is on the free plan
 */
export function hasFreeAccess() {
  const { has } = auth();
  return has({ plan: 'free_user' });
}

/**
 * Get the user's current plan
 */
export function getUserPlan() {
  const { has } = auth();

  if (has({ plan: 'paid' })) {
    return 'paid';
  }

  return 'free';
}
