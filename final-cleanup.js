const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function runSQLScript() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // List enums before
        console.log('=== Enums BEFORE cleanup ===');
        const before = await client.query(`
      SELECT typname FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY typname;
    `);
        before.rows.forEach(row => console.log(`  - ${row.typname}`));

        // Drop the orphaned enums
        console.log('\n=== Dropping orphaned enums ===');

        await client.query(`DROP TYPE IF EXISTS public.test_status CASCADE;`);
        console.log('  ✓ Dropped test_status');

        await client.query(`DROP TYPE IF EXISTS public.test_type CASCADE;`);
        console.log('  ✓ Dropped test_type');

        // List enums after
        console.log('\n=== Enums AFTER cleanup ===');
        const after = await client.query(`
      SELECT typname FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY typname;
    `);

        const expectedEnums = ['mastery_status', 'payment_status', 'plan_type', 'subscription_status', 'user_role'];
        let allGood = true;

        after.rows.forEach(row => {
            const isExpected = expectedEnums.includes(row.typname);
            const marker = isExpected ? '✓' : '✗';
            console.log(`  ${marker} ${row.typname}`);
            if (!isExpected) allGood = false;
        });

        console.log('');
        if (allGood) {
            console.log('✅ SUCCESS! Database is clean and ready for db:push');
            process.exit(0);
        } else {
            console.log('⚠️  WARNING: Unexpected enums still exist');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runSQLScript();
