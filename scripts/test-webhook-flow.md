# Testing Stripe Webhook Fix

## Issue Summary
When Rajai completed a $60 AUD lifetime payment:
- ✅ Payment recorded in Stripe
- ✅ Payment recorded in `payments` table
- ❌ Subscription NOT updated with `stripe_customer_id`
- ❌ Subscription NOT changed to `plan_type: lifetime`

## Root Cause
1. Checkout creates one-time payment (`mode: "payment"`) not subscription
2. Webhook only recorded payment in `payments` table
3. Webhook never updated `subscriptions` table for lifetime purchases
4. User stayed on "free" plan with no Stripe customer linkage

## What Was Fixed

### 1. Updated Webhook Handler
**File**: `src/app/api/webhooks/stripe/route.ts`

**Changes**:
- Added `updateSubscriptionForLifetimePurchase()` function
- Modified `handlePaymentSucceeded()` to accept `stripeCustomerId` and `priceId`
- Added logic to detect lifetime price and update subscription
- Expanded checkout session to include line items

**New Flow**:
```
1. Customer completes checkout
2. Stripe sends checkout.session.completed webhook
3. Webhook fetches session with line_items expanded
4. Checks if price matches STRIPE_LIFETIME_PRICE_ID
5. If yes → Updates subscription to "lifetime" + adds stripe_customer_id
6. Records payment in payments table
7. Sends confirmation email
```

## Fix Rajai's Existing Subscription

### Option 1: Via Script (Recommended)
```bash
# 1. Get Rajai's Stripe customer ID from Stripe Dashboard
# Go to: https://dashboard.stripe.com/customers
# Search for: rajaimadhavan@gmail.com
# Copy the customer ID (starts with "cus_")

# 2. Update the script with the customer ID
# Edit: scripts/fix-rajai-subscription.ts
# Line 10: const stripeCustomerId = 'cus_XXXXX'; // Replace XXXXX

# 3. Run the script
npx tsx scripts/fix-rajai-subscription.ts
```

### Option 2: Via SQL
```sql
UPDATE subscriptions
SET
  stripe_customer_id = 'cus_XXXXX', -- Get from Stripe dashboard
  plan_type = 'lifetime',
  status = 'active',
  updated_at = NOW()
WHERE clerk_user_id = 'user_34pLLWdZqIsE1iZ1sjtjwdvmGCj';
```

## Testing the Fix for Future Customers

### 1. Test with Stripe CLI
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test checkout
stripe trigger checkout.session.completed
```

### 2. Test with Real Payment (Test Mode)
1. Go to your app in development
2. Click "Purchase Lifetime Access"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check logs for: `🔥 Lifetime purchase detected, updating subscription...`
6. Verify database:
   ```sql
   SELECT
     clerk_user_id,
     stripe_customer_id,
     plan_type,
     status
   FROM subscriptions
   WHERE clerk_user_id = 'YOUR_TEST_USER_ID';
   ```

### 3. Expected Logs
```
Checkout session completed: cs_test_XXXXX
🔥 Lifetime purchase detected, updating subscription...
✅ Updated subscription to lifetime for user: user_XXXXX
✅ Payment recorded in database: pi_XXXXX
✅ Payment success email sent to: user@example.com
✅ Successfully processed webhook: checkout.session.completed
```

## Verify Webhook Configuration

### In Stripe Dashboard
1. Go to: Developers → Webhooks
2. Check endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Ensure these events are enabled:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

### In Your .env.local
```bash
# Verify these are set:
STRIPE_LIFETIME_PRICE_ID=price_1SM2CMIrWKHinSADTAR6nyIF ✅
NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID=price_1SM2CMIrWKHinSADTAR6nyIF ✅
STRIPE_WEBHOOK_SECRET=whsec_68027028aa3dd752ecf73e426f3fa43f1576801e97d9e8eaf049e81234fc043c ✅
```

## Common Issues

### Issue: Webhook not firing
**Solution**:
- Check Stripe Dashboard → Webhooks → View logs
- Ensure endpoint URL is correct
- Verify webhook secret matches

### Issue: "No clerkUserId found"
**Solution**:
- Ensure checkout session includes metadata
- Check `client_reference_id` is set to userId

### Issue: Subscription not updated
**Solution**:
- Check price ID matches exactly
- Verify logs show "🔥 Lifetime purchase detected"
- Check database permissions

## Next Steps
1. Get Rajai's Stripe customer ID
2. Run the fix script
3. Test with a new user to verify webhook works
4. Monitor logs for any errors
