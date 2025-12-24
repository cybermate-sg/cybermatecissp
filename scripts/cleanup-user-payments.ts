import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before any other imports
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Now import db modules after env vars are loaded
async function cleanupUserPayments() {
  const { db } = await import('../src/lib/db');
  const { users, payments, subscriptions } = await import('../src/lib/db/schema');
  const { eq } = await import('drizzle-orm');

  const userEmail = 'rajaimadhavan@gmail.com';

  console.log(`🔍 Looking for user: ${userEmail}`);

  // Find the user
  const user = await db.query.users.findFirst({
    where: eq(users.email, userEmail),
  });

  if (!user) {
    console.log(`❌ User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.clerkUserId}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);

  // Count records before deletion
  const paymentsCount = await db.query.payments.findMany({
    where: eq(payments.clerkUserId, user.clerkUserId),
  });

  const subscriptionsCount = await db.query.subscriptions.findMany({
    where: eq(subscriptions.clerkUserId, user.clerkUserId),
  });

  console.log(`\n📊 Records to delete:`);
  console.log(`   Payments: ${paymentsCount.length}`);
  console.log(`   Subscriptions: ${subscriptionsCount.length}`);

  if (paymentsCount.length === 0 && subscriptionsCount.length === 0) {
    console.log(`\n✨ No records to clean. User already has a clean slate!`);
    process.exit(0);
  }

  // Delete payments
  if (paymentsCount.length > 0) {
    console.log(`\n🗑️  Deleting ${paymentsCount.length} payment records...`);
    await db.delete(payments).where(eq(payments.clerkUserId, user.clerkUserId));
    console.log(`✅ Payments deleted`);
  }

  // Delete subscriptions
  if (subscriptionsCount.length > 0) {
    console.log(`\n🗑️  Deleting ${subscriptionsCount.length} subscription records...`);
    await db.delete(subscriptions).where(eq(subscriptions.clerkUserId, user.clerkUserId));
    console.log(`✅ Subscriptions deleted`);
  }

  console.log(`\n✨ Cleanup complete! User ${userEmail} now has a clean slate for testing.`);
  process.exit(0);
}

cleanupUserPayments().catch((error) => {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
});
