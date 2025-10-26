import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { domains, topics, decks } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/domains
 * Fetch all CISSP domains with their topics and total card counts
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all domains with their topics and decks
    const allDomains = await db.query.domains.findMany({
      orderBy: [asc(domains.order)],
      with: {
        topics: {
          orderBy: [asc(topics.order)],
          with: {
            decks: {
              orderBy: [asc(decks.order)],
            },
          },
        },
      },
    });

    // Calculate total card count for each domain
    const domainsWithStats = allDomains.map((domain) => {
      const totalCards = domain.topics.reduce((sum, topic) => {
        return sum + topic.decks.reduce((deckSum, deck) => deckSum + deck.cardCount, 0);
      }, 0);

      return {
        id: domain.id,
        name: domain.name,
        description: domain.description,
        order: domain.order,
        icon: domain.icon,
        cardCount: totalCards,
        createdAt: domain.createdAt,
      };
    });

    return NextResponse.json({ domains: domainsWithStats });

  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}
