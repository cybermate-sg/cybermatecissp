const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function cleanupOrphanedEnums() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...\n');
    await client.connect();

    console.log('1. Listing current enum types:');
    const enumsBefore = await client.query(`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    console.log('   Current enums:');
    enumsBefore.rows.forEach(row => {
      console.log(`   - ${row.enum_name}`);
    });

    const orphanedEnums = ['test_status', 'test_type'];
    const expectedEnums = ['user_role', 'plan_type', 'subscription_status', 'mastery_status', 'payment_status'];

    console.log('\n2. Dropping orphaned enums...');

    // Helper function to validate and safely quote identifier names
    function safeIdentifier(name) {
      // Only allow alphanumeric characters and underscores
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`Invalid identifier name: ${name}`);
      }
      // Quote identifier to prevent SQL injection
      return `"${name.replace(/"/g, '""')}"`;
    }

    for (const enumName of orphanedEnums) {
      try {
        console.log(`   Dropping ${enumName}...`);
        const safeEnumName = safeIdentifier(enumName);
        await client.query(`DROP TYPE IF EXISTS public.${safeEnumName} CASCADE;`);
        console.log(`   ✓ Dropped ${enumName}`);
      } catch (err) {
        console.log(`   ✗ Error dropping ${enumName}:`, err.message);
      }
    }

    console.log('\n3. Verifying cleanup...');
    const enumsAfter = await client.query(`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    console.log('   Remaining enums:');
    enumsAfter.rows.forEach(row => {
      const isExpected = expectedEnums.includes(row.enum_name);
      const marker = isExpected ? '✓' : '✗';
      console.log(`   ${marker} ${row.enum_name}`);
    });

    const unexpectedEnums = enumsAfter.rows.filter(
      row => !expectedEnums.includes(row.enum_name)
    );

    if (unexpectedEnums.length > 0) {
      console.log('\n⚠️  Warning: Unexpected enums still exist:', unexpectedEnums.map(r => r.enum_name).join(', '));
    } else {
      console.log('\n✓ All orphaned enums have been removed!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupOrphanedEnums();
