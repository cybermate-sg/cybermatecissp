/**
 * Script to check flashcard media in the database
 * Run with: npx tsx scripts/check-images.ts
 */

import { db } from '@/lib/db';
import { flashcardMedia, flashcards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkImages() {
  try {
    console.log('Checking flashcard media in database...\n');

    // Get all flashcard media records
    const allMedia = await db.select().from(flashcardMedia);

    console.log(`Total media records: ${allMedia.length}\n`);

    if (allMedia.length === 0) {
      console.log('❌ No media records found in database.');
      console.log('This explains why images are not showing.');
      console.log('You need to upload images through the admin interface.\n');
      return;
    }

    // Group by flashcard
    const mediaByCard = new Map<string, typeof allMedia>();
    for (const media of allMedia) {
      if (!mediaByCard.has(media.flashcardId)) {
        mediaByCard.set(media.flashcardId, []);
      }
      mediaByCard.get(media.flashcardId)!.push(media);
    }

    console.log(`Images found for ${mediaByCard.size} flashcards:\n`);

    // Show details for each flashcard with media
    for (const [flashcardId, mediaList] of mediaByCard.entries()) {
      const card = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, flashcardId),
      });

      console.log(`📝 Flashcard: ${card?.question.substring(0, 50)}...`);
      console.log(`   ID: ${flashcardId}`);
      console.log(`   Images (${mediaList.length}):`);

      for (const media of mediaList) {
        console.log(`     - ${media.placement} #${media.order}`);
        console.log(`       URL: ${media.fileUrl}`);
        console.log(`       File: ${media.fileName}`);
        console.log(`       Size: ${(media.fileSize / 1024).toFixed(2)} KB`);
        console.log(`       Type: ${media.mimeType}`);
      }
      console.log('');
    }

    console.log('✅ Check complete!\n');

  } catch (error) {
    console.error('Error checking images:', error);
  } finally {
    process.exit(0);
  }
}

checkImages();
