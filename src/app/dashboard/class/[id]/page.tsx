import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getClassWithProgress } from "@/lib/api/class-server";
import ClassDetailClient from "@/components/ClassDetailClient";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { db, withRetry } from "@/lib/db";
import { subscriptions, userStats, studySessions } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { ensureUserExists } from "@/lib/db/ensure-user";
import { ACCESS_DURATION_DAYS, calculateDaysRemaining } from "@/lib/subscription";

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Default stats values
const DEFAULT_STATS = {
  streak: 0,
  minutesToday: 0,
  cardsToday: 0,
  accuracy: 85,
};

// Helper: Calculate total seconds from study sessions
function calculateTotalSeconds(sessions: Array<{ studyDuration: number | null }>) {
  return sessions.reduce((sum, session) => sum + (session.studyDuration || 0), 0);
}

// Helper: Calculate accuracy from sessions with confidence data
function calculateAccuracy(sessions: Array<{ averageConfidence: string | null }>) {
  const sessionsWithConfidence = sessions.filter(s => s.averageConfidence);
  if (sessionsWithConfidence.length === 0) return 85;

  const avgConfidence = sessionsWithConfidence.reduce(
    (sum, s) => sum + parseFloat(s.averageConfidence || '0'),
    0
  ) / sessionsWithConfidence.length;

  return Math.round((avgConfidence / 5) * 100);
}

// Helper: Get start of today timestamp
function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Helper: Get start of day N days ago
function getDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Helper: Fetch last 7 days activity (minutes studied per day)
async function getLast7DaysActivity(userId: string): Promise<number[]> {
  try {
    const sevenDaysAgo = getDaysAgo(6); // Include today, so 6 days ago

    const sessions = await withRetry(
      () => db.query.studySessions.findMany({
        where: and(
          eq(studySessions.clerkUserId, userId),
          gte(studySessions.startedAt, sevenDaysAgo)
        ),
      }),
      { queryName: 'fetch-7-days-sessions' }
    );

    // Group sessions by day and calculate total minutes per day
    const activityByDay = new Map<string, number>();

    // Initialize all 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = getDaysAgo(i);
      const dateKey = date.toISOString().split('T')[0];
      activityByDay.set(dateKey, 0);
    }

    // Sum up study duration for each day
    sessions.forEach(session => {
      const sessionDate = new Date(session.startedAt);
      sessionDate.setHours(0, 0, 0, 0);
      const dateKey = sessionDate.toISOString().split('T')[0];

      const currentMinutes = activityByDay.get(dateKey) || 0;
      const sessionMinutes = Math.round((session.studyDuration || 0) / 60);
      activityByDay.set(dateKey, currentMinutes + sessionMinutes);
    });

    // Convert to array in chronological order (oldest to newest)
    const result: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDaysAgo(i);
      const dateKey = date.toISOString().split('T')[0];
      result.push(activityByDay.get(dateKey) || 0);
    }

    return result;
  } catch (error) {
    console.error('[7-Day Activity Error] Failed to fetch activity:', error);
    // Return default array of zeros on error
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

// Fetch user statistics for the stats card
async function getUserStats(userId: string) {
  try {
    const stats = await withRetry(
      () => db.query.userStats.findFirst({
        where: eq(userStats.clerkUserId, userId),
      }),
      { queryName: 'fetch-user-stats' }
    );

    if (!stats) return { ...DEFAULT_STATS, last7DaysActivity: [0, 0, 0, 0, 0, 0, 0] };

    const streak = stats.studyStreakDays || 0;
    const cardsToday = stats.dailyCardsStudiedToday || 0;

    // PERFORMANCE: Fetch today's sessions and 7-day activity in parallel (async-parallel rule)
    const [todaySessions, last7DaysActivity] = await Promise.all([
      withRetry(
        () => db.query.studySessions.findMany({
          where: and(
            eq(studySessions.clerkUserId, userId),
            gte(studySessions.startedAt, getStartOfToday())
          ),
        }),
        { queryName: 'fetch-today-sessions' }
      ),
      getLast7DaysActivity(userId),
    ]);

    const totalSecondsToday = calculateTotalSeconds(todaySessions);
    const minutesToday = Math.round(totalSecondsToday / 60);
    const accuracy = calculateAccuracy(todaySessions);

    return { streak, minutesToday, cardsToday, accuracy, last7DaysActivity };
  } catch (error) {
    console.error('[User Stats Error] Failed to fetch user stats:', error);
    return { ...DEFAULT_STATS, last7DaysActivity: [0, 0, 0, 0, 0, 0, 0] };
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const classData = await getClassWithProgress(id);

  if (!classData) {
    return {
      title: "Class Not Found | CISSP Mastery",
    };
  }

  return {
    title: `${classData.name} | CISSP Mastery`,
    description: classData.description || `Study ${classData.name} with confidence-based flashcards`,
  };
}

// Server Component - Pre-renders HTML with data
export default async function ClassDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // PERFORMANCE: Parallelize auth calls (async-parallel rule)
  const [{ userId }, user] = await Promise.all([
    auth(),
    currentUser(),
  ]);

  // Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in database (fallback if webhook failed)
  await ensureUserExists(userId);

  // Unwrap params
  const { id: classId } = await params;

  // Fetch class data server-side (with Redis caching)
  const classData = await getClassWithProgress(classId);

  // Redirect to dashboard if class not found
  if (!classData) {
    redirect("/dashboard");
  }

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === "admin";

  // Fetch user subscription to calculate remaining days
  let daysLeft: number = ACCESS_DURATION_DAYS; // Default to ACCESS_DURATION_DAYS for users without active subscription

  try {
    // Fetch active subscription directly (removed debug queries for performance)
    const subscription = await withRetry(
      () => db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.clerkUserId, userId),
          eq(subscriptions.status, 'active')
        ),
        orderBy: [desc(subscriptions.createdAt)]
      }),
      { queryName: 'fetch-active-subscription' }
    );

    // Calculate remaining days from subscription creation date using shared function
    if (subscription?.createdAt) {
      daysLeft = calculateDaysRemaining(subscription.createdAt);
    } else {
      daysLeft = ACCESS_DURATION_DAYS; // Fallback if no active subscription
    }
  } catch (error) {
    console.error('[Subscription Error] Failed to fetch subscription:', error);
    // Continue with default - page will still work
    daysLeft = ACCESS_DURATION_DAYS;
  }

  // Get user's first name
  const userName = user?.firstName || user?.username || "there";

  // Fetch user stats for the stats card
  const userStatsData = await getUserStats(userId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729]">
      {/* Performance Monitoring */}
      <PerformanceMonitor pageName="Class Detail Page (SSR)" showVisual={false} />

      {/* Header with Back Button */}
      <div className="border-b border-gray-700/50 bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Client Component with Interactive Features */}
      <ClassDetailClient
        classData={classData}
        isAdmin={isAdmin}
        userName={userName}
        daysLeft={daysLeft}
        userStats={userStatsData}
      />
    </div>
  );
}
