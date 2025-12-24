# Webhook Bug Report: `plan_type: 'free'` for Paid Users

**Date**: 2025-12-24
**Reporter**: User noticed rmkugan@gmail.com has `plan_type: 'free'` despite being paid user in Stripe
**Severity**: CRITICAL - Paid users not getting access

---

## Executive Summary

**The Question**: Is `plan_type: 'free'` coming from Stripe or from code?

**The Answer**: It's coming from **code** (initial user signup), but it **should** be updated to `'lifetime'` by the Stripe webhook. The webhook is **failing** due to misconfigured URL.

---

## Investigation Results

### 1. Database Analysis
- ✅ User exists: `user_34pLLWdZqlsE1iZ1sjtjwdvmGCj`
- ✅ Email: `rmkugan@gmail.com`
- ❌ Subscription: `plan_type: 'free'`, `status: 'active'`
- ❌ Stripe Customer ID: `null`
- ❌ Payments table: **0 records** for this user

### 2. Stripe Analysis
- ✅ Payment succeeded: $60.00 AUD
- ✅ Payment Intent: `pi_3ShqflIrWKHinSAD05pQ92xy`
- ✅ Checkout Session: `cs_test_a1rSGvNJiNTGQnJ6Uk8K8lcZIi7KBTLjpDZjiYAqS78ph6Y1fxGG6VFVIh`
- ✅ Payment Date: 2025-12-24 11:56:10 UTC
- ✅ Price ID: `price_1SM2CMIrWKHinSADTAR6nyIF` (MATCHES lifetime price)
- ✅ User metadata: All correct (userId, email, name)
- ✅ 14 webhook events exist in Stripe

### 3. Webhook Configuration Analysis
**FOUND THE BUG!**

Current webhook configuration in Stripe:
```
Webhook ID: we_1SQ4eOIrWKHinSADSPfinz3l
URL: https://cisspmastery.vercel.app/           ← ❌ WRONG!
Events: payment_intent.succeeded                 ← ❌ INCOMPLETE!
Status: enabled
```

Correct configuration should be:
```
URL: https://cisspmastery.vercel.app/api/webhooks/stripe  ← ✅ CORRECT
Events: checkout.session.completed,
        payment_intent.succeeded,
        payment_intent.payment_failed,
        customer.subscription.created,
        customer.subscription.updated,
        customer.subscription.deleted              ← ✅ COMPLETE
```

---

## Root Cause

The Stripe webhook URL is pointing to the **root domain** instead of the **API webhook endpoint**:

- ❌ Current: `https://cisspmastery.vercel.app/`
  This is your homepage, not the webhook handler!

- ✅ Should be: `https://cisspmastery.vercel.app/api/webhooks/stripe`
  This is the actual webhook handler in your code

**Impact**:
1. User pays successfully in Stripe ✅
2. Stripe sends webhook to `https://cisspmastery.vercel.app/` ❌
3. Your homepage receives the webhook (not the handler) ❌
4. Webhook is never processed ❌
5. Payment is never recorded in database ❌
6. Subscription is never updated to `'lifetime'` ❌
7. User stays on `plan_type: 'free'` despite paying ❌

---

## Code Flow (What Should Happen)

### 1. User Signs Up
**File**: [src/app/api/webhooks/clerk/route.ts:72-76](src/app/api/webhooks/clerk/route.ts#L72-L76)
```typescript
await db.insert(subscriptions).values({
  clerkUserId: id,
  planType: 'free',  // ← Initial state
  status: 'active',
});
```

### 2. User Makes Payment
**File**: [src/app/api/checkout/route.ts:84-110](src/app/api/checkout/route.ts#L84-L110)
```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  metadata: {
    userId: userId,
    userEmail: customerEmail,
  },
  payment_intent_data: {
    metadata: {
      clerkUserId: userId,
      priceId: priceId,  // ← This is the key!
    },
  },
});
```

### 3. Stripe Webhook Fires
**File**: [src/app/api/webhooks/stripe/route.ts:55-64](src/app/api/webhooks/stripe/route.ts#L55-L64)
```typescript
case 'checkout.session.completed': {
  const session = event.data.object;
  const sessionWithLineItems = await getStripe().checkout.sessions.retrieve(
    session.id,
    { expand: ['line_items', 'line_items.data.price'] }
  );
  await handleCheckoutCompleted(sessionWithLineItems);
  break;
}
```

### 4. Payment Processed
**File**: [src/app/api/webhooks/stripe/route.ts:354-359](src/app/api/webhooks/stripe/route.ts#L354-L359)
```typescript
// If this is a lifetime purchase, update the user's subscription
const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID;
if (priceId === lifetimePriceId || priceId === process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID) {
  console.log('🔥 Lifetime purchase detected, updating subscription...');
  await updateSubscriptionForLifetimePurchase(userId, stripeCustomerId);
}
```

### 5. Subscription Updated (Should Happen)
**File**: [src/app/api/webhooks/stripe/route.ts:256-303](src/app/api/webhooks/stripe/route.ts#L256-L303)
```typescript
async function updateSubscriptionForLifetimePurchase(clerkUserId, stripeCustomerId) {
  await db.update(subscriptions).set({
    planType: 'lifetime',  // ← This should happen!
    status: 'active',
  }).where(eq(subscriptions.clerkUserId, clerkUserId));
}
```

---

## Fix Steps

### 1. Update Webhook URL (URGENT)
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find webhook: `we_1SQ4eOIrWKHinSADSPfinz3l`
3. Edit endpoint URL:
   - From: `https://cisspmastery.vercel.app/`
   - To: `https://cisspmastery.vercel.app/api/webhooks/stripe`
4. Add missing events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Save and copy signing secret
6. Update Vercel env var: `STRIPE_WEBHOOK_SECRET`
7. Redeploy app

### 2. Fix Existing User (IMMEDIATE)
Run this script to manually fix rmkugan@gmail.com:
```bash
npx tsx scripts/fix-rmkugan-subscription.ts
```

This will:
- Insert missing payment record
- Update subscription to `plan_type: 'lifetime'`

### 3. Test Webhook
```bash
# Terminal 1: Local development
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Test payment
stripe trigger checkout.session.completed
```

### 4. Monitor Production
After fixing webhook URL, monitor Vercel logs:
```bash
vercel logs --follow
```

Look for:
```
✅ Checkout session completed
🔥 Lifetime purchase detected
✅ Updated subscription to lifetime
```

---

## Prevention

### Code Improvements Made
Added detailed logging to help debug future issues:
- [src/app/api/webhooks/stripe/route.ts:151-157](src/app/api/webhooks/stripe/route.ts#L151-L157) - Log price ID comparison
- [src/app/api/webhooks/stripe/route.ts:366-370](src/app/api/webhooks/stripe/route.ts#L366-L370) - Log lifetime purchase check
- [src/app/api/webhooks/stripe/route.ts:378-379](src/app/api/webhooks/stripe/route.ts#L378-L379) - Warning when price ID doesn't match

### Testing Scripts Created
- `scripts/check-rmkugan-payment.ts` - Check user payment status
- `scripts/investigate-rmkugan-payment.ts` - Investigate Stripe records
- `scripts/check-specific-events.ts` - Analyze webhook events
- `scripts/check-webhook-config.ts` - Verify webhook configuration
- `scripts/fix-rmkugan-subscription.ts` - Fix user subscription
- `scripts/test-stripe-webhook.md` - Webhook testing guide
- `scripts/FIX-WEBHOOK-CONFIG.md` - Step-by-step fix guide

---

## Impact Assessment

### Users Affected
All users who paid between **2025-11-05** (webhook created) and **now** (when bug is fixed).

To find affected users:
```typescript
// Users with payments in Stripe but plan_type: 'free' in database
// Run: scripts/find-affected-users.ts
```

### Financial Impact
- Users paid but didn't get access
- Potential refund requests
- Loss of trust

### Immediate Actions Required
1. ✅ Fix webhook URL in Stripe (5 minutes)
2. ✅ Fix rmkugan@gmail.com subscription (1 minute)
3. ⏳ Identify other affected users (script needed)
4. ⏳ Fix all affected users' subscriptions
5. ⏳ Send apology emails with access confirmation

---

## Technical Details

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  ← Must match Stripe Dashboard
STRIPE_LIFETIME_PRICE_ID=price_1SM2CMIrWKHinSADTAR6nyIF
NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID=price_1SM2CMIrWKHinSADTAR6nyIF
```

### Database Schema
```typescript
subscriptions {
  planType: 'free' | 'pro_monthly' | 'pro_yearly' | 'lifetime'
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'
}
```

### Webhook Events Flow
```
Stripe → webhook endpoint → API handler → Database update
  ✅         ❌ BROKEN        ✅              ❌ SKIPPED
```

---

## Conclusion

**The `plan_type: 'free'` is coming from CODE** (initial signup), but **should be updated to `'lifetime'` by the Stripe webhook**.

**The webhook is FAILING** because the URL is misconfigured, preventing paid users from getting access.

**The fix is simple**: Update the webhook URL from `https://cisspmastery.vercel.app/` to `https://cisspmastery.vercel.app/api/webhooks/stripe`.
