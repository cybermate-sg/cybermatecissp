import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function patchDecksTable() {
  console.log('🔧 Patching decks table with is_published column...\n');

  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the patch migration SQL
    const migrationPath = path.join(process.cwd(), 'migration-patch.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing patch migration...');
    await client.query(migrationSQL);

    console.log('\n✅ Patch migration completed successfully!');
    console.log('\n🎉 The decks table now has the is_published column');

  } catch (error) {
    console.error('\n❌ Error during patch migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

patchDecksTable();
