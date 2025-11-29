const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseState() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database\n');

        // List all enum types
        console.log('=== ENUM TYPES ===');
        const enums = await client.query(`
      SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

        enums.rows.forEach(row => {
            console.log(`${row.enum_name}: [${row.values.join(', ')}]`);
        });

        // List all tables
        console.log('\n=== TABLES ===');
        const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        tables.rows.forEach(row => {
            console.log(`- ${row.tablename}`);
        });

        // Check migration journal
        console.log('\n=== MIGRATION JOURNAL ===');
        const journal = await client.query(`
      SELECT * FROM __drizzle_migrations 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);

        if (journal.rows.length > 0) {
            journal.rows.forEach(row => {
                console.log(`${row.created_at}: ${row.hash}`);
            });
        } else {
            console.log('No migrations found in journal');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkDatabaseState();
