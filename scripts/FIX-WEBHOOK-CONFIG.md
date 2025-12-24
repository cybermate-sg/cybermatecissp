# 🔧 FIX STRIPE WEBHOOK CONFIGURATION

## THE PROBLEM
Your Stripe webhook is pointing to the **wrong URL**:
- ❌ Current: `https://cisspmastery.vercel.app/`
- ✅ Should be: `https://cisspmastery.vercel.app/api/webhooks/stripe`

This is why the user paid but their subscription wasn't updated!

---

## STEP 1: Update Webhook URL in Stripe Dashboard

### Option A: Update Existing Webhook (Recommended)
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find webhook ID: `we_1SQ4eOIrWKHinSADSPfinz3l`
3. Click on it
4. Click "..." menu → Edit endpoint
5. Change URL from:
   ```
   https://cisspmastery.vercel.app/
   ```
   Or:
   ```
   https://cybermateconsulting.com/
   ```
   To:
   ```
   https://cybermateconsulting.com/api/webhooks/stripe
   ```
   (Use whichever domain your production app is actually using)
6. Update "Events to send" to include:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
7. Click "Update endpoint"
8. Copy the "Signing secret" (starts with `whsec_`)

### Option B: Create New Webhook
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://cybermateconsulting.com/api/webhooks/stripe`
   (Or use your production domain: `https://cisspmastery.vercel.app/api/webhooks/stripe`)
4. Select events (see list above)
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Delete the old webhook (`we_1SQ4eOIrWKHinSADSPfinz3l`)

---

## STEP 2: Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings → Environment Variables
4. Find or add: `STRIPE_WEBHOOK_SECRET`
5. Set value to the signing secret from Step 1 (starts with `whsec_`)
6. Make sure it's enabled for: Production, Preview, Development
7. Click "Save"

**IMPORTANT**: After updating environment variables, you MUST redeploy:
```bash
# Option 1: Trigger new deployment via Git
git commit --allow-empty -m "Update webhook config"
git push

# Option 2: Redeploy from Vercel Dashboard
# Go to Deployments → Click "..." on latest → Redeploy
```

---

## STEP 3: Also Check LIVE Mode (If Using Production Payments)

If you're using Stripe **LIVE mode** (real payments, not test):

1. Go to: https://dashboard.stripe.com/webhooks (notice: no "test" in URL)
2. Repeat Step 1 above for LIVE mode
3. Copy the **LIVE mode** signing secret
4. Update Vercel with the LIVE mode secret
5. Redeploy

---

## STEP 4: Test the Webhook

### Test Locally:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger test event
stripe trigger checkout.session.completed
```

### Test in Production:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook
3. Click "Send test webhook"
4. Select "checkout.session.completed"
5. Click "Send test webhook"
6. Check Vercel logs: `vercel logs --follow`

---

## STEP 5: Fix the Existing User

Since the user already paid but webhook failed, you need to manually update their subscription:

```bash
# Run this script to fix the user's subscription
npx tsx scripts/fix-rmkugan-subscription.ts
```

Or manually in the database:
```sql
UPDATE subscriptions
SET plan_type = 'lifetime',
    status = 'active',
    updated_at = NOW()
WHERE clerk_user_id = 'user_34pLLWdZqlsE1iZ1sjtjwdvmGCj';
```

Also insert the missing payment record:
```sql
INSERT INTO payments (
  clerk_user_id,
  stripe_payment_intent_id,
  amount,
  currency,
  status,
  payment_method,
  created_at
) VALUES (
  'user_34pLLWdZqlsE1iZ1sjtjwdvmGCj',
  'pi_3ShqflIrWKHinSAD05pQ92xy',
  6000,  -- $60.00 in cents
  'aud',
  'succeeded',
  'card',
  '2025-12-24 11:56:10'
);
```

---

## STEP 6: Verify Fix

After fixing the webhook:

1. Make a new test payment with a different test user
2. Watch Vercel logs for:
   ```
   ✅ Checkout session completed
   🔍 One-time payment detected
   🔥 Lifetime purchase detected
   ✅ Updated subscription to lifetime
   ```
3. Check database to confirm:
   - Payment recorded in `payments` table
   - Subscription updated to `plan_type: 'lifetime'`

---

## Summary

**The Bug**: Webhook URL was `https://cisspmastery.vercel.app/` instead of `https://cisspmastery.vercel.app/api/webhooks/stripe`

**The Fix**:
1. ✅ Update webhook URL in Stripe Dashboard
2. ✅ Add all required events
3. ✅ Update `STRIPE_WEBHOOK_SECRET` in Vercel
4. ✅ Redeploy application
5. ✅ Manually fix existing user's subscription
6. ✅ Test with new payment

**Answer to Your Question**:
The `plan_type: "free"` is coming from **your code** (when user signs up), but it should have been updated to `"lifetime"` by the Stripe webhook. The webhook never processed because the URL was wrong.
