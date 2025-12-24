/**
 * Verify test users are deleted
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db/index.js';
import { users } from '../src/lib/db/schema.js';
import { or, eq } from 'drizzle-orm';

const TEST_EMAILS = [
  'rmkugan@gmail.com',
  'rajaimadhavan@gmail.com'
];

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...\n');

  for (const email of TEST_EMAILS) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user) {
      console.log(`❌ ${email} - STILL EXISTS`);
    } else {
      console.log(`✅ ${email} - Deleted successfully`);
    }
  }

  console.log('\n✅ Verification complete!\n');
  process.exit(0);
}

verifyCleanup();
