# How to Check Vercel Webhook Logs

## Method 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Logs" tab
4. Filter by:
   - Function: `/api/webhooks/stripe`
   - Time range: Last 24 hours
5. Look for errors or webhook events

## Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# View real-time logs
vercel logs --follow

# View logs for specific function
vercel logs --filter="api/webhooks/stripe"
```

## Method 3: Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Check "Recent events" tab
4. Look for:
   - ✅ **Succeeded**: Webhook was delivered successfully
   - ❌ **Failed**: Webhook delivery failed (check error message)
   - ⏱️ **Pending**: Webhook is being retried

## What to Look For

### In Vercel Logs:
- `Checkout session completed: cs_xxx` - Session received
- `🔥 Lifetime purchase detected` - Price ID matched
- `✅ Updated subscription to lifetime` - Subscription updated
- `❌ Failed to record payment` - Database error
- `No clerkUserId found` - Missing user ID

### In Stripe Webhook Events:
- HTTP 200: Success
- HTTP 400: Bad request (signature verification failed)
- HTTP 500: Server error (code threw an exception)
