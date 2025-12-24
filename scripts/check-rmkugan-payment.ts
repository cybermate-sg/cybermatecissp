import 'dotenv/config';
import { db } from '../src/lib/db';
import { subscriptions, payments, users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkUser() {
  try {
    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'rmkugan@gmail.com'),
    });

    if (!user) {
      console.log('❌ User not found with email: rmkugan@gmail.com');
      return;
    }

    console.log('✅ User found:', user.clerkUserId);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);

    // Get subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, user.clerkUserId),
    });

    console.log('\n📋 Subscription:');
    console.log('   Plan Type:', subscription?.planType);
    console.log('   Status:', subscription?.status);
    console.log('   Stripe Customer ID:', subscription?.stripeCustomerId);
    console.log('   Stripe Subscription ID:', subscription?.stripeSubscriptionId);
    console.log('   Created At:', subscription?.createdAt);
    console.log('   Updated At:', subscription?.updatedAt);

    // Get payments
    const userPayments = await db.query.payments.findMany({
      where: eq(payments.clerkUserId, user.clerkUserId),
    });

    console.log('\n💳 Payments:');
    if (userPayments.length === 0) {
      console.log('   No payments found');
    } else {
      userPayments.forEach((payment, index) => {
        console.log(`\n   Payment #${index + 1}:`);
        console.log('   - Payment Intent ID:', payment.stripePaymentIntentId);
        console.log('   - Amount:', (payment.amount / 100).toFixed(2), payment.currency.toUpperCase());
        console.log('   - Status:', payment.status);
        console.log('   - Payment Method:', payment.paymentMethod);
        console.log('   - Created At:', payment.createdAt);
      });
    }

    console.log('\n🔍 Environment Variables:');
    console.log('   STRIPE_LIFETIME_PRICE_ID:', process.env.STRIPE_LIFETIME_PRICE_ID);
    console.log('   NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUser();
