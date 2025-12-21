import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, withRetry } from '@/lib/db';
import { subscriptions, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentSuccessEmail, sendPaymentFailureEmail } from '@/lib/email/payment-notifications';

// Lazy initialization to avoid errors during build time
let stripe: Stripe;
function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-10-29.clover',
    });
  }
  return stripe;
}

// Helper type for subscription with period fields
type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    console.log('Processing webhook event:', event.type, 'ID:', event.id);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        // Don't send email here - it will be sent by checkout.session.completed
        await handlePaymentSucceeded(paymentIntent, undefined, undefined, undefined, false);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log('✅ Successfully processed webhook:', event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    console.error('Event type:', event.type);
    console.error('Event ID:', event.id);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkUserId = session.metadata?.userId || session.client_reference_id;
  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerName = session.customer_details?.name || 'there';

  if (!clerkUserId && !customerEmail) {
    console.error('No clerkUserId or customer email in session metadata');
    return;
  }

  // If this is a subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    // Fetch full subscription details from Stripe
    const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId);

    await handleSubscriptionUpdate(stripeSubscription, clerkUserId || undefined, session.customer as string);
  }

  // If this is a one-time payment
  if (session.mode === 'payment' && session.payment_intent) {
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id;

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    await handlePaymentSucceeded(paymentIntent, clerkUserId || undefined, customerEmail || undefined, customerName);
  }
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  clerkUserId?: string,
  customerId?: string
) {
  // Get clerkUserId from subscription metadata if not provided
  const userId = clerkUserId || subscription.metadata?.clerkUserId;

  if (!userId) {
    console.error('No clerkUserId found for subscription:', subscription.id);
    return;
  }

  const customer = customerId || (typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id);

  // Determine plan type based on price or product
  const planType: 'free' | 'pro_monthly' | 'pro_yearly' | 'lifetime' = 'pro_monthly';

  // Map subscription status
  const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'> = {
    'active': 'active',
    'canceled': 'canceled',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'incomplete': 'inactive',
    'incomplete_expired': 'inactive',
    'unpaid': 'past_due',
  };

  const status = statusMap[subscription.status] || 'inactive';

  // Check if subscription already exists
  const existingSubscription = await withRetry(
    () => db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id),
    }),
    { queryName: 'webhook-find-subscription' }
  );

  if (existingSubscription) {
    // Update existing subscription
    await withRetry(
      () => db
        .update(subscriptions)
        .set({
          status,
          planType,
          currentPeriodStart: new Date((subscription as SubscriptionWithPeriod).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as SubscriptionWithPeriod).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id)),
      { queryName: 'webhook-update-subscription' }
    );

    console.log('Updated subscription:', subscription.id);
  } else {
    // Create new subscription
    await withRetry(
      () => db.insert(subscriptions).values({
        clerkUserId: userId,
        stripeCustomerId: customer,
        stripeSubscriptionId: subscription.id,
        planType,
        status,
        currentPeriodStart: new Date((subscription as SubscriptionWithPeriod).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as SubscriptionWithPeriod).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }),
      { queryName: 'webhook-insert-subscription' }
    );

    console.log('Created new subscription:', subscription.id);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await withRetry(
    () => db
      .update(subscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id)),
    { queryName: 'webhook-delete-subscription' }
  );

  console.log('Subscription canceled:', subscription.id);
}

async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  clerkUserId?: string,
  customerEmail?: string,
  customerName?: string,
  sendEmail: boolean = true
) {
  const userId = clerkUserId || paymentIntent.metadata?.clerkUserId;
  const userEmail = customerEmail || paymentIntent.metadata?.userEmail || paymentIntent.receipt_email;
  const userName = customerName || paymentIntent.metadata?.userName || 'there';

  if (!userId && !userEmail) {
    console.error('No clerkUserId or email found for payment:', paymentIntent.id);
    return;
  }

  // Record the payment (only if we have a valid user ID)
  if (userId && userId !== 'guest') {
    try {
      await withRetry(
        () => db.insert(payments).values({
          clerkUserId: userId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          paymentMethod: paymentIntent.payment_method_types[0] || 'unknown',
        }),
        { queryName: 'webhook-insert-payment-succeeded' }
      );
      console.log('✅ Payment recorded in database:', paymentIntent.id);
    } catch (dbError) {
      // Don't fail the webhook if database insert fails
      console.error('❌ Failed to record payment in database:', dbError);
      console.log('⚠️ Continuing with email notification despite database error');
    }
  } else {
    console.log('⚠️ Guest purchase - skipping database record for payment:', paymentIntent.id);
  }

  console.log('Payment succeeded:', paymentIntent.id);

  // Send payment success email (only if sendEmail is true)
  if (sendEmail && userEmail) {
    try {
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        : undefined;

      console.log('Attempting to send payment success email to:', userEmail);

      const emailResult = await sendPaymentSuccessEmail({
        userEmail,
        userName,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentIntentId: paymentIntent.id,
        dashboardUrl,
      });

      if (emailResult.success) {
        console.log('✅ Payment success email sent to:', userEmail);
      } else {
        console.error('❌ Failed to send payment success email:', emailResult.error);
      }
    } catch (emailError) {
      // Don't fail the webhook if email fails - just log it
      console.error('❌ Exception while sending payment success email:', emailError);
      if (emailError instanceof Error) {
        console.error('Email error details:', emailError.message);
      }
    }
  } else if (!sendEmail) {
    console.log('ℹ️ Skipping email notification (will be sent by checkout.session.completed)');
  } else {
    console.warn('⚠️ No email address found to send payment confirmation');
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.clerkUserId;
  const userEmail = paymentIntent.metadata?.userEmail || paymentIntent.receipt_email;
  const userName = paymentIntent.metadata?.userName || 'there';

  if (!userId && !userEmail) {
    console.error('No clerkUserId or email found for failed payment:', paymentIntent.id);
    return;
  }

  // Record the failed payment (only if we have a valid user ID)
  if (userId && userId !== 'guest') {
    try {
      await withRetry(
        () => db.insert(payments).values({
          clerkUserId: userId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'failed',
          paymentMethod: paymentIntent.payment_method_types[0] || 'unknown',
        }),
        { queryName: 'webhook-insert-payment-failed' }
      );
      console.log('✅ Failed payment recorded in database:', paymentIntent.id);
    } catch (dbError) {
      console.error('❌ Failed to record failed payment in database:', dbError);
      console.log('⚠️ Continuing with email notification despite database error');
    }
  } else {
    console.log('⚠️ Guest purchase - skipping database record for failed payment:', paymentIntent.id);
  }

  console.log('Payment failed:', paymentIntent.id);

  // Send payment failure email
  if (userEmail) {
    const failureReason = paymentIntent.last_payment_error?.message || 'Unknown reason';

    const emailResult = await sendPaymentFailureEmail({
      userEmail,
      userName,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentIntentId: paymentIntent.id,
      failureReason,
    });

    if (emailResult.success) {
      console.log('Payment failure email sent to:', userEmail);
    } else {
      console.error('Failed to send payment failure email:', emailResult.error);
    }
  }
}
