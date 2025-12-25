import 'dotenv/config';
import Stripe from 'stripe';

/**
 * Script to investigate rmkugan@gmail.com payment in Stripe
 * This will check Stripe's records to see if the payment actually exists
 */

async function investigatePayment() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
  });

  const userEmail = 'rmkugan@gmail.com';
  const clerkUserId = 'user_34pLLWdZqlsE1iZ1sjtjwdvmGCj';

  console.log('🔍 Investigating Stripe records for:', userEmail);
  console.log('   Clerk User ID:', clerkUserId);
  console.log('');

  try {
    // 1. Search for customers by email
    console.log('1️⃣ Searching for Stripe customers...');
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 10,
    });

    if (customers.data.length === 0) {
      console.log('   ❌ No Stripe customer found with this email');
      console.log('   💡 This means the user never completed checkout or payment failed');
    } else {
      console.log(`   ✅ Found ${customers.data.length} customer(s):`);
      customers.data.forEach((customer, index) => {
        console.log(`\n   Customer #${index + 1}:`);
        console.log('   - Customer ID:', customer.id);
        console.log('   - Email:', customer.email);
        console.log('   - Created:', new Date(customer.created * 1000).toISOString());
        console.log('   - Metadata:', customer.metadata);
      });

      // 2. For each customer, get their payment intents
      for (const customer of customers.data) {
        console.log(`\n2️⃣ Checking payment intents for customer: ${customer.id}`);
        const paymentIntents = await stripe.paymentIntents.list({
          customer: customer.id,
          limit: 10,
        });

        if (paymentIntents.data.length === 0) {
          console.log('   ❌ No payment intents found');
        } else {
          console.log(`   ✅ Found ${paymentIntents.data.length} payment intent(s):`);
          paymentIntents.data.forEach((pi, index) => {
            console.log(`\n   Payment Intent #${index + 1}:`);
            console.log('   - ID:', pi.id);
            console.log('   - Amount:', (pi.amount / 100).toFixed(2), pi.currency.toUpperCase());
            console.log('   - Status:', pi.status);
            console.log('   - Created:', new Date(pi.created * 1000).toISOString());
            console.log('   - Metadata:', pi.metadata);
          });
        }

        // 3. Get checkout sessions for this customer
        console.log(`\n3️⃣ Checking checkout sessions for customer: ${customer.id}`);
        const sessions = await stripe.checkout.sessions.list({
          customer: customer.id,
          limit: 10,
        });

        if (sessions.data.length === 0) {
          console.log('   ❌ No checkout sessions found');
        } else {
          console.log(`   ✅ Found ${sessions.data.length} checkout session(s):`);
          for (const session of sessions.data) {
            console.log(`\n   Checkout Session:`);
            console.log('   - ID:', session.id);
            console.log('   - Mode:', session.mode);
            console.log('   - Status:', session.status);
            console.log('   - Payment Status:', session.payment_status);
            console.log('   - Amount Total:', session.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A');
            console.log('   - Created:', new Date(session.created * 1000).toISOString());
            console.log('   - Metadata:', session.metadata);
            console.log('   - Client Reference ID:', session.client_reference_id);

            // Get full session with line items
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items', 'line_items.data.price'],
            });

            if (fullSession.line_items?.data) {
              console.log('   - Line Items:');
              fullSession.line_items.data.forEach((item, idx) => {
                const price = item.price as Stripe.Price | null;
                console.log(`     Item ${idx + 1}:`);
                console.log('       - Price ID:', price?.id);
                console.log('       - Amount:', price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A');
                console.log('       - Product:', price?.product);
              });
            }
          }
        }
      }
    }

    // 4. Check webhook events related to this email
    console.log('\n4️⃣ Checking recent webhook events...');
    const events = await stripe.events.list({
      limit: 100,
      types: ['checkout.session.completed', 'payment_intent.succeeded'],
    });

    const relevantEvents = events.data.filter(event => {
      const obj = event.data.object as any;
      return obj.customer_email === userEmail ||
             obj.customer_details?.email === userEmail ||
             obj.metadata?.userEmail === userEmail ||
             obj.metadata?.userId === clerkUserId;
    });

    if (relevantEvents.length === 0) {
      console.log('   ❌ No webhook events found for this user');
      console.log('   💡 This confirms the payment was never completed or webhook never fired');
    } else {
      console.log(`   ✅ Found ${relevantEvents.length} relevant event(s):`);
      relevantEvents.forEach((event, index) => {
        console.log(`\n   Event #${index + 1}:`);
        console.log('   - Type:', event.type);
        console.log('   - ID:', event.id);
        console.log('   - Created:', new Date(event.created * 1000).toISOString());
        console.log('   - Livemode:', event.livemode);
      });
    }

  } catch (error) {
    console.error('❌ Error investigating payment:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔍 INVESTIGATION SUMMARY');
  console.log('='.repeat(80));
  console.log('\nPossible scenarios:');
  console.log('1. User never completed payment (abandoned cart)');
  console.log('2. Payment succeeded but webhook was not configured');
  console.log('3. Payment succeeded but webhook failed (check Stripe Dashboard → Webhooks)');
  console.log('4. User paid in LIVE mode but app is checking TEST mode (or vice versa)');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check Stripe mode (test vs live) - look at "Livemode" field above');
  console.log('2. If payment exists, check Stripe Dashboard → Webhooks for failed deliveries');
  console.log('3. If no payment exists, ask user to make a new test payment');
  console.log('4. Use stripe CLI to test webhook locally: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
}

investigatePayment();
