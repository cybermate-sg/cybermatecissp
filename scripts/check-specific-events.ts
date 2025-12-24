import 'dotenv/config';
import Stripe from 'stripe';

/**
 * Check specific webhook events to see what happened
 */

async function checkEvents() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
  });

  // Most recent checkout session from the investigation
  const eventIds = [
    'evt_1ShqfmIrWKHinSADCnIjXlzT', // Most recent checkout.session.completed
    'evt_3ShqflIrWKHinSAD0Y1WLRWF', // Most recent payment_intent.succeeded
  ];

  for (const eventId of eventIds) {
    console.log('='.repeat(80));
    console.log(`🔍 Checking event: ${eventId}`);
    console.log('='.repeat(80));

    try {
      const event = await stripe.events.retrieve(eventId);
      console.log('Event Type:', event.type);
      console.log('Created:', new Date(event.created * 1000).toISOString());
      console.log('Livemode:', event.livemode);
      console.log('');

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout Session Details:');
        console.log('- Session ID:', session.id);
        console.log('- Mode:', session.mode);
        console.log('- Status:', session.status);
        console.log('- Payment Status:', session.payment_status);
        console.log('- Customer Email:', session.customer_email);
        console.log('- Customer:', session.customer);
        console.log('- Payment Intent:', session.payment_intent);
        console.log('- Client Reference ID:', session.client_reference_id);
        console.log('- Metadata:', session.metadata);
        console.log('');

        // Get full session with line items
        console.log('Fetching full session with line items...');
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'line_items.data.price', 'payment_intent'],
        });

        console.log('');
        console.log('Line Items:');
        if (fullSession.line_items?.data) {
          fullSession.line_items.data.forEach((item, idx) => {
            const price = item.price as Stripe.Price | null;
            console.log(`  Item ${idx + 1}:`);
            console.log('  - Price ID:', price?.id);
            console.log('  - Amount:', price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A', price?.currency);
            console.log('  - Product:', price?.product);
            console.log('  - Quantity:', item.quantity);
          });
        } else {
          console.log('  No line items found');
        }

        console.log('');
        console.log('Payment Intent Details:');
        const pi = fullSession.payment_intent as Stripe.PaymentIntent | null;
        if (pi) {
          console.log('- Payment Intent ID:', pi.id);
          console.log('- Amount:', (pi.amount / 100).toFixed(2), pi.currency);
          console.log('- Status:', pi.status);
          console.log('- Metadata:', pi.metadata);
        }

        console.log('');
        console.log('🔍 WEBHOOK PROCESSING ANALYSIS:');
        console.log('');
        console.log('What the webhook should have done:');
        console.log('1. Extract clerkUserId from:');
        console.log('   - session.metadata.userId:', session.metadata?.userId || '❌ NOT FOUND');
        console.log('   - session.client_reference_id:', session.client_reference_id || '❌ NOT FOUND');
        console.log('');
        console.log('2. Extract customerEmail from:');
        console.log('   - session.customer_email:', session.customer_email || '❌ NOT FOUND');
        console.log('   - session.customer_details.email:', (session as any).customer_details?.email || '❌ NOT FOUND');
        console.log('');
        console.log('3. Check if one-time payment:');
        console.log('   - session.mode === "payment":', session.mode === 'payment');
        console.log('   - session.payment_intent exists:', !!session.payment_intent);
        console.log('');
        console.log('4. Extract price ID from line items:');
        const priceId = fullSession.line_items?.data[0]?.price?.id;
        console.log('   - Price ID:', priceId || '❌ NOT FOUND');
        console.log('   - Expected (STRIPE_LIFETIME_PRICE_ID):', process.env.STRIPE_LIFETIME_PRICE_ID);
        console.log('   - Match:', priceId === process.env.STRIPE_LIFETIME_PRICE_ID);
        console.log('');
        console.log('5. Expected outcome:');
        if (session.metadata?.userId || session.client_reference_id) {
          console.log('   ✅ Should record payment in database');
          if (priceId === process.env.STRIPE_LIFETIME_PRICE_ID) {
            console.log('   ✅ Should update subscription to "lifetime"');
          } else {
            console.log('   ❌ Should NOT update subscription (price ID mismatch)');
          }
        } else {
          console.log('   ❌ CRITICAL: No clerkUserId found - payment would be orphaned!');
        }

      } else if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log('Payment Intent Details:');
        console.log('- Payment Intent ID:', pi.id);
        console.log('- Amount:', (pi.amount / 100).toFixed(2), pi.currency);
        console.log('- Status:', pi.status);
        console.log('- Customer:', pi.customer);
        console.log('- Receipt Email:', pi.receipt_email);
        console.log('- Metadata:', pi.metadata);
        console.log('');
        console.log('🔍 WEBHOOK PROCESSING ANALYSIS:');
        console.log('');
        console.log('What the webhook should have done:');
        console.log('1. Extract clerkUserId from metadata:', pi.metadata?.clerkUserId || '❌ NOT FOUND');
        console.log('2. Extract userEmail from:', pi.metadata?.userEmail || pi.receipt_email || '❌ NOT FOUND');
        console.log('3. Extract priceId from metadata:', pi.metadata?.priceId || '❌ NOT FOUND');
        console.log('4. sendEmail should be FALSE (already sent by checkout.session.completed)');
      }

      console.log('');
    } catch (error) {
      console.error('❌ Error retrieving event:', error);
    }
  }
}

checkEvents();
