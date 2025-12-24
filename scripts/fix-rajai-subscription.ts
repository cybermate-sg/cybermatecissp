/**
 * One-time script to fix Rajai's subscription with Stripe customer ID
 * Run this with: npx tsx scripts/fix-rajai-subscription.ts
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
import { subscriptions } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function fixRajaiSubscription() {
  const clerkUserId = 'user_376SpE6U28ha7BtjDW3UCO2mjfb'; // rajaimadhavan@gmail.com
  const stripeCustomerId = 'cus_RNXPXvlWwsZdEq'; // From Stripe Dashboard

  console.log('🔄 Updating rajaimadhavan@gmail.com subscription...');

  try {
    // Update the subscription with Stripe customer ID
    const result = await db
      .update(subscriptions)
      .set({
        stripeCustomerId: stripeCustomerId, // Add this from Stripe dashboard
        planType: 'lifetime',
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.clerkUserId, clerkUserId))
      .returning();

    if (result.length > 0) {
      console.log('✅ Successfully updated subscription:', result[0]);
    } else {
      console.log('❌ No subscription found for user:', clerkUserId);
    }
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  }

  process.exit(0);
}

fixRajaiSubscription();
