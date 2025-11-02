import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studySessions, decks, flashcards } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import StudySessionClient from "@/components/StudySessionClient";

export default async function StudySessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ decks?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id: sessionId } = await params;
  const { decks: deckIdsParam } = await searchParams;

  // Verify session belongs to user
  const [session] = await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.id, sessionId),
        eq(studySessions.clerkUserId, userId)
      )
    )
    .limit(1);

  if (!session) {
    redirect("/dashboard");
  }

  // Get deck IDs from query params
  const deckIds = deckIdsParam ? deckIdsParam.split(',') : session.deckId ? [session.deckId] : [];

  if (deckIds.length === 0) {
    redirect("/dashboard");
  }

  // Fetch all flashcards from selected decks
  const selectedDecks = await db.query.decks.findMany({
    where: inArray(decks.id, deckIds),
    with: {
      flashcards: {
        where: eq(flashcards.isPublished, true),
      },
    },
  });

  const allFlashcards = selectedDecks.flatMap(deck =>
    deck.flashcards.map(card => ({
      id: card.id,
      deckId: deck.id,
      deckName: deck.name,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation,
    }))
  );

  if (allFlashcards.length === 0) {
    redirect("/dashboard");
  }

  return (
    <StudySessionClient
      sessionId={sessionId}
      flashcards={allFlashcards}
      userId={userId}
    />
  );
}
