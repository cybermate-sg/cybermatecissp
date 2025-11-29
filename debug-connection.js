const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugConnection() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    console.log('Database URL (masked):', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET');
    console.log('');

    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();
        console.log('✓ Connected\n');

        // Get connection info
        const connInfo = await client.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        version() as pg_version;
    `);

        console.log('=== Connection Info ===');
        console.log('Database:', connInfo.rows[0].database);
        console.log('User:', connInfo.rows[0].user);
        console.log('Server:', connInfo.rows[0].server_ip, ':', connInfo.rows[0].server_port);
        console.log('PostgreSQL:', connInfo.rows[0].pg_version.split('\n')[0]);

        // Now try dropping in a single transaction and verify within the same transaction
        console.log('\n=== Testing DROP within transaction ===');

        await client.query('BEGIN');

        // Check before
        const before = await client.query(`
      SELECT count(*) as count FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typname IN ('test_status', 'test_type');
    `);
        console.log('Orphaned enums before DROP:', before.rows[0].count);

        // Drop
        await client.query(`DROP TYPE IF EXISTS public.test_status CASCADE;`);
        await client.query(`DROP TYPE IF EXISTS public.test_type CASCADE;`);
        console.log('✓ DROP commands executed');

        // Check after (still in transaction)
        const after = await client.query(`
      SELECT count(*) as count FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typname IN ('test_status', 'test_type');
    `);
        console.log('Orphaned enums after DROP (in transaction):', after.rows[0].count);

        // Commit
        await client.query('COMMIT');
        console.log('✓ Transaction committed');

        // Check after commit (new query)
        const afterCommit = await client.query(`
      SELECT count(*) as count FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typname IN ('test_status', 'test_type');
    `);
        console.log('Orphaned enums after COMMIT:', afterCommit.rows[0].count);

        if (afterCommit.rows[0].count === '0') {
            console.log('\n✅ SUCCESS! Enums were dropped successfully');

            // List all remaining enums
            const remaining = await client.query(`
        SELECT typname FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public' AND t.typtype = 'e'
        ORDER BY typname;
      `);
            console.log('\nRemaining enums:');
            remaining.rows.forEach(row => console.log(`  - ${row.typname}`));

            process.exit(0);
        } else {
            console.log('\n❌ FAILED! Enums still exist after commit');
            process.exit(1);
        }

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (e) {
            // ignore
        }
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
    }
}

debugConnection();
