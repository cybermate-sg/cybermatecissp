/**
 * Script to identify and optionally delete excess tables in Xata.io Postgres database
 * This compares the actual database tables with your schema.ts definition
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import format from 'pg-format';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

// Tables that SHOULD exist according to schema.ts
const EXPECTED_TABLES = new Set([
  'users',
  'subscriptions',
  'payments',
  'classes',
  'decks',
  'flashcards',
  'flashcard_media',
  'bookmarked_flashcards',
  'user_card_progress',
  'study_sessions',
  'session_cards',
  'deck_progress',
  'class_progress',
  'user_stats',
]);

// System tables to ignore (Postgres, Xata internal tables)
const SYSTEM_TABLES_PATTERNS = [
  '_pg_',
  'pg_',
  'sql_',
  'information_schema',
  '_xata_',
  'xata_',
];

async function listAllTables() {
  console.log('📋 Fetching all tables from database...\n');

  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  return result.rows.map((row: any) => row.table_name);
}

function isSystemTable(tableName: string): boolean {
  return SYSTEM_TABLES_PATTERNS.some(pattern =>
    tableName.toLowerCase().includes(pattern.toLowerCase())
  );
}

async function main() {
  try {
    const allTables = await listAllTables();

    console.log(`Total tables found: ${allTables.length}\n`);

    // Filter out system tables
    const userTables = allTables.filter(table => !isSystemTable(table));

    console.log('📊 User Tables Analysis:\n');
    console.log('Expected tables (from schema.ts):');
    EXPECTED_TABLES.forEach(table => {
      const exists = userTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

    console.log('\n📦 All tables in database:');
    userTables.forEach(table => {
      const isExpected = EXPECTED_TABLES.has(table);
      console.log(`  ${isExpected ? '✅' : '⚠️ '} ${table} ${!isExpected ? '(EXCESS - not in schema)' : ''}`);
    });

    // Identify excess tables
    const excessTables = userTables.filter(table => !EXPECTED_TABLES.has(table));

    if (excessTables.length > 0) {
      console.log('\n🗑️  Excess tables to DELETE:\n');
      excessTables.forEach(table => {
        console.log(`  ⚠️  ${table}`);
      });

      console.log('\n📝 To delete these tables, run the following SQL commands:');
      console.log('   (You can run these in Xata.io SQL console or uncomment the deletion code below)\n');

      excessTables.forEach(table => {
        console.log(format('DROP TABLE IF EXISTS %I CASCADE;', table));
      });

      console.log('\n⚠️  WARNING: Deletion is permanent! Make sure you have backups.');
      console.log('   To auto-delete, uncomment the deletion code in this script.\n');

      // UNCOMMENT THIS SECTION TO AUTO-DELETE EXCESS TABLES
      /*
      console.log('\n🔄 Deleting excess tables...\n');
      for (const table of excessTables) {
        try {
          await pool.query(format('DROP TABLE IF EXISTS %I CASCADE', table));
          console.log(`  ✅ Deleted: ${table}`);
        } catch (error) {
          console.error(`  ❌ Failed to delete ${table}:`, error);
        }
      }
      console.log('\n✅ Cleanup complete!');
      */
    } else {
      console.log('\n✅ No excess tables found! Database is in sync with schema.ts');
    }

    // Check for missing tables
    const missingTables = Array.from(EXPECTED_TABLES).filter(
      table => !userTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing tables (defined in schema.ts but not in database):\n');
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
      console.log('\n💡 Run `npm run db:push` to create missing tables.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
