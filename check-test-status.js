const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

async function checkTestStatus() {
  try {
    console.log('Connecting to database...\n');
    const client = await pool.connect();

    // Check if the type exists
    console.log('1. Checking if test_status type exists:');
    const typeCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'test_status'
      ) as exists;
    `);
    console.log('   Type exists:', typeCheck.rows[0].exists);

    // Check what columns reference test_status
    console.log('\n2. Checking for columns using test_status:');
    const columnCheck = await client.query(`
      SELECT
        n.nspname as schema_name,
        c.relname as table_name,
        a.attname as column_name,
        t.typname as type_name
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_type t ON a.atttypid = t.oid
      WHERE t.typname = 'test_status'
        AND a.attnum > 0
        AND NOT a.attisdropped;
    `);

    if (columnCheck.rows.length > 0) {
      console.log('   Found columns using test_status:');
      columnCheck.rows.forEach(row => {
        console.log(`   - ${row.schema_name}.${row.table_name}.${row.column_name}`);
      });
    } else {
      console.log('   No columns found using test_status');
    }

    // Check for dependencies
    console.log('\n3. Checking for dependencies on test_status:');
    const depCheck = await client.query(`
      SELECT
        objid::regclass as dependent_object,
        refobjid::regclass as referenced_object
      FROM pg_depend
      WHERE refobjid = (SELECT oid FROM pg_type WHERE typname = 'test_status')
        AND deptype = 'n';
    `);

    if (depCheck.rows.length > 0) {
      console.log('   Found dependencies:');
      depCheck.rows.forEach(row => {
        console.log(`   - ${row.dependent_object} depends on ${row.referenced_object}`);
      });
    } else {
      console.log('   No dependencies found');
    }

    // Try to drop it with CASCADE
    console.log('\n4. Attempting to drop test_status with CASCADE:');
    try {
      await client.query('DROP TYPE IF EXISTS public.test_status CASCADE;');
      console.log('   ✓ Successfully dropped test_status type with CASCADE');
    } catch (err) {
      console.log('   ✗ Error dropping type:', err.message);
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTestStatus();
