import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { classes, decks, flashcards, userCardProgress } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import SessionSelector from "@/components/SessionSelector";
import { ensureUserExists } from "@/lib/db/ensure-user";

export default async function NewSessionPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in database (fallback if webhook failed)
  await ensureUserExists(userId);

  // PERFORMANCE: Fetch classes and all user progress in parallel (async-parallel rule)
  const [allClasses, allProgressRecords] = await Promise.all([
    // Query 1: Fetch all classes with their decks and flashcards
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
              columns: { id: true }, // Only load ID to minimize memory
            },
          },
        },
      },
    }),
    // Query 2: Batch fetch ALL user progress in a single query (fixes N+1)
    db
      .select({ flashcardId: userCardProgress.flashcardId })
      .from(userCardProgress)
      .where(eq(userCardProgress.clerkUserId, userId)),
  ]);

  // Create a Set for O(1) lookup of studied flashcard IDs (js-set-map-lookups rule)
  const studiedFlashcardIds = new Set(
    allProgressRecords.map((record) => record.flashcardId)
  );

  // Calculate progress for each class in-memory (no additional DB queries)
  const classesWithProgress = allClasses.map((cls) => {
    const flashcardIds = cls.decks.flatMap((deck) =>
      deck.flashcards.map((card) => card.id)
    );

    const totalCards = flashcardIds.length;

    // Calculate progress using the in-memory Set (O(1) lookups)
    const studiedCount = flashcardIds.filter((id) => studiedFlashcardIds.has(id)).length;
    const progress = totalCards > 0 ? Math.round((studiedCount / totalCards) * 100) : 0;

    return {
      id: cls.id,
      name: cls.name,
      description: cls.description,
      icon: cls.icon,
      color: cls.color,
      totalCards,
      studiedCount,
      progress,
      decks: cls.decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        cardCount: deck.flashcards.length,
      })),
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-slate-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Start a New Study Session
          </h1>
          <p className="text-gray-300">
            Select which classes or decks you want to study in this session
          </p>
        </div>

        <SessionSelector classes={classesWithProgress} userId={userId} />
      </div>
    </div>
  );
}
