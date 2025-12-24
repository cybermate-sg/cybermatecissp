import { db } from '../src/lib/db';
import { users, subscriptions, payments } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const emailToCheck = 'rajaimadhavan@gmail.com';

async function checkUserSubscription() {
  try {
    console.log(`\n🔍 Checking subscription for: ${emailToCheck}\n`);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, emailToCheck),
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:');
    console.log(`  Clerk ID: ${user.clerkUserId}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Created: ${user.createdAt}`);

    // Check subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clerkUserId, user.clerkUserId),
    });

    console.log('\n📊 Subscription:');
    if (!subscription) {
      console.log('  ❌ No subscription record found');
    } else {
      console.log(`  Plan Type: ${subscription.planType}`);
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Stripe Customer ID: ${subscription.stripeCustomerId || 'N/A'}`);
      console.log(`  Stripe Subscription ID: ${subscription.stripeSubscriptionId || 'N/A'}`);
      console.log(`  Current Period Start: ${subscription.currentPeriodStart || 'N/A'}`);
      console.log(`  Current Period End: ${subscription.currentPeriodEnd || 'N/A'}`);
      console.log(`  Created: ${subscription.createdAt}`);
      console.log(`  Updated: ${subscription.updatedAt}`);

      // Check if has paid access
      const hasPaidAccess =
        subscription.planType === 'lifetime' ||
        (subscription.planType === 'pro_monthly' && subscription.status === 'active') ||
        (subscription.planType === 'pro_yearly' && subscription.status === 'active');

      console.log(`\n  Has Paid Access: ${hasPaidAccess ? '✅ YES' : '❌ NO'}`);
    }

    // Check payments
    const userPayments = await db.query.payments.findMany({
      where: eq(payments.clerkUserId, user.clerkUserId),
    });

    console.log(`\n💳 Payments (${userPayments.length} total):`);
    userPayments.forEach((payment, index) => {
      console.log(`\n  Payment ${index + 1}:`);
      console.log(`    Amount: ${payment.currency.toUpperCase()} ${(payment.amount / 100).toFixed(2)}`);
      console.log(`    Status: ${payment.status}`);
      console.log(`    Payment Method: ${payment.paymentMethod}`);
      console.log(`    Stripe Payment Intent: ${payment.stripePaymentIntentId}`);
      console.log(`    Date: ${payment.createdAt}`);
    });

    console.log('\n✅ Check complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUserSubscription();
