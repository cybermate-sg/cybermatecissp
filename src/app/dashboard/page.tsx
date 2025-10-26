import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { domains, userCardProgress, flashcards, topics, decks } from "@/lib/db/schema";
import { eq, and, sql, asc, inArray } from "drizzle-orm";

const DOMAIN_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-indigo-500"
];

export default async function DashboardPage() {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const hasPaidPlan = has({ plan: 'paid' });

  // Fetch all domains with their flashcard counts
  const allDomains = await db.query.domains.findMany({
    orderBy: [asc(domains.order)],
    with: {
      topics: {
        orderBy: [asc(topics.order)],
        with: {
          decks: {
            orderBy: [asc(decks.order)],
            with: {
              flashcards: {
                where: eq(flashcards.isPublished, true),
              },
            },
          },
        },
      },
    },
  });

  // Calculate total flashcard count and progress for each domain
  const domainsWithProgress = await Promise.all(
    allDomains.map(async (domain) => {
      const flashcardIds = domain.topics.flatMap((topic) =>
        topic.decks.flatMap((deck) => deck.flashcards.map((card) => card.id))
      );

      const totalCards = flashcardIds.length;

      // Get user's progress for this domain
      let progress = 0;
      if (totalCards > 0 && flashcardIds.length > 0) {
        const progressRecords = await db
          .select()
          .from(userCardProgress)
          .where(
            and(
              eq(userCardProgress.clerkUserId, userId),
              inArray(userCardProgress.flashcardId, flashcardIds)
            )
          );

        progress = Math.round((progressRecords.length / totalCards) * 100);
      }

      return {
        id: domain.id,
        order: domain.order,
        name: domain.name,
        description: domain.description,
        cardCount: totalCards,
        color: DOMAIN_COLORS[domain.order - 1] || "bg-blue-500",
        progress,
      };
    })
  );

  const totalCards = domainsWithProgress.reduce((sum, domain) => sum + domain.cardCount, 0);

  // Get user's overall studied cards count
  const [studiedCardsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userCardProgress)
    .where(eq(userCardProgress.clerkUserId, userId));

  const studiedCards = studiedCardsResult?.count || 0;
  const overallProgress = totalCards > 0 ? Math.round((studiedCards / totalCards) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            CISSP Mastery Dashboard
          </h1>
          <p className="text-gray-300">
            Master all 8 domains with confidence-based learning
          </p>
        </div>

        {/* Free User Banner */}
        {!hasPaidPlan && (
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Unlock Full Access
                </h3>
                <p className="text-purple-100">
                  Get unlimited access to 1000+ flashcards and advanced features
                </p>
              </div>
              <Link
                href="/pricing"
                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 rounded-full transition-colors whitespace-nowrap"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {hasPaidPlan ? totalCards : '10'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Across 8 domains
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">
                Cards Studied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{studiedCards}</div>
              <p className="text-xs text-gray-400 mt-1">
                Keep going!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{overallProgress}%</div>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* CISSP Domains */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Study by Domain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domainsWithProgress.map((domain) => (
              <Link
                key={domain.id}
                href={`/dashboard/domain/${domain.id}`}
                className="group"
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all hover:border-purple-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${domain.color}`}></div>
                          <Badge variant="secondary" className="text-xs">
                            Domain {domain.order}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-white group-hover:text-purple-400 transition-colors">
                          {domain.name}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-gray-400 text-sm mt-2">
                      {domain.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {hasPaidPlan ? domain.cardCount : '10'} cards
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress value={domain.progress} className="w-20" />
                        <span className="text-sm text-gray-400">
                          {domain.progress}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Study Tips */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Study Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Study consistently - 20-30 minutes daily is better than cramming</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Be honest with confidence ratings - this helps optimize your learning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Focus on understanding concepts, not just memorization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Review cards you rated low more frequently</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
