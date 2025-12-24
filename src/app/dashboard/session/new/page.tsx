import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { classes, decks, flashcards, userCardProgress } from "@/lib/db/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
import SessionSelector from "@/components/SessionSelector";
import { ensureUserExists } from "@/lib/db/ensure-user";

export default async function NewSessionPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in database (fallback if webhook failed)
  await ensureUserExists(userId);

  // Fetch all classes with their decks and flashcards
  const allClasses = await db.query.classes.findMany({
    where: eq(classes.isPublished, true),
    orderBy: [asc(classes.order)],
    with: {
      decks: {
        where: eq(decks.isPublished, true),
        orderBy: [asc(decks.order)],
        with: {
          flashcards: {
            where: eq(flashcards.isPublished, true),
          },
        },
      },
    },
  });

  // Calculate progress for each class
  const classesWithProgress = await Promise.all(
    allClasses.map(async (cls) => {
      const flashcardIds = cls.decks.flatMap((deck) =>
        deck.flashcards.map((card) => card.id)
      );

      const totalCards = flashcardIds.length;

      // Get user's progress for this class
      let studiedCount = 0;
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

        studiedCount = progressRecords.length;
      }

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
        decks: cls.decks.map(deck => ({
          id: deck.id,
          name: deck.name,
          cardCount: deck.flashcards.length,
        })),
      };
    })
  );

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
