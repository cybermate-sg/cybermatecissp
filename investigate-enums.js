const { Client } = require('pg');
const format = require('pg-format');
require('dotenv').config({ path: '.env.local' });

async function investigateEnums() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected\n');

        // Get detailed info about the enums
        console.log('=== Detailed Enum Information ===');
        const enumDetails = await client.query(`
      SELECT 
        t.oid,
        t.typname,
        t.typtype,
        n.nspname as schema,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      LEFT JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      GROUP BY t.oid, t.typname, t.typtype, n.nspname
      ORDER BY t.typname;
    `);

        console.log('Found', enumDetails.rows.length, 'enum types:\n');
        enumDetails.rows.forEach(row => {
            console.log(`${row.typname} (OID: ${row.oid})`);
            console.log(`  Schema: ${row.schema}`);
            console.log(`  Values: ${row.values ? row.values.join(', ') : 'none'}`);
            console.log('');
        });

        // Check if any columns are using these enums
        console.log('\n=== Columns Using Enums ===');
        const columnUsage = await client.query(`
      SELECT 
        c.table_schema,
        c.table_name,
        c.column_name,
        c.udt_name,
        c.data_type
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.udt_name IN ('test_status', 'test_type')
      ORDER BY c.table_name, c.column_name;
    `);

        if (columnUsage.rows.length > 0) {
            console.log('Found columns using orphaned enums:');
            columnUsage.rows.forEach(row => {
                console.log(`  ${row.table_name}.${row.column_name} -> ${row.udt_name}`);
            });
        } else {
            console.log('✓ No columns are using test_status or test_type');
        }

        // Try dropping with explicit schema and CASCADE
        console.log('\n=== Attempting to Drop Enums ===');

        for (const enumName of ['test_status', 'test_type']) {
            try {
                console.log(`\nDropping ${enumName}...`);
                // Use pg-format with %I to safely escape PostgreSQL identifiers
                // This prevents SQL injection by properly quoting the identifier
                const dropResult = await client.query(
                    format('DROP TYPE IF EXISTS public.%I CASCADE', enumName)
                );
                console.log(`  Command: ${dropResult.command}`);
                console.log(`  Rows affected: ${dropResult.rowCount}`);
                console.log(`  ✓ Drop command executed`);
            } catch (err) {
                console.log(`  ✗ Error: ${err.message}`);
            }
        }

        // Immediate verification
        console.log('\n=== Immediate Verification ===');
        const verifyResult = await client.query(`
      SELECT typname 
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY typname;
    `);

        console.log('Enums after drop:');
        verifyResult.rows.forEach(row => {
            const isOrphaned = ['test_status', 'test_type'].includes(row.typname);
            console.log(`  ${isOrphaned ? '✗' : '✓'} ${row.typname}`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

investigateEnums();
