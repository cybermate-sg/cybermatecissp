# Testing Stripe Webhook Locally & in Production

## Prerequisites
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe: `stripe login`

## Method 1: Test Locally (Recommended for Development)

### Step 1: Start Your Development Server
```bash
npm run dev
```

### Step 2: Forward Webhooks to Local Server
```bash
# This will give you a webhook signing secret (whsec_...)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**IMPORTANT**: Copy the webhook signing secret and update your `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 3: Trigger a Test Payment
```bash
# Create a test checkout session for lifetime access
stripe trigger checkout.session.completed \
  --add checkout_session:mode=payment \
  --add checkout_session:payment_intent=pi_test_123 \
  --add checkout_session:metadata[userId]=user_34pLLWdZqlsE1iZ1sjtjwdvmGCj \
  --add checkout_session:customer_email=rmkugan@gmail.com
```

### Step 4: Watch the Logs
Your terminal running `stripe listen` will show:
- ✅ Event received
- ✅ Forwarded to localhost:3000/api/webhooks/stripe
- ✅ Response: 200 OK (success) or 400/500 (error)

Your terminal running `npm run dev` will show the console.log output from the webhook handler.

---

## Method 2: Test in Production (Vercel)

### Step 1: Configure Webhook in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add it to Vercel environment variables:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxxxxxxxxxx`
   - Redeploy your app

### Step 2: Send Test Events from Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Click "Send test webhook"

### Step 3: Check Vercel Logs
```bash
# Install Vercel CLI
npm install -g vercel

# View real-time logs
vercel logs --follow

# Or check in Vercel Dashboard → Logs
```

---

## Method 3: Manually Trigger a Real Test Purchase

### Step 1: Create a Test Product in Stripe
1. Go to: https://dashboard.stripe.com/test/products
2. Create a product (if not exists): "CISSP Mastery Lifetime Access"
3. Add a price: $1.00 (for testing)
4. Copy the Price ID (e.g., `price_1SM2CMIrWKHinSADTAR6nyIF`)

### Step 2: Update Environment Variables
Make sure your `.env.local` and Vercel have:
```
STRIPE_LIFETIME_PRICE_ID=price_1SM2CMIrWKHinSADTAR6nyIF
NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID=price_1SM2CMIrWKHinSADTAR6nyIF
```

### Step 3: Make a Test Purchase
1. Go to your app: http://localhost:3000 (or your Vercel URL)
2. Sign in as a test user
3. Navigate to checkout with: `?priceId=price_1SM2CMIrWKHinSADTAR6nyIF`
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
5. Complete the payment

### Step 4: Verify in Logs
Check your console logs (local) or Vercel logs (production) for:
- ✅ `Checkout session completed: cs_xxx`
- ✅ `🔍 One-time payment detected`
- ✅ `Price ID from line_items: price_1SM2CMIrWKHinSADTAR6nyIF`
- ✅ `🔥 Lifetime purchase detected`
- ✅ `✅ Updated subscription to lifetime`

---

## Debugging Common Issues

### Issue 1: "Webhook signature verification failed"
**Solution**: Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard

### Issue 2: "No clerkUserId found"
**Solution**: Make sure the checkout session includes `metadata.userId` or `client_reference_id`

### Issue 3: "Price ID does not match"
**Solution**:
- Check the price ID in Stripe Dashboard
- Make sure `STRIPE_LIFETIME_PRICE_ID` matches exactly
- Check logs to see what price ID was received vs expected

### Issue 4: "Payment recorded but subscription not updated"
**Solution**:
- Check if the price ID comparison is working
- Look for the log: `🔥 Lifetime purchase detected`
- If missing, the price IDs don't match

### Issue 5: "No payments found in database"
**Solution**:
- Webhook never fired or failed
- Check Stripe Dashboard → Webhooks → Recent events
- Look for failed deliveries (HTTP 400/500 errors)

---

## Expected Log Output (Success)

```
Checkout session completed: cs_test_xxxxx
🔍 One-time payment detected:
   - Clerk User ID: user_34pLLWdZqlsE1iZ1sjtjwdvmGCj
   - Customer Email: rmkugan@gmail.com
   - Price ID from line_items: price_1SM2CMIrWKHinSADTAR6nyIF
   - Expected STRIPE_LIFETIME_PRICE_ID: price_1SM2CMIrWKHinSADTAR6nyIF
   - Expected NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID: price_1SM2CMIrWKHinSADTAR6nyIF
   - Price ID matches: true
✅ Payment recorded in database: pi_test_xxxxx
🔍 Checking if this is a lifetime purchase:
   - Price ID received: price_1SM2CMIrWKHinSADTAR6nyIF
   - STRIPE_LIFETIME_PRICE_ID: price_1SM2CMIrWKHinSADTAR6nyIF
   - NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID: price_1SM2CMIrWKHinSADTAR6nyIF
   - Match result: true
🔥 Lifetime purchase detected, updating subscription...
   - User ID: user_34pLLWdZqlsE1iZ1sjtjwdvmGCj
   - Stripe Customer ID: cus_xxxxx
✅ Updated subscription to lifetime for user: user_34pLLWdZqlsE1iZ1sjtjwdvmGCj
Payment succeeded: pi_test_xxxxx
✅ Payment success email sent to: rmkugan@gmail.com
✅ Successfully processed webhook: checkout.session.completed
```
