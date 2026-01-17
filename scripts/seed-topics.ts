import 'dotenv/config';
import { db } from '../src/lib/db';
import { topics, subTopics } from '../src/lib/db/schema';
import { CISSP_TOPICS_DATA } from '../src/lib/data/cissp-topics-data';

/**
 * Seed script to populate CISSP topics and sub-topics
 * Run with: bun run scripts/seed-topics.ts
 */

async function seedTopics() {
  console.log('🌱 Starting CISSP topics seed...\n');

  try {
    // Check if topics already exist
    const existingTopics = await db.select().from(topics).limit(1);
    if (existingTopics.length > 0) {
      console.log('⚠️  Topics already exist in database. Skipping seed.');
      console.log('   To reseed, delete existing topics first.\n');
      return;
    }

    let totalTopics = 0;
    let totalSubTopics = 0;

    for (const domain of CISSP_TOPICS_DATA) {
      console.log(`📚 Domain ${domain.domainNumber}: ${domain.domainName}`);

      for (const topic of domain.topics) {
        // Insert topic
        const [insertedTopic] = await db.insert(topics).values({
          domainNumber: domain.domainNumber,
          topicCode: topic.code,
          topicName: topic.name,
          order: topic.order,
        }).returning();

        totalTopics++;
        console.log(`   ├─ Topic ${topic.code}: ${topic.name.substring(0, 50)}...`);

        // Insert sub-topics
        if (topic.subTopics.length > 0) {
          for (const subTopic of topic.subTopics) {
            await db.insert(subTopics).values({
              topicId: insertedTopic.id,
              subTopicName: subTopic.name,
              order: subTopic.order,
            });
            totalSubTopics++;
          }
          console.log(`   │  └─ ${topic.subTopics.length} sub-topics`);
        }
      }
      console.log('');
    }

    console.log('✅ Seed completed successfully!');
    console.log(`   📊 Total topics: ${totalTopics}`);
    console.log(`   📊 Total sub-topics: ${totalSubTopics}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run the seed
seedTopics()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
