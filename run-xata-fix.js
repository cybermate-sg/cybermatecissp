const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runXataFix() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to Xata\n');

        console.log('Executing Xata-compatible enum fix...\n');

        // Helper function to validate and safely quote identifier names
        function safeIdentifier(name) {
            // Only allow alphanumeric characters and underscores
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                throw new Error(`Invalid identifier name: ${name}`);
            }
            // Quote identifier to prevent SQL injection
            return `"${name.replace(/"/g, '""')}"`;
        }

        // Step 1: Drop orphaned enums
        const orphanedEnums = ['test_status', 'test_type'];
        for (const enumName of orphanedEnums) {
            const safeEnumName = safeIdentifier(enumName);
            await client.query(`DROP TYPE IF EXISTS public.${safeEnumName} CASCADE;`);
            console.log(`  ✓ Dropped ${enumName} (if it existed)`);
        }

        // Step 2: Create required enums if they don't exist
        const enumDefinitions = {
            mastery_status: ['new', 'learning', 'mastered'],
            payment_status: ['succeeded', 'failed', 'pending'],
            plan_type: ['free', 'pro_monthly', 'pro_yearly', 'lifetime'],
            subscription_status: ['active', 'canceled', 'past_due', 'trialing', 'inactive'],
            user_role: ['user', 'admin']
        };

        for (const [enumName, values] of Object.entries(enumDefinitions)) {
            const safeEnumName = safeIdentifier(enumName);
            const safeValues = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');

            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = $1) THEN
                        EXECUTE format('CREATE TYPE public.%I AS ENUM(${safeValues})', $1);
                    END IF;
                END $$;
            `, [enumName]);
            console.log(`  ✓ Ensured ${enumName} exists`);
        }

        console.log('\n✓ SQL operations completed successfully\n');

        // Verify the result
        console.log('=== Final Enum State ===');
        const result = await client.query(`
      SELECT typname FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY typname;
    `);

        const expected = ['mastery_status', 'payment_status', 'plan_type', 'subscription_status', 'user_role'];
        let success = true;

        result.rows.forEach(row => {
            const isExpected = expected.includes(row.typname);
            const marker = isExpected ? '✓' : '✗';
            console.log(`  ${marker} ${row.typname}`);
            if (!isExpected) success = false;
        });

        if (success && result.rows.length === expected.length) {
            console.log('\n✅ SUCCESS! All orphaned enums removed, schema is clean!');
            process.exit(0);
        } else if (success) {
            console.log('\n⚠️  Orphaned enums removed but some expected enums missing');
            process.exit(1);
        } else {
            console.log('\n❌ Orphaned enums still exist');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runXataFix();
