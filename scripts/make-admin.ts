import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npm run make-admin <email>');
    process.exit(1);
  }

  try {
    console.log(`Looking for user: ${email}...`);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log('\nAvailable users:');
      const allUsers = await db.select().from(users);
      allUsers.forEach(u => console.log(`  - ${u.email}`));
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`✅ User ${email} is already an admin`);
      process.exit(0);
    }

    // Update user to admin
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email));

    console.log(`✅ Successfully made ${email} an admin`);
    console.log('\nYou can now access admin pages at:');
    console.log('  - http://localhost:3000/admin/classes');
    console.log('  - http://localhost:3000/admin/decks');

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }

  process.exit(0);
}

makeAdmin();
