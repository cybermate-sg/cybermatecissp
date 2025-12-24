/**
 * Cleanup script to remove test users from database
 * Run this with: DATABASE_URL="..." npx tsx scripts/cleanup-test-users.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local FIRST
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db/index.js';
import { users, subscriptions, payments, userStats, userCardProgress } from '../src/lib/db/schema.js';
import { eq, or } from 'drizzle-orm';

const TEST_EMAILS = [
  'rmkugan@gmail.com',
  'rajaimadhavan@gmail.com'
];

async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...\n');

  for (const email of TEST_EMAILS) {
    try {
      console.log(`\n📧 Processing: ${email}`);

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        console.log(`  ⚠️ User not found, skipping...`);
        continue;
      }

      const clerkUserId = user.clerkUserId;
      console.log(`  Found user: ${clerkUserId}`);

      // Get counts before deletion
      const userPayments = await db.query.payments.findMany({
        where: eq(payments.clerkUserId, clerkUserId),
      });

      const userSubscriptions = await db.query.subscriptions.findMany({
        where: eq(subscriptions.clerkUserId, clerkUserId),
      });

      const userStatsRecords = await db.query.userStats.findMany({
        where: eq(userStats.clerkUserId, clerkUserId),
      });

      const userProgress = await db.query.userCardProgress.findMany({
        where: eq(userCardProgress.clerkUserId, clerkUserId),
      });

      console.log(`  📊 Records to delete:`);
      console.log(`     - Payments: ${userPayments.length}`);
      console.log(`     - Subscriptions: ${userSubscriptions.length}`);
      console.log(`     - User Stats: ${userStatsRecords.length}`);
      console.log(`     - Card Progress: ${userProgress.length}`);

      // Delete user (cascade will handle related records)
      await db.delete(users).where(eq(users.clerkUserId, clerkUserId));

      console.log(`  ✅ Successfully deleted user and all related records`);

    } catch (error) {
      console.error(`  ❌ Error deleting user ${email}:`, error);
    }
  }

  console.log('\n✅ Cleanup complete!\n');
  process.exit(0);
}

cleanupTestUsers();
