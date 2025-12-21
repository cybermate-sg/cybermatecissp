import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { db, withRetry } from "@/lib/db";
import { classes, userCardProgress, flashcards, decks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Bookmark, ClipboardCheck } from "lucide-react";
import { cache } from "react";
import { hasPaidAccess } from "@/lib/subscription";

// PERFORMANCE: Cache the classes query (changes rarely, no user-specific data)
// This reduces database load significantly for concurrent users
const getCachedClasses = cache(async () => {
  return withRetry(
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
    { queryName: 'dashboard-fetch-all-classes-cached' }
  );
});


export default async function DashboardPage() {
  // PERFORMANCE: Optimize Clerk calls - only fetch what we need
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const hasPaidPlan = await hasPaidAccess();

  // PERFORMANCE: Fetch user in parallel with database queries (not blocking)
  // This reduces total wait time significantly
  const [user, allClasses, allProgressRecords] = await Promise.all([
    // Fetch user info (for firstName)
    currentUser(),
    // Query 1: Fetch all classes with their decks and flashcard IDs (CACHED)
    getCachedClasses(),
    // Query 2: Batch fetch ALL user progress in a single query
    withRetry(
      () =>
        db
          .select()
          .from(userCardProgress)
          .where(eq(userCardProgress.clerkUserId, userId)),
      { queryName: 'dashboard-all-user-progress' }
    ),
  ]);

  const userName = user?.firstName || "there";

  // Create a Set for O(1) lookup of studied flashcard IDs
  const studiedFlashcardIds = new Set(
    allProgressRecords.map((record) => record.flashcardId)
  );

  // Calculate total flashcard count and progress for each class
  // Process in-memory without additional database queries
  const classesWithProgress = allClasses.map((cls) => {
    const flashcardIds = cls.decks.flatMap((deck) =>
      deck.flashcards.map((card) => card.id)
    );

    const totalCards = flashcardIds.length;
    const deckCount = cls.decks.length;

    // Calculate progress using the in-memory Set (O(1) lookups)
    let progress = 0;
    let studiedCount = 0;
    if (totalCards > 0) {
      studiedCount = flashcardIds.filter((id) => studiedFlashcardIds.has(id)).length;
      // For free users, cap the total cards used in progress calculation
      const effectiveTotalCards = hasPaidPlan ? totalCards : Math.min(totalCards, 10);
      const effectiveProgressCount = Math.min(studiedCount, effectiveTotalCards);
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
  });

  const totalCards = classesWithProgress.reduce((sum, cls) => sum + cls.cardCount, 0);

  // OPTIMIZATION: Use already-fetched progress data instead of another query
  const studiedCards = allProgressRecords.length;

  // For free users, limit the total cards displayed and used in calculations
  const displayTotalCards = hasPaidPlan ? totalCards : Math.min(totalCards, 10);
  // Cap studied cards at display total to prevent progress > 100%
  const effectiveStudiedCards = Math.min(studiedCards, displayTotalCards);
  const overallProgress = displayTotalCards > 0 ? Math.round((effectiveStudiedCards / displayTotalCards) * 100) : 0;

  // Determine which class to continue with
  // Priority: First in-progress class (0% < progress < 100%), or first class overall
  const continueClass = classesWithProgress.find(cls => cls.progress > 0 && cls.progress < 100) || classesWithProgress[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-300 text-lg">
            Let&apos;s continue your journey to becoming a CISSP.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* CISSP Program Progress Card */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">CISSP in 50 Days Program</h2>
                    <p className="text-sm text-gray-500">
                      {effectiveStudiedCards}/{displayTotalCards} Cards Studied
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{overallProgress}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={overallProgress} className="h-3 flex-1" aria-label="Overall study progress" />
                  {continueClass && (
                    <Link href={`/dashboard/class/${continueClass.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                        Continue
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/bookmarks" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                    <Bookmark className="mr-2 h-4 w-4" />
                    My Bookmarks
                  </Button>
                </Link>
                <Link href="/dashboard/practice" className="block">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 justify-start">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Take practice quiz test
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
