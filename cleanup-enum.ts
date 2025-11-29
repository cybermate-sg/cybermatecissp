import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No DATABASE_URL or POSTGRES_URL found');
  process.exit(1);
}

const client = postgres(connectionString);

async function cleanup() {
  try {
    console.log('🧹 Dropping orphaned test_status enum...');
    await client.unsafe(`DROP TYPE IF EXISTS public.test_status CASCADE;`);
    console.log('✅ Orphaned enum cleaned up successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanup();
