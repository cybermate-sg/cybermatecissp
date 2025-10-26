import 'dotenv/config';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create or update admin user
 * Run with: npx tsx scripts/create-admin.ts
 */

const ADMIN_USER_ID = 'user_33oqZCsrKLsESLa3hoPcJpUHEFf';
const ADMIN_EMAIL = 'admin@cisspmastery.com'; // Change this if needed

async function createAdmin() {
  console.log('🔧 Creating admin user...\n');

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, ADMIN_USER_ID),
    });

    if (existingUser) {
      console.log('User already exists. Updating role to admin...');

      const [updatedUser] = await db
        .update(users)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(users.clerkUserId, ADMIN_USER_ID))
        .returning();

      console.log('✅ User updated to admin:');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Clerk ID: ${updatedUser.clerkUserId}`);
    } else {
      console.log('Creating new admin user...');

      const [newUser] = await db
        .insert(users)
        .values({
          clerkUserId: ADMIN_USER_ID,
          email: ADMIN_EMAIL,
          name: 'Admin User',
          role: 'admin',
        })
        .returning();

      console.log('✅ Admin user created:');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Clerk ID: ${newUser.clerkUserId}`);
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('\nYou can now:');
    console.log('1. Run the seed script: npm run db:seed');
    console.log('2. Access admin panel at: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
