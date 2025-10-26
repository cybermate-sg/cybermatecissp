import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { domains, topics, decks, flashcards } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/domains/[domainId]/flashcards
 * Fetch all flashcards for a specific domain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { userId } = await auth();
    const { domainId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch domain with all its flashcards
    const domain = await db.query.domains.findFirst({
      where: eq(domains.id, domainId),
      with: {
        topics: {
          orderBy: [asc(topics.order)],
          with: {
            decks: {
              orderBy: [asc(decks.order)],
              where: eq(decks.isPremium, false), // TODO: Check user subscription for premium access
              with: {
                flashcards: {
                  orderBy: [asc(flashcards.order)],
                  where: eq(flashcards.isPublished, true),
                },
              },
            },
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Flatten all flashcards from all topics and decks
    const allFlashcards = domain.topics.flatMap((topic) =>
      topic.decks.flatMap((deck) =>
        deck.flashcards.map((card) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          difficulty: card.difficulty,
          deckId: deck.id,
          deckName: deck.name,
          topicName: topic.name,
        }))
      )
    );

    return NextResponse.json({
      domain: {
        id: domain.id,
        name: domain.name,
        description: domain.description,
      },
      flashcards: allFlashcards,
      totalCards: allFlashcards.length,
    });

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}
