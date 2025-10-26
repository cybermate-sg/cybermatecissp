import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if the current user is an admin
 * Returns the user object if admin, null otherwise
 */
export async function checkIsAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Check if user exists in database and has admin role
  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}

/**
 * Require admin role, throw error if not admin
 */
export async function requireAdmin() {
  const user = await checkIsAdmin();

  if (!user) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}
