const { Client } = require('pg');
const format = require('pg-format');
require('dotenv').config({ path: '.env.local' });

async function fixDatabase() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Step 1: List current enums
        console.log('=== STEP 1: Current Enum Types ===');
        const enumsBefore = await client.query(`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

        enumsBefore.rows.forEach(row => {
            console.log(`  - ${row.enum_name}`);
        });

        // Step 2: Drop orphaned enums
        const orphanedEnums = ['test_status', 'test_type'];
        console.log('\n=== STEP 2: Dropping Orphaned Enums ===');

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
                console.log(`  Dropping ${enumName}...`);
                // Security: pg-format with %I safely escapes PostgreSQL identifiers
                await client.query(format('DROP TYPE IF EXISTS public.%I CASCADE', enumName));
                console.log(`  ✓ Dropped ${enumName}`);
            } catch (err) {
                console.log(`  ✗ Error dropping ${enumName}: ${err.message}`);
            }
        }

        // Step 3: Verify cleanup
        console.log('\n=== STEP 3: Remaining Enums ===');
        const enumsAfter = await client.query(`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

        const expectedEnums = ['user_role', 'plan_type', 'subscription_status', 'mastery_status', 'payment_status'];
        enumsAfter.rows.forEach(row => {
            const isExpected = expectedEnums.includes(row.enum_name);
            const marker = isExpected ? '✓' : '✗';
            console.log(`  ${marker} ${row.enum_name}`);
        });

        const unexpectedEnums = enumsAfter.rows.filter(
            row => !expectedEnums.includes(row.enum_name)
        );

        if (unexpectedEnums.length > 0) {
            console.log('\n⚠️  Warning: Unexpected enums still exist');
            return false;
        } else {
            console.log('\n✅ All orphaned enums removed successfully!');
            return true;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    } finally {
        await client.end();
    }
}

fixDatabase().then(success => {
    process.exit(success ? 0 : 1);
});
