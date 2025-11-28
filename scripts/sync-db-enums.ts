/**
 * Script to identify and optionally delete excess enum types in Xata.io Postgres database
 * This compares the actual database enum types with your schema.ts definition
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

import format from 'pg-format';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

// Enum types that SHOULD exist according to schema.ts
const EXPECTED_ENUMS = new Set([
  'user_role',
  'plan_type',
  'subscription_status',
  'mastery_status',
  'payment_status',
]);

async function listAllEnums() {
  console.log('📋 Fetching all enum types from database...\n');

  const result = await pool.query(`
    SELECT t.typname as enum_name
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;
  `);

  return result.rows.map((row: any) => row.enum_name);
}

async function main() {
  try {
    const allEnums = await listAllEnums();

    console.log(`Total enum types found: ${allEnums.length}\n`);

    console.log('📊 Enum Types Analysis:\n');
    console.log('Expected enum types (from schema.ts):');
    EXPECTED_ENUMS.forEach(enumType => {
      const exists = allEnums.includes(enumType);
      console.log(`  ${exists ? '✅' : '❌'} ${enumType}`);
    });

    console.log('\n📦 All enum types in database:');
    allEnums.forEach(enumType => {
      const isExpected = EXPECTED_ENUMS.has(enumType);
      console.log(`  ${isExpected ? '✅' : '⚠️ '} ${enumType} ${!isExpected ? '(EXCESS - not in schema)' : ''}`);
    });

    // Identify excess enums
    const excessEnums = allEnums.filter(enumType => !EXPECTED_ENUMS.has(enumType));

    if (excessEnums.length > 0) {
      console.log('\n🗑️  Excess enum types to DELETE:\n');
      excessEnums.forEach(enumType => {
        console.log(`  ⚠️  ${enumType}`);
      });

      console.log('\n📝 To delete these enum types, run the following SQL commands:');
      console.log('   (You can run these in Xata.io SQL console or uncomment the deletion code below)\n');

      excessEnums.forEach(enumType => {
        console.log(format('DROP TYPE IF EXISTS %I CASCADE;', enumType));
      });

      console.log('\n⚠️  WARNING: CASCADE will also drop any columns using these types!');
      console.log('   Make sure you have backups before running these commands.');
      console.log('   To auto-delete, uncomment the deletion code in this script.\n');

      // UNCOMMENT THIS SECTION TO AUTO-DELETE EXCESS ENUM TYPES
      /*
      console.log('\n🔄 Deleting excess enum types...\n');
      for (const enumType of excessEnums) {
        try {
          await pool.query(format('DROP TYPE IF EXISTS %I CASCADE', enumType));
          console.log(`  ✅ Deleted: ${enumType}`);
        } catch (error) {
          console.error(`  ❌ Failed to delete ${enumType}:`, error);
        }
      }
      console.log('\n✅ Cleanup complete!');
      */
    } else {
      console.log('\n✅ No excess enum types found! Database is in sync with schema.ts');
    }

    // Check for missing enums
    const missingEnums = Array.from(EXPECTED_ENUMS).filter(
      enumType => !allEnums.includes(enumType)
    );

    if (missingEnums.length > 0) {
      console.log('\n⚠️  Missing enum types (defined in schema.ts but not in database):\n');
      missingEnums.forEach(enumType => {
        console.log(`  ❌ ${enumType}`);
      });
      console.log('\n💡 Run `npm run db:push` to create missing enum types.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
