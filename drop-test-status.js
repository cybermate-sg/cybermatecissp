const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

async function dropTestStatus() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Dropping orphaned test_status enum type...');
    await client.query('DROP TYPE IF EXISTS public.test_status CASCADE;');

    console.log('✓ Successfully dropped test_status type');
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropTestStatus();
