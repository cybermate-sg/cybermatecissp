import { db } from '../src/lib/db';
import { studySessions, userStats, sessionCards } from '../src/lib/db/schema';
import { eq, desc, gte } from 'drizzle-orm';

async function verifyStudyStats() {
  const userId = process.argv[2];

  if (!userId) {
    console.log('❌ Usage: tsx scripts/verify-study-stats.ts <clerkUserId>');
    console.log('\n💡 Tip: You can find your Clerk User ID in the browser console or Clerk dashboard');
    process.exit(1);
  }

  console.log('\n🔍 STUDY STATS VERIFICATION REPORT');
  console.log('=====================================\n');
  console.log(`User ID: ${userId}\n`);

  // 1. Check User Stats Table
  console.log('📊 USER STATS TABLE:');
  console.log('─────────────────────────────────────');
  const userStatsRecord = await db.query.userStats.findFirst({
    where: eq(userStats.clerkUserId, userId),
  });

  if (userStatsRecord) {
    console.log('✅ Record found');
    console.log(`   Total Cards Studied: ${userStatsRecord.totalCardsStudied}`);
    console.log(`   Study Streak Days: ${userStatsRecord.studyStreakDays}`);
    console.log(`   Daily Cards Today: ${userStatsRecord.dailyCardsStudiedToday}`);
    console.log(`   Total Study Time: ${userStatsRecord.totalStudyTime} seconds (${Math.round(userStatsRecord.totalStudyTime / 60)} mins)`);
    console.log(`   Last Active: ${userStatsRecord.lastActiveDate}`);
    console.log(`   Last Reset: ${userStatsRecord.lastResetDate}`);
  } else {
    console.log('❌ No user stats record found');
    console.log('   This means the user has never completed a study session');
  }

  // 2. Check Study Sessions
  console.log('\n📚 STUDY SESSIONS:');
  console.log('─────────────────────────────────────');
  const sessions = await db.query.studySessions.findMany({
    where: eq(studySessions.clerkUserId, userId),
    orderBy: [desc(studySessions.startedAt)],
    limit: 5,
  });

  if (sessions.length === 0) {
    console.log('❌ No study sessions found');
    console.log('   Sessions are created when you start studying and end when you finish');
  } else {
    console.log(`✅ Found ${sessions.length} session(s) (showing last 5):\n`);

    for (const [index, session] of sessions.entries()) {
      console.log(`   Session ${index + 1}:`);
      console.log(`   ├─ ID: ${session.id}`);
      console.log(`   ├─ Started: ${session.startedAt}`);
      console.log(`   ├─ Ended: ${session.endedAt || '⚠️  NOT ENDED (session still active or crashed)'}`);
      console.log(`   ├─ Cards Studied: ${session.cardsStudied || 0}`);
      console.log(`   ├─ Duration: ${session.studyDuration || 0} seconds`);
      console.log(`   └─ Avg Confidence: ${session.averageConfidence || 'N/A'}`);

      // Check session cards
      const cards = await db.query.sessionCards.findMany({
        where: eq(sessionCards.sessionId, session.id),
      });
      console.log(`      └─ Cards in session: ${cards.length}\n`);
    }
  }

  // 3. Check Today's Activity
  console.log('📅 TODAY\'S ACTIVITY:');
  console.log('─────────────────────────────────────');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allSessions = await db.query.studySessions.findMany({
    where: eq(studySessions.clerkUserId, userId),
  });

  const todaySessions = allSessions.filter(s => new Date(s.startedAt) >= today);
  const completedToday = todaySessions.filter(s => s.endedAt !== null);
  const activeToday = todaySessions.filter(s => s.endedAt === null);

  console.log(`   Sessions started today: ${todaySessions.length}`);
  console.log(`   ├─ Completed: ${completedToday.length}`);
  console.log(`   └─ Active/Not ended: ${activeToday.length}`);

  if (activeToday.length > 0) {
    console.log('\n   ⚠️  WARNING: You have active sessions that were not ended:');
    activeToday.forEach(s => {
      console.log(`      - Started at ${s.startedAt} (ID: ${s.id})`);
    });
    console.log('      These sessions won\'t count toward your stats until they\'re ended.');
  }

  const totalCardsToday = completedToday.reduce((sum, s) => sum + (s.cardsStudied || 0), 0);
  const totalTimeToday = completedToday.reduce((sum, s) => sum + (s.studyDuration || 0), 0);

  console.log(`\n   Total cards studied today: ${totalCardsToday}`);
  console.log(`   Total time today: ${totalTimeToday} seconds (${Math.round(totalTimeToday / 60)} mins)`);

  // 4. Summary
  console.log('\n🎯 SUMMARY:');
  console.log('─────────────────────────────────────');

  if (userStatsRecord && completedToday.length > 0) {
    console.log('✅ Everything looks good!');
    console.log('   Your stats should be showing correctly on the dashboard.');
  } else if (userStatsRecord && completedToday.length === 0) {
    console.log('⚠️  You have historical data but no activity today.');
    console.log('   Study some cards today to see your stats update!');
  } else if (activeToday.length > 0) {
    console.log('⚠️  You have active sessions that need to be ended.');
    console.log('   Navigate back to the dashboard to trigger session end.');
  } else {
    console.log('❌ No study data found.');
    console.log('   Start studying to see your stats!');
  }

  console.log('\n=====================================\n');
  process.exit(0);
}

verifyStudyStats().catch(console.error);
