import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auditLogger, SecurityEventType } from '@/lib/security/audit-logger';

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
    // Log failed admin access attempt
    if (user) {
      auditLogger.logAuthzEvent(
        SecurityEventType.PERMISSION_ESCALATION_ATTEMPT,
        false,
        {
          userId: user.clerkUserId,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
        { attemptedRole: 'admin', actualRole: user.role }
      );
    }
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
    const { userId } = await auth();

    // Log access denied
    auditLogger.logAuthzEvent(
      SecurityEventType.ACCESS_DENIED,
      false,
      {
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
      },
      { requiredRole: 'admin', reason: 'Admin access required' }
    );

    throw new Error('Unauthorized: Admin access required');
  }

  // Log successful admin access
  auditLogger.logAuthzEvent(
    SecurityEventType.ADMIN_ACCESS,
    true,
    {
      userId: user.clerkUserId,
      email: user.email,
      timestamp: new Date().toISOString(),
    }
  );

  return user;
}
