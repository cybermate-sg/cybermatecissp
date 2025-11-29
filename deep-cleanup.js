const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function deepCleanup() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Check for any columns using these enum types
        console.log('=== STEP 1: Check for columns using orphaned enums ===');
        const columnsQuery = await client.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.udt_name as enum_type
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.udt_name IN ('test_status', 'test_type')
      ORDER BY c.table_name, c.column_name;
    `);

        if (columnsQuery.rows.length > 0) {
            console.log('  Found columns using orphaned enums:');
            columnsQuery.rows.forEach(row => {
                console.log(`    ${row.table_name}.${row.column_name} -> ${row.enum_type}`);
            });
        } else {
            console.log('  ✓ No columns using orphaned enums');
        }

        // Check migration journal
        console.log('\n=== STEP 2: Check migration journal ===');
        try {
            const migrations = await client.query(`
        SELECT hash, created_at 
        FROM __drizzle_migrations 
        ORDER BY created_at DESC;
      `);

            if (migrations.rows.length > 0) {
                console.log(`  Found ${migrations.rows.length} migrations in journal:`);
                migrations.rows.forEach((row, idx) => {
                    console.log(`    ${idx + 1}. ${row.hash.substring(0, 20)}... (${row.created_at})`);
                });
            } else {
                console.log('  No migrations in journal');
            }
        } catch (err) {
            console.log('  ⚠️  No migration journal table found');
        }

        // List all migration files
        console.log('\n=== STEP 3: Checking migration files ===');
        const fs = require('fs');
        const path = require('path');
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
        const migrationsDir = path.join(__dirname, 'drizzle', 'migrations');

        if (fs.existsSync(migrationsDir)) {
            const files = fs.readdirSync(migrationsDir)
                .filter(f => f.endsWith('.sql'))
                .sort();

            console.log(`  Found ${files.length} migration files:`);
            files.forEach(file => {
                console.log(`    - ${file}`);
            });
        }

        // Drop enums with CASCADE
        console.log('\n=== STEP 4: Force drop orphaned enums ===');

        // Helper function to validate and safely quote identifier names
        function safeIdentifier(name) {
            // Only allow alphanumeric characters and underscores
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                throw new Error(`Invalid identifier name: ${name}`);
            }
            // Quote identifier to prevent SQL injection
            return `"${name.replace(/"/g, '""')}"`;
        }

        const orphanedEnums = ['test_status', 'test_type'];

        for (const enumName of orphanedEnums) {
            try {
                // First check if it exists
                const checkQuery = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE n.nspname = 'public' AND t.typname = $1
          ) as exists;
        `, [enumName]);

                if (checkQuery.rows[0].exists) {
                    console.log(`  Dropping ${enumName}...`);
                    const safeEnumName = safeIdentifier(enumName);
                    await client.query(`DROP TYPE IF EXISTS public.${safeEnumName} CASCADE;`);
                    console.log(`  ✓ Dropped ${enumName}`);
                } else {
                    console.log(`  ✓ ${enumName} already removed`);
                }
            } catch (err) {
                console.log(`  ✗ Error with ${enumName}: ${err.message}`);
            }
        }

        // Final verification
        console.log('\n=== STEP 5: Final verification ===');
        const finalEnums = await client.query(`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

        const expectedEnums = ['user_role', 'plan_type', 'subscription_status', 'mastery_status', 'payment_status'];
        console.log('  Current enums:');
        finalEnums.rows.forEach(row => {
            const isExpected = expectedEnums.includes(row.enum_name);
            const marker = isExpected ? '✓' : '✗';
            console.log(`    ${marker} ${row.enum_name}`);
        });

        const unexpectedEnums = finalEnums.rows.filter(
            row => !expectedEnums.includes(row.enum_name)
        );

        if (unexpectedEnums.length === 0) {
            console.log('\n✅ Database is clean! Ready for db:push');
            return true;
        } else {
            console.log('\n⚠️  Still have unexpected enums:', unexpectedEnums.map(r => r.enum_name).join(', '));
            return false;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        return false;
    } finally {
        await client.end();
    }
}

deepCleanup().then(success => {
    process.exit(success ? 0 : 1);
});
