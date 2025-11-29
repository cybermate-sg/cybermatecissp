const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function cleanupXata() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to Xata database\n');

        // Simple enum listing (Xata-compatible)
        console.log('=== Current Enums ===');
        const enumsBefore = await client.query(`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY t.typname;
    `);

        enumsBefore.rows.forEach(row => console.log(`  - ${row.typname}`));

        // Drop orphaned enums
        console.log('\n=== Dropping Orphaned Enums ===');

        try {
            await client.query(`DROP TYPE IF EXISTS public.test_status CASCADE;`);
            console.log('  ✓ Dropped test_status');
        } catch (err) {
            console.log(`  ✗ Error dropping test_status: ${err.message}`);
        }

        try {
            await client.query(`DROP TYPE IF EXISTS public.test_type CASCADE;`);
            console.log('  ✓ Dropped test_type');
        } catch (err) {
            console.log(`  ✗ Error dropping test_type: ${err.message}`);
        }

        // Verify
        console.log('\n=== Verification ===');
        const enumsAfter = await client.query(`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY t.typname;
    `);

        const expected = ['mastery_status', 'payment_status', 'plan_type', 'subscription_status', 'user_role'];
        let success = true;

        enumsAfter.rows.forEach(row => {
            const isExpected = expected.includes(row.typname);
            const marker = isExpected ? '✓' : '✗';
            console.log(`  ${marker} ${row.typname}`);
            if (!isExpected) success = false;
        });

        if (success) {
            console.log('\n✅ SUCCESS! Database is clean. Ready for db:push');
            process.exit(0);
        } else {
            console.log('\n⚠️  Orphaned enums still exist');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

cleanupXata();
