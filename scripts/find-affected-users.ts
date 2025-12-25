import 'dotenv/config';
import Stripe from 'stripe';
import { db } from '../src/lib/db';
import { subscriptions, payments, users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Find all users affected by the webhook bug
 *
 * Criteria:
 * - Have a successful payment in Stripe
 * - But still have plan_type: 'free' in database
 * - Payment was made after webhook was created (2025-11-05)
 */

async function findAffectedUsers() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
  });

  console.log('🔍 Searching for users affected by webhook bug...');
  console.log('');
  console.log('Criteria:');
  console.log('- Payment succeeded in Stripe');
  console.log('- plan_type: "free" in database');
  console.log('- Payment after 2025-11-05 (when webhook was created)');
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Get all successful checkout.session.completed events since webhook was created
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      created: {
        gte: Math.floor(new Date('2025-11-05').getTime() / 1000), // Unix timestamp
      },
      limit: 100,
    });

    console.log(`Found ${events.data.length} checkout sessions in Stripe\n`);

    const affectedUsers: Array<{
      email: string;
      clerkUserId: string;
      sessionId: string;
      paymentIntentId: string;
      amount: number;
      currency: string;
      priceId: string;
      paymentDate: Date;
      currentPlanType: string;
      hasPaymentRecord: boolean;
    }> = [];

    for (const event of events.data) {
      const session = event.data.object as Stripe.Checkout.Session;

      // Skip if not a payment mode session
      if (session.mode !== 'payment') continue;

      // Get clerk user ID
      const clerkUserId = session.metadata?.userId || session.client_reference_id;
      if (!clerkUserId) continue;

      // Get email
      const email = session.customer_email || (session as any).customer_details?.email;
      if (!email) continue;

      // Check subscription in database
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.clerkUserId, clerkUserId),
      });

      if (!subscription) {
        console.log(`⚠️ User ${email} has payment but no subscription record!`);
        continue;
      }

      // Check if user should have lifetime but doesn't
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price', 'payment_intent'],
      });

      const priceId = fullSession.line_items?.data[0]?.price?.id || '';
      const isLifetimePurchase = priceId === process.env.STRIPE_LIFETIME_PRICE_ID ||
                                  priceId === process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID;

      // Only check lifetime purchases
      if (!isLifetimePurchase) continue;

      // Check if they still have 'free' plan
      if (subscription.planType !== 'free') continue;

      // Check if payment record exists
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || '';

      const paymentRecord = await db.query.payments.findFirst({
        where: eq(payments.stripePaymentIntentId, paymentIntentId),
      });

      const pi = fullSession.payment_intent as Stripe.PaymentIntent | null;

      affectedUsers.push({
        email,
        clerkUserId,
        sessionId: session.id,
        paymentIntentId,
        amount: pi?.amount || 0,
        currency: pi?.currency || 'usd',
        priceId,
        paymentDate: new Date(event.created * 1000),
        currentPlanType: subscription.planType,
        hasPaymentRecord: !!paymentRecord,
      });
    }

    console.log('='.repeat(80));
    console.log('📊 RESULTS');
    console.log('='.repeat(80));
    console.log('');

    if (affectedUsers.length === 0) {
      console.log('✅ No affected users found!');
      console.log('   All paid users have correct subscription status.');
    } else {
      console.log(`❌ Found ${affectedUsers.length} affected user(s):\n`);

      affectedUsers.forEach((user, index) => {
        console.log(`User #${index + 1}:`);
        console.log('- Email:', user.email);
        console.log('- Clerk User ID:', user.clerkUserId);
        console.log('- Session ID:', user.sessionId);
        console.log('- Payment Intent:', user.paymentIntentId);
        console.log('- Amount:', `$${(user.amount / 100).toFixed(2)}`, user.currency.toUpperCase());
        console.log('- Price ID:', user.priceId);
        console.log('- Payment Date:', user.paymentDate.toISOString());
        console.log('- Current Plan:', user.currentPlanType, '← Should be "lifetime"');
        console.log('- Has Payment Record:', user.hasPaymentRecord ? 'Yes' : 'No ← Missing!');
        console.log('');
      });

      console.log('='.repeat(80));
      console.log('🔧 NEXT STEPS');
      console.log('='.repeat(80));
      console.log('');
      console.log('To fix these users, run:');
      console.log('');

      affectedUsers.forEach((user, index) => {
        console.log(`# User ${index + 1}: ${user.email}`);
        console.log(`UPDATE subscriptions SET plan_type = 'lifetime', status = 'active', updated_at = NOW() WHERE clerk_user_id = '${user.clerkUserId}';`);

        if (!user.hasPaymentRecord) {
          console.log(`INSERT INTO payments (clerk_user_id, stripe_payment_intent_id, amount, currency, status, payment_method, created_at) VALUES ('${user.clerkUserId}', '${user.paymentIntentId}', ${user.amount}, '${user.currency}', 'succeeded', 'card', '${user.paymentDate.toISOString()}');`);
        }
        console.log('');
      });

      console.log('Or create a script to automate this for all users.');
    }

  } catch (error) {
    console.error('❌ Error finding affected users:', error);
  }
}

findAffectedUsers();
