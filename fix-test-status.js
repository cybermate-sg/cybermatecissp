const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

async function fixTestStatus() {
  try {
    console.log('Connecting to database...\n');
    const client = await pool.connect();

    // Check for views that might reference test_status
    console.log('1. Checking for views...');
    const views = await client.query(`
      SELECT table_name, view_definition
      FROM information_schema.views
      WHERE table_schema = 'public';
    `);

    if (views.rows.length > 0) {
      console.log('   Found views:');
      views.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
        if (row.view_definition.includes('test_status')) {
          console.log(`     WARNING: This view references test_status!`);
        }
      });
    } else {
      console.log('   No views found');
    }

    // Skip function check for now
    console.log('\n2. Skipping function check...');

    // Check drizzle metadata table
    console.log('\n3. Checking drizzle metadata...');
    const metaCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '__drizzle_migrations'
      ) as exists;
    `);

    if (metaCheck.rows[0].exists) {
      console.log('   Found __drizzle_migrations table');

      // Check its contents
      const metaContent = await client.query(`
        SELECT * FROM __drizzle_migrations LIMIT 5;
      `);
      console.log(`   Migrations count: ${metaContent.rows.length}`);
    }

    // List all enum types in the database
    console.log('\n4. Listing all enum types in database:');
    const enums = await client.query(`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    if (enums.rows.length > 0) {
      console.log('   Enum types:');
      enums.rows.forEach(row => {
        console.log(`   - ${row.enum_name}`);
      });
    }

    // Final aggressive drop
    console.log('\n5. Performing aggressive cleanup...');
    try {
      // Drop any dependent objects
      await client.query('DROP TYPE IF EXISTS public.test_status CASCADE;');
      console.log('   ✓ Dropped test_status type with CASCADE');

      // Verify it's gone
      const finalCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'test_status'
        ) as exists;
      `);

      if (finalCheck.rows[0].exists) {
        console.log('   ✗ WARNING: test_status still exists!');
      } else {
        console.log('   ✓ Confirmed test_status is removed');
      }
    } catch (err) {
      console.log('   ✗ Error during cleanup:', err.message);
    }

    client.release();
    await pool.end();

    console.log('\nCleanup complete. Try running pnpm db:push now.');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixTestStatus();
