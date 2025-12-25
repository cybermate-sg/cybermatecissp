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

// Fetch user statistics for the stats card
async function getUserStats(userId: string) {
  try {
    const stats = await withRetry(
      () => db.query.userStats.findFirst({
        where: eq(userStats.clerkUserId, userId),
      }),
      { queryName: 'fetch-user-stats' }
    );

    if (!stats) return DEFAULT_STATS;

    const streak = stats.studyStreakDays || 0;
    const cardsToday = stats.dailyCardsStudiedToday || 0;

    // Fetch today's study sessions
    const todaySessions = await withRetry(
      () => db.query.studySessions.findMany({
        where: and(
          eq(studySessions.clerkUserId, userId),
          gte(studySessions.startedAt, getStartOfToday())
        ),
      }),
      { queryName: 'fetch-today-sessions' }
    );

    const totalSecondsToday = calculateTotalSeconds(todaySessions);
    const minutesToday = Math.round(totalSecondsToday / 60);
    const accuracy = calculateAccuracy(todaySessions);

    return { streak, minutesToday, cardsToday, accuracy };
  } catch (error) {
    console.error('[User Stats Error] Failed to fetch user stats:', error);
    return DEFAULT_STATS;
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
  // Get authentication
  const { userId } = await auth();
  const user = await currentUser();

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
  let daysLeft: number = 365; // Default to 365 days for users without active subscription

  try {
    // First, check ALL subscriptions for this user (for debugging)
    const allUserSubscriptions = await withRetry(
      () => db.query.subscriptions.findMany({
        where: eq(subscriptions.clerkUserId, userId),
        orderBy: [desc(subscriptions.createdAt)]
      }),
      { queryName: 'fetch-all-user-subscriptions' }
    );

    console.log('[Subscription Debug] User ID:', userId);
    console.log('[Subscription Debug] Total subscriptions found:', allUserSubscriptions.length);
    if (allUserSubscriptions.length > 0) {
      allUserSubscriptions.forEach((sub, index) => {
        console.log('[Subscription Debug] Sub', index + 1, ': Status=', sub.status, ', CreatedAt=', sub.createdAt, ', ID=', sub.id);
      });
    }

    // Now get the active one
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

    // Calculate remaining days from subscription creation date (365 days total)
    if (subscription?.createdAt) {
      const startDate = new Date(subscription.createdAt);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      daysLeft = Math.max(0, 365 - daysSinceStart);

      // Debug logging to verify calculation
      console.log(`[Days Calculation] Start: ${startDate.toISOString()}, Today: ${today.toISOString()}, Days Since Start: ${daysSinceStart}, Days Left: ${daysLeft}`);
    } else {
      console.log('[Days Calculation] No active subscription found, using default 365 days');
      daysLeft = 365; // Fallback to 365 days if no active subscription
    }
  } catch (error) {
    console.error('[Subscription Error] Failed to fetch subscription:', error);
    // Continue with default 365 days - page will still work
    daysLeft = 365;
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
