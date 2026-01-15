# Stripe Webhook Setup Guide

This guide will help you configure Stripe webhooks to automatically save payment and subscription data to your database.

## Prerequisites

1. Stripe account with API keys
2. Stripe CLI installed (for local testing)
3. Environment variables configured

## Step 1: Add Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (get this from Step 3)
```

## Step 2: Install Stripe Package

Make sure you have the Stripe package installed:

```bash
npm install stripe
```

## Step 3: Set Up Webhook in Stripe Dashboard

### For Production:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### For Local Development:

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (using Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. The CLI will output a webhook signing secret (starts with `whsec_`). Add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. Keep the CLI running in a separate terminal while testing

## Step 4: Test the Webhook

### Using Stripe CLI:

In a separate terminal, trigger a test event:

```bash
# Test checkout session completed
stripe trigger checkout.session.completed

# Test payment succeeded
stripe trigger payment_intent.succeeded

# Test subscription created
stripe trigger customer.subscription.created
```

### Manual Testing:

1. Create a test payment in your application
2. Use Stripe test card: `4242 4242 4242 4242`
3. Any future expiry date, any 3-digit CVC
4. Check your terminal/console logs for webhook events
5. Verify data in your database

## Step 5: Verify Database Records

After a successful payment, check your database:

```sql
-- Check subscriptions
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;

-- Check payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
```

## How It Works

### When a customer completes checkout:

1. Stripe sends `checkout.session.completed` event to your webhook
2. Webhook extracts `clerkUserId` from session metadata
3. Creates/updates subscription record in database with:
   - Stripe customer ID
   - Subscription ID
   - Plan type (pro/free/enterprise)
   - Status (active/canceled/etc.)
   - **Current period start** (used to calculate remaining days)
   - Current period end
4. Records payment in payments table

### Calculating Remaining Days:

The system uses the subscription `createdAt` date (when the subscription was first created in your database):

```typescript
const startDate = new Date(subscription.createdAt);
const today = new Date();
const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
const daysLeft = Math.max(0, ACCESS_DURATION_DAYS - daysSinceStart);
```

**How it works:**
- When a user completes payment, the webhook creates a subscription record with `createdAt` timestamp
- The class page calculates: Days remaining = ACCESS_DURATION_DAYS - (days since createdAt)
- Shows: "Hi, [Name], you have [X] days left"
- Users get **180 days (6 months)** of access from their subscription date
- When `daysLeft` reaches 0, access is blocked and users can re-purchase

**Access Control:**
- The `ACCESS_DURATION_DAYS` constant in `src/lib/subscription.ts` controls the duration (currently 180 days)
- `hasPaidAccess()` function checks both subscription status AND expiry
- Expired users are blocked from accessing premium content
- Expired users CAN re-purchase to renew their access

## Important: Include clerkUserId in Checkout

When creating a Stripe checkout session, **you must include the user's Clerk ID** in metadata:

```typescript
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  metadata: {
    clerkUserId: userId, // ⭐ REQUIRED for webhook to work
  },
  line_items: [
    {
      price: 'price_...', // Your price ID
      quantity: 1,
    },
  ],
  mode: 'subscription', // or 'payment'
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
});
```

## Troubleshooting

### Webhook not receiving events:
- Check that STRIPE_WEBHOOK_SECRET is set correctly
- Verify endpoint URL in Stripe dashboard
- Check that selected events match what webhook handles
- Look for errors in Stripe dashboard webhook logs

### Database not updating:
- Check server logs for errors
- Verify clerkUserId is in checkout session metadata
- Ensure database schema matches expected fields
- Check database permissions

### Local testing not working:
- Ensure Stripe CLI is running with `stripe listen`
- Check that forwarding URL matches your local server
- Verify .env.local has the webhook secret from CLI output

## Monitored Events

The webhook handles these Stripe events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates subscription and payment records |
| `customer.subscription.created` | Creates new subscription |
| `customer.subscription.updated` | Updates subscription details |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `payment_intent.succeeded` | Records successful payment |
| `payment_intent.payment_failed` | Records failed payment |

## Security Notes

- ✅ Webhook signature is verified before processing
- ✅ Events are idempotent (safe to receive multiple times)
- ✅ Sensitive data is not logged
- ⚠️ Never commit webhook secrets to version control
- ⚠️ Use different webhook secrets for dev/prod

## Next Steps

After setting up webhooks:

1. Test with Stripe test cards
2. Verify subscription creation in database
3. Check that "days left" calculation works correctly
4. Test subscription updates and cancellations
5. Set up monitoring for webhook failures
