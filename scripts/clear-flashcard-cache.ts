/**
 * Script to clear flashcard cache from Redis
 * Run with: npx tsx scripts/clear-flashcard-cache.ts
 */

import { cache } from '@/lib/redis';
import { db } from '@/lib/db';
import { decks } from '@/lib/db/schema';

async function clearCache() {
  try {
    console.log('Fetching all decks...\n');

    // Get all deck IDs
    const allDecks = await db.select({ id: decks.id, name: decks.name }).from(decks);

    console.log(`Found ${allDecks.length} decks\n`);

    // Clear cache for each deck
    for (const deck of allDecks) {
      const cacheKey = `deck:${deck.id}:flashcards`;
      console.log(`Clearing cache for deck: ${deck.name}`);
      console.log(`  Cache key: ${cacheKey}`);

      try {
        await cache.del(cacheKey);
        console.log(`  ✅ Cleared\n`);
      } catch (error) {
        console.log(`  ⚠️  Error clearing cache: ${error}\n`);
      }
    }

    console.log('✅ Cache clearing complete!');
    console.log('The next API request will fetch fresh data from the database.\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

clearCache();
