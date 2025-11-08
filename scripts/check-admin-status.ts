import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';

async function checkAdminStatus() {
  console.log('Checking admin status...\n');

  try {
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
      console.log('Please sign up first at http://localhost:3000/sign-up');
      return;
    }

    console.log('Users in database:');
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Clerk ID: ${user.clerkUserId}`);
      console.log(`   Status: ${user.role === 'admin' ? '✅ ADMIN' : '⚠️ NOT ADMIN'}`);
    });

    const adminUsers = allUsers.filter(u => u.role === 'admin');
    console.log(`\n\nSummary: ${adminUsers.length} admin(s) out of ${allUsers.length} total user(s)`);

    if (adminUsers.length === 0) {
      console.log('\n⚠️  WARNING: No admin users found!');
      console.log('To fix this, run: npm run make-admin <email>');
    }

  } catch (error) {
    console.error('Error checking admin status:', error);
  }

  process.exit(0);
}

checkAdminStatus();
