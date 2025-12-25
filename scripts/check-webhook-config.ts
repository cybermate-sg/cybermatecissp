import 'dotenv/config';
import Stripe from 'stripe';

/**
 * Check webhook configuration in Stripe
 */

async function checkWebhookConfig() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
  });

  console.log('🔍 Checking Stripe Webhook Configuration...');
  console.log('');

  try {
    // List all webhook endpoints
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

    if (webhooks.data.length === 0) {
      console.log('❌ NO WEBHOOK ENDPOINTS CONFIGURED!');
      console.log('');
      console.log('This is the problem! Stripe has no webhook endpoint configured.');
      console.log('');
      console.log('To fix:');
      console.log('1. Go to: https://dashboard.stripe.com/test/webhooks');
      console.log('2. Click "Add endpoint"');
      console.log('3. Enter URL: https://your-app.vercel.app/api/webhooks/stripe');
      console.log('4. Select events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed');
      console.log('5. Add to Vercel environment variables: STRIPE_WEBHOOK_SECRET=whsec_...');
      return;
    }

    console.log(`✅ Found ${webhooks.data.length} webhook endpoint(s):\n`);

    webhooks.data.forEach((webhook, index) => {
      console.log(`Webhook #${index + 1}:`);
      console.log('- ID:', webhook.id);
      console.log('- URL:', webhook.url);
      console.log('- Status:', webhook.status);
      console.log('- Created:', new Date(webhook.created * 1000).toISOString());
      console.log('- Enabled Events:', webhook.enabled_events.join(', '));
      console.log('- Signing Secret:', webhook.secret ? webhook.secret.substring(0, 20) + '...' : 'NOT AVAILABLE');
      console.log('');

      // Check if this endpoint is for our app
      const isOurEndpoint = webhook.url.includes('/api/webhooks/stripe');
      if (isOurEndpoint) {
        console.log('  ✅ This appears to be your application\'s webhook endpoint');

        // Check required events
        const requiredEvents = [
          'checkout.session.completed',
          'payment_intent.succeeded',
        ];

        const missingEvents = requiredEvents.filter(event => !webhook.enabled_events.includes(event));
        if (missingEvents.length > 0) {
          console.log('  ⚠️ MISSING REQUIRED EVENTS:', missingEvents.join(', '));
        } else {
          console.log('  ✅ All required events are configured');
        }

        if (webhook.status !== 'enabled') {
          console.log('  ❌ WARNING: Webhook is NOT enabled!');
        } else {
          console.log('  ✅ Webhook is enabled');
        }
      }
      console.log('');
    });

    // Now check specific event to see if webhook was attempted
    console.log('='.repeat(80));
    console.log('🔍 Checking webhook delivery for recent payment...');
    console.log('='.repeat(80));
    console.log('');

    const eventId = 'evt_1ShqfmIrWKHinSADCnIjXlzT'; // Most recent checkout.session.completed

    for (const webhook of webhooks.data) {
      if (webhook.url.includes('/api/webhooks/stripe')) {
        console.log(`Checking webhook deliveries for endpoint: ${webhook.url}`);

        // Note: Stripe API doesn't allow querying delivery attempts by event ID
        // User needs to check Stripe Dashboard manually
        console.log('');
        console.log('⚠️ To check if this webhook was delivered:');
        console.log('1. Go to: https://dashboard.stripe.com/test/webhooks/' + webhook.id);
        console.log('2. Click on "Events" tab');
        console.log('3. Search for event ID: ' + eventId);
        console.log('4. Check delivery status:');
        console.log('   - ✅ Succeeded (HTTP 200): Webhook was delivered successfully');
        console.log('   - ❌ Failed (HTTP 4xx/5xx): Check error message');
        console.log('   - ⏱️ Pending: Still being retried');
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error checking webhook configuration:', error);
  }
}

checkWebhookConfig();
