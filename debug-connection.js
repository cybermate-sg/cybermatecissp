/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function logConnectionInfo(client) {
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
}

async function countOrphanedEnums(client) {
    const result = await client.query(`
    SELECT count(*) as count FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typname IN ('test_status', 'test_type');
  `);
    return result.rows[0].count;
}

async function testEnumDrop(client) {
    console.log('\n=== Testing DROP within transaction ===');

    await client.query('BEGIN');

    const before = await countOrphanedEnums(client);
    console.log('Orphaned enums before DROP:', before);

    await client.query(`DROP TYPE IF EXISTS public.test_status CASCADE;`);
    await client.query(`DROP TYPE IF EXISTS public.test_type CASCADE;`);
    console.log('✓ DROP commands executed');

    const after = await countOrphanedEnums(client);
    console.log('Orphaned enums after DROP (in transaction):', after);

    await client.query('COMMIT');
    console.log('✓ Transaction committed');

    return await countOrphanedEnums(client);
}

async function listRemainingEnums(client) {
    const remaining = await client.query(`
    SELECT typname FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY typname;
  `);
    console.log('\nRemaining enums:');
    remaining.rows.forEach(row => console.log(`  - ${row.typname}`));
}

async function verifyAndReportResults(client, afterCommitCount) {
    if (afterCommitCount === '0') {
        console.log('\n✅ SUCCESS! Enums were dropped successfully');
        await listRemainingEnums(client);
        process.exit(0);
    } else {
        console.log('\n❌ FAILED! Enums still exist after commit');
        process.exit(1);
    }
}

async function debugConnection() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    console.log('Database URL (masked):', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET');
    console.log('');

    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();
        console.log('✓ Connected\n');

        await logConnectionInfo(client);
        const afterCommitCount = await testEnumDrop(client);
        console.log('Orphaned enums after COMMIT:', afterCommitCount);

        await verifyAndReportResults(client, afterCommitCount);

    } catch (error) {
        try {
            await client.query('ROLLBACK');
    } catch {
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
