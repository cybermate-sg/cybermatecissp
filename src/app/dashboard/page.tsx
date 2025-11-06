import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { db, withRetry } from "@/lib/db";
import { classes, userCardProgress, flashcards, decks, userStats } from "@/lib/db/schema";
import { eq, and, sql, asc, inArray } from "drizzle-orm";
import { Play, BookOpen, FileText, Lightbulb, Flame, Bookmark } from "lucide-react";

const getColorClass = (color: string | null) => {
  const colorMap: { [key: string]: string } = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
  };
  return colorMap[color || "purple"] || "bg-purple-500";
};

export default async function DashboardPage() {
  const { userId, has } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const hasPaidPlan = has({ plan: 'paid' });
  const userName = user?.firstName || "there";

  // Fetch all classes with their decks and flashcards
  // OPTIMIZATION: Only load flashcard IDs to reduce memory usage
  // Wrapped with retry logic to handle connection timeouts
  const allClasses = await withRetry(
    () =>
      db.query.classes.findMany({
        where: eq(classes.isPublished, true),
        orderBy: [asc(classes.order)],
        with: {
          decks: {
            where: eq(decks.isPublished, true),
            orderBy: [asc(decks.order)],
            with: {
              flashcards: {
                where: eq(flashcards.isPublished, true),
                columns: {
                  id: true, // Only load ID to minimize memory usage
                },
              },
            },
          },
        },
      }),
    { queryName: 'dashboard-fetch-all-classes' }
  );

  // Calculate total flashcard count and progress for each class
  const classesWithProgress = await Promise.all(
    allClasses.map(async (cls) => {
      const flashcardIds = cls.decks.flatMap((deck) =>
        deck.flashcards.map((card) => card.id)
      );

      const totalCards = flashcardIds.length;
      const deckCount = cls.decks.length;

      // Get user's progress for this class
      let progress = 0;
      let studiedCount = 0;
      if (totalCards > 0 && flashcardIds.length > 0) {
        const progressRecords = await withRetry(
          () =>
            db
              .select()
              .from(userCardProgress)
              .where(
                and(
                  eq(userCardProgress.clerkUserId, userId),
                  inArray(userCardProgress.flashcardId, flashcardIds)
                )
              ),
          { queryName: `dashboard-class-progress-${cls.id}` }
        );

        studiedCount = progressRecords.length;
        // For free users, cap the total cards used in progress calculation
        const effectiveTotalCards = hasPaidPlan ? totalCards : Math.min(totalCards, 10);
        const effectiveProgressCount = Math.min(progressRecords.length, effectiveTotalCards);
        progress = Math.round((effectiveProgressCount / effectiveTotalCards) * 100);
      }

      return {
        id: cls.id,
        order: cls.order,
        name: cls.name,
        description: cls.description,
        icon: cls.icon,
        color: cls.color,
        cardCount: totalCards,
        deckCount,
        progress,
        studiedCount,
      };
    })
  );

  const totalCards = classesWithProgress.reduce((sum, cls) => sum + cls.cardCount, 0);

  // Get user's overall studied cards count
  const [studiedCardsResult] = await withRetry(
    () =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userCardProgress)
        .where(eq(userCardProgress.clerkUserId, userId)),
    { queryName: 'dashboard-overall-progress-count' }
  );

  const studiedCards = studiedCardsResult?.count || 0;

  // For free users, limit the total cards displayed and used in calculations
  const displayTotalCards = hasPaidPlan ? totalCards : Math.min(totalCards, 10);
  // Cap studied cards at display total to prevent progress > 100%
  const effectiveStudiedCards = Math.min(studiedCards, displayTotalCards);
  const overallProgress = displayTotalCards > 0 ? Math.round((effectiveStudiedCards / displayTotalCards) * 100) : 0;

  // Get user stats for daily goal and streak
  const [userStatsRecord] = await withRetry(
    () =>
      db
        .select()
        .from(userStats)
        .where(eq(userStats.clerkUserId, userId))
        .limit(1),
    { queryName: 'dashboard-user-stats' }
  );

  const studyStreak = userStatsRecord?.studyStreakDays || 0;
  const totalStudyTime = userStatsRecord?.totalStudyTime || 0;
  const dailyGoal = 60; // 60 minutes daily goal
  const todayStudyTime = Math.min(totalStudyTime / 60, dailyGoal); // Convert to minutes

  // Get classes in progress (not 100% complete)
  const continueStudyingClasses = classesWithProgress
    .filter(cls => cls.progress > 0 && cls.progress < 100)
    .slice(0, 2);

  // If no in-progress classes, show first two classes
  const displayClasses = continueStudyingClasses.length > 0
    ? continueStudyingClasses
    : classesWithProgress.slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-300">
            Let&apos;s continue your journey to becoming a CISSP.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-300">Overall Progress</h3>
                  <span className="text-2xl font-bold text-blue-400">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3 mb-2" />
                <p className="text-sm text-gray-400">
                  {effectiveStudiedCards}/{displayTotalCards} Cards Studied
                </p>
              </CardContent>
            </Card>

            {/* Continue Studying Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Continue Studying</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayClasses.map((cls) => (
                  <Card key={cls.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all hover:border-blue-500 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 mb-2">
                        {cls.icon && (
                          <span className="text-3xl">{cls.icon}</span>
                        )}
                        <div className={`w-3 h-3 rounded-full ${getColorClass(cls.color)}`}></div>
                      </div>
                      <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
                        {cls.name}
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        {cls.progress}% complete
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Progress value={cls.progress} className="mb-4" />
                      <Link href={`/dashboard/class/${cls.id}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Continue
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/session/new" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                    <Play className="mr-2 h-4 w-4" />
                    Start New Session
                  </Button>
                </Link>
                <Link href="/dashboard/bookmarks" className="block">
                  <Button variant="outline" className="w-full border-purple-600 text-purple-400 hover:bg-purple-500/10 justify-start">
                    <Bookmark className="mr-2 h-4 w-4" />
                    My Bookmarks
                  </Button>
                </Link>
                <Link href="/dashboard/practice" className="block">
                  <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700 justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Take a Practice Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Daily Goal */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Daily Goal</CardTitle>
                  {studyStreak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-5 w-5" />
                      <span className="font-bold">{studyStreak} Day Streak</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {studyStreak > 0 ? (
                  <p className="text-sm text-gray-300 mb-4">
                    You&apos;re on a roll! Keep it up to build a strong study habit.
                  </p>
                ) : (
                  <p className="text-sm text-gray-300 mb-4">
                    Start your study streak today!
                  </p>
                )}
                <div className="flex items-center justify-center mb-2">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        className="text-slate-700"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="42"
                        cx="50"
                        cy="50"
                      />
                      {/* Progress circle */}
                      <circle
                        className="text-blue-500"
                        strokeWidth="8"
                        strokeDasharray={`${(todayStudyTime / dailyGoal) * 264} 264`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="42"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{Math.round(todayStudyTime)}/{dailyGoal}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {dailyGoal - Math.round(todayStudyTime)} minutes left to hit your goal!
                </p>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/practice-test" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-gray-300 hover:text-white">
                  <FileText className="h-5 w-5" />
                  <span>Full Practice Test</span>
                </Link>
                <Link href="/dashboard/glossary" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-gray-300 hover:text-white">
                  <BookOpen className="h-5 w-5" />
                  <span>Glossary</span>
                </Link>
                <Link href="/dashboard/exam-tips" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-gray-300 hover:text-white">
                  <Lightbulb className="h-5 w-5" />
                  <span>Exam Tips</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
