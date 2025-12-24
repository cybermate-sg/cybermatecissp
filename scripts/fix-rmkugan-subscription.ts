import 'dotenv/config';
import { db } from '../src/lib/db';
import { subscriptions, payments } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Fix rmkugan@gmail.com's subscription
 *
 * Background:
 * - User paid $60 AUD on 2025-12-24 11:56:10 UTC
 * - Payment succeeded in Stripe (pi_3ShqflIrWKHinSAD05pQ92xy)
 * - Webhook failed to process because URL was misconfigured
 * - This script manually applies what the webhook should have done
 */

async function fixSubscription() {
  try {
    const clerkUserId = 'user_34pLLWdZqlsE1iZ1sjtjwdvmGCj';
    const paymentIntentId = 'pi_3ShqflIrWKHinSAD05pQ92xy';

    console.log('🔧 Manually fixing subscription for paid user');
    console.log('   User ID:', clerkUserId);
    console.log('   Email: rmkugan@gmail.com');
    console.log('   Payment Intent:', paymentIntentId);
    console.log('');

    // 1. Check if payment already exists (in case script was run before)
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.stripePaymentIntentId, paymentIntentId),
    });

    if (existingPayment) {
      console.log('⚠️ Payment record already exists in database');
      console.log('   Payment ID:', existingPayment.id);
    } else {
      // Insert payment record
      console.log('1️⃣ Recording payment in database...');
      await db.insert(payments).values({
        clerkUserId,
        stripePaymentIntentId: paymentIntentId,
        amount: 6000, // $60.00 AUD in cents
        currency: 'aud',
        status: 'succeeded',
        paymentMethod: 'card',
        createdAt: new Date('2025-12-24T11:56:10.000Z'),
      });
      console.log('   ✅ Payment recorded');
    }

    // 2. Update subscription to lifetime
    console.log('');
    console.log('2️⃣ Updating subscription to lifetime...');
    await db
      .update(subscriptions)
      .set({
        planType: 'lifetime',
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.clerkUserId, clerkUserId));
    console.log('   ✅ Subscription updated');

    // 3. Verify the fix
    console.log('');
    console.log('3️⃣ Verifying fix...');
    const updated = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, clerkUserId),
    });

    const payment = await db.query.payments.findFirst({
      where: eq(payments.stripePaymentIntentId, paymentIntentId),
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ FIX COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('');
    console.log('📋 Subscription:');
    console.log('   Plan Type:', updated?.planType);
    console.log('   Status:', updated?.status);
    console.log('   Updated At:', updated?.updatedAt);
    console.log('');
    console.log('💳 Payment:');
    console.log('   Payment ID:', payment?.id);
    console.log('   Amount:', payment?.amount ? `$${(payment.amount / 100).toFixed(2)}` : 'N/A', payment?.currency?.toUpperCase());
    console.log('   Status:', payment?.status);
    console.log('   Created:', payment?.createdAt);
    console.log('');
    console.log('✅ User rmkugan@gmail.com now has lifetime access!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixSubscription();
