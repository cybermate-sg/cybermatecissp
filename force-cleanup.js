const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function forceCleanup() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected\n');

        // Use a transaction to ensure atomic cleanup
        await client.query('BEGIN');

        console.log('Dropping orphaned enums...');

        // Drop test_status enum
        try {
            await client.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_status') THEN
            DROP TYPE public.test_status CASCADE;
            RAISE NOTICE 'Dropped test_status';
          END IF;
        END $$;
      `);
        } catch (err) {
            console.log('Error dropping test_status:', err.message);
        }

        // Drop test_type enum
        try {
            await client.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type') THEN
            DROP TYPE public.test_type CASCADE;
            RAISE NOTICE 'Dropped test_type';
          END IF;
        END $$;
      `);
        } catch (err) {
            console.log('Error dropping test_type:', err.message);
        }

        await client.query('COMMIT');
        console.log('✓ Transaction committed\n');

        // Verify
        const result = await client.query(`
      SELECT typname 
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' 
        AND t.typtype = 'e'
      ORDER BY typname;
    `);

        console.log('Remaining enum types:');
        result.rows.forEach(row => {
            console.log(`  - ${row.typname}`);
        });

        const hasOrphans = result.rows.some(r =>
            r.typname === 'test_status' || r.typname === 'test_type'
        );

        if (hasOrphans) {
            console.log('\n❌ Orphaned enums still exist!');
            process.exit(1);
        } else {
            console.log('\n✅ All clean! Ready for db:push');
            process.exit(0);
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

forceCleanup();
