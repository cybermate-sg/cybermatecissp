const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function fixMigrations() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...\n');
    await client.connect();

    console.log('1. Checking drizzle migrations metadata...');

    // Create the migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);

    // Check current migrations
    const currentMigrations = await client.query(`
      SELECT * FROM "__drizzle_migrations" ORDER BY created_at;
    `);

    console.log(`   Found ${currentMigrations.rows.length} applied migrations:`);
    currentMigrations.rows.forEach(row => {
      console.log(`   - ${row.hash}`);
    });

    // Get migration files
    const migrationsDir = path.join(__dirname, 'drizzle', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n2. Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(f => {
      console.log(`   - ${f}`);
    });

    // Check which migrations are missing from the metadata
    const appliedHashes = currentMigrations.rows.map(r => r.hash);
    const migrationMetaPath = path.join(migrationsDir, 'meta', '_journal.json');

    let missingMigrations = [];
    if (fs.existsSync(migrationMetaPath)) {
      const journal = JSON.parse(fs.readFileSync(migrationMetaPath, 'utf8'));
      console.log(`\n3. Checking migration journal...`);

      journal.entries.forEach(entry => {
        const isApplied = appliedHashes.some(hash => hash.includes(entry.tag));
        console.log(`   ${isApplied ? '✓' : '✗'} ${entry.tag} (${entry.when})`);
        if (!isApplied) {
          missingMigrations.push(entry);
        }
      });
    }

    // Since the DB has the tables, let's just drop the orphaned enums and mark all migrations as applied
    console.log(`\n4. Dropping orphaned enums...`);

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
        const safeEnumName = safeIdentifier(enumName);
        await client.query(`DROP TYPE IF EXISTS public.${safeEnumName} CASCADE;`);
        console.log(`   ✓ Dropped ${enumName}`);
      } catch (err) {
        console.log(`   ✗ Error: ${err.message}`);
      }
    }

    // Clear the migrations table and start fresh
    console.log(`\n5. Resetting migrations metadata...`);
    await client.query(`DELETE FROM "__drizzle_migrations";`);
    console.log('   ✓ Cleared migration history');

    // Mark all existing migrations as applied
    if (fs.existsSync(migrationMetaPath)) {
      const journal = JSON.parse(fs.readFileSync(migrationMetaPath, 'utf8'));
      console.log(`\n6. Marking ${journal.entries.length} migrations as applied...`);

      for (const entry of journal.entries) {
        await client.query(
          `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2);`,
          [entry.tag, entry.when]
        );
        console.log(`   ✓ Marked ${entry.tag} as applied`);
      }
    }

    console.log('\n✓ Migration metadata has been fixed!');
    console.log('\nYou can now try running: pnpm db:push');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixMigrations();
