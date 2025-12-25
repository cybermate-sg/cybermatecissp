import { db } from '../src/lib/db';
import { studySessions, userStats, sessionCards } from '../src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function checkStudyStats() {
  const userId = process.argv[2];

  if (!userId) {
    console.log('Usage: tsx scripts/check-study-stats.ts <clerkUserId>');
    process.exit(1);
  }

  console.log(`\n🔍 Checking study stats for user: ${userId}\n`);

  // Check user stats
  const userStatsRecord = await db.query.userStats.findFirst({
    where: eq(userStats.clerkUserId, userId),
  });

  console.log('📊 User Stats:');
  if (userStatsRecord) {
    console.log('  - Total Cards Studied:', userStatsRecord.totalCardsStudied);
    console.log('  - Study Streak Days:', userStatsRecord.studyStreakDays);
    console.log('  - Daily Cards Today:', userStatsRecord.dailyCardsStudiedToday);
    console.log('  - Total Study Time (seconds):', userStatsRecord.totalStudyTime);
    console.log('  - Last Active:', userStatsRecord.lastActiveDate);
    console.log('  - Last Reset:', userStatsRecord.lastResetDate);
  } else {
    console.log('  ❌ No user stats found');
  }

  // Check study sessions
  const sessions = await db.query.studySessions.findMany({
    where: eq(studySessions.clerkUserId, userId),
    orderBy: [desc(studySessions.startedAt)],
    limit: 10,
  });

  console.log(`\n📚 Study Sessions (last 10):`);
  if (sessions.length === 0) {
    console.log('  ❌ No study sessions found');
  } else {
    for (const session of sessions) {
      console.log(`\n  Session ID: ${session.id}`);
      console.log(`    - Started: ${session.startedAt}`);
      console.log(`    - Ended: ${session.endedAt || 'NOT ENDED'}`);
      console.log(`    - Cards Studied: ${session.cardsStudied}`);
      console.log(`    - Duration: ${session.studyDuration || 0} seconds`);
      console.log(`    - Avg Confidence: ${session.averageConfidence || 'N/A'}`);

      // Check session cards
      const cards = await db.query.sessionCards.findMany({
        where: eq(sessionCards.sessionId, session.id),
      });
      console.log(`    - Cards in session: ${cards.length}`);
    }
  }

  // Check today's sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = await db.query.studySessions.findMany({
    where: eq(studySessions.clerkUserId, userId),
  });

  const todaySessionsFiltered = todaySessions.filter(s =>
    new Date(s.startedAt) >= today
  );

  console.log(`\n📅 Today's Activity:`);
  console.log(`  - Sessions today: ${todaySessionsFiltered.length}`);
  console.log(`  - Total cards today: ${todaySessionsFiltered.reduce((sum, s) => sum + (s.cardsStudied || 0), 0)}`);

  process.exit(0);
}

checkStudyStats().catch(console.error);
