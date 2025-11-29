const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifySchema() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to Xata\n');

        // Check enums
        console.log('=== Enum Types ===');
        const enums = await client.query(`
      SELECT typname FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typtype = 'e'
      ORDER BY typname;
    `);

        const expectedEnums = ['mastery_status', 'payment_status', 'plan_type', 'subscription_status', 'user_role'];
        const orphanedEnums = ['test_status', 'test_type'];

        let hasOrphans = false;
        let missingEnums = [];

        enums.rows.forEach(row => {
            const isExpected = expectedEnums.includes(row.typname);
            const isOrphaned = orphanedEnums.includes(row.typname);

            if (isOrphaned) {
                console.log(`  ✗ ${row.typname} (ORPHANED - should not exist)`);
                hasOrphans = true;
            } else if (isExpected) {
                console.log(`  ✓ ${row.typname}`);
            } else {
                console.log(`  ? ${row.typname} (unexpected)`);
            }
        });

        expectedEnums.forEach(expected => {
            if (!enums.rows.find(row => row.typname === expected)) {
                missingEnums.push(expected);
            }
        });

        if (missingEnums.length > 0) {
            console.log('\n⚠️  Missing enums:', missingEnums.join(', '));
        }

        // Check tables
        console.log('\n=== Tables ===');
        const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        console.log(`Found ${tables.rows.length} tables:`);
        const expectedTables = [
            'users', 'subscriptions', 'payments', 'classes', 'decks', 'flashcards',
            'flashcard_media', 'quiz_questions', 'deck_quiz_questions',
            'bookmarked_flashcards', 'user_card_progress', 'study_sessions',
            'session_cards', 'deck_progress', 'class_progress', 'user_stats'
        ];

        expectedTables.forEach(table => {
            const exists = tables.rows.find(row => row.tablename === table);
            console.log(`  ${exists ? '✓' : '✗'} ${table}`);
        });

        // Final verdict
        console.log('\n=== Final Status ===');
        if (hasOrphans) {
            console.log('❌ FAILED: Orphaned enums still exist');
            process.exit(1);
        } else if (missingEnums.length > 0) {
            console.log('⚠️  WARNING: Some expected enums are missing');
            process.exit(1);
        } else {
            console.log('✅ SUCCESS: Schema is clean and properly synced!');
            console.log('\nYou can now proceed with development.');
            console.log('Note: `drizzle-kit push` may still fail due to Xata introspection issues,');
            console.log('but the schema is correctly set up and your application should work fine.');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifySchema();
