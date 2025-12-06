import { useMemo } from "react";
import type { Deck } from "@/lib/api/class-server";
import {
  extractDomainFromDeckName,
  extractDayNumberFromDeckName,
  getDomainInfo
} from "@/lib/utils/cissp-domains";

export interface EnrichedDeck extends Deck {
  domain: string | null;
  domainName?: string;
  dayNumber: number;
}

export function useDeckCategories(decks: Deck[]) {
  // Enrich decks with domain and day information
  const enrichedDecks = useMemo<EnrichedDeck[]>(() => {
    return decks.map(deck => {
      const domain = extractDomainFromDeckName(deck.name);
      const domainInfo = domain ? getDomainInfo(domain) : null;
      const dayNumber = extractDayNumberFromDeckName(deck.name) || deck.order + 1;

      return {
        ...deck,
        domain,
        domainName: domainInfo?.shortName,
        dayNumber,
      };
    });
  }, [decks]);

  // Find recommended deck (lowest progress, not mastered)
  const recommendedDeck = useMemo(() => {
    const notMastered = enrichedDecks.filter(d => d.progress < 90 && d.type === 'flashcard');
    return notMastered.length > 0
      ? notMastered.reduce((min, deck) => deck.progress < min.progress ? deck : min)
      : null;
  }, [enrichedDecks]);

  // Split decks into three categories
  const structuredPlanDecks = useMemo(() => {
    return enrichedDecks.filter(d => {
      const hasDay = d.name.toLowerCase().includes('day ');
      return hasDay && d.type === 'flashcard';
    });
  }, [enrichedDecks]);

  const extraDecks = useMemo(() => {
    return enrichedDecks.filter(d => {
      const hasDay = d.name.toLowerCase().includes('day ');
      return !hasDay && d.type === 'flashcard';
    });
  }, [enrichedDecks]);

  const practiceDecks = useMemo(() => {
    return enrichedDecks.filter(d => d.type === 'quiz');
  }, [enrichedDecks]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    return {
      all: enrichedDecks.length,
      notStarted: enrichedDecks.filter(d => d.progress === 0).length,
      inProgress: enrichedDecks.filter(d => d.progress > 0 && d.progress < 90).length,
      mastered: enrichedDecks.filter(d => d.progress >= 90).length,
      quiz: enrichedDecks.filter(d => d.type === 'quiz').length,
    };
  }, [enrichedDecks]);

  return {
    enrichedDecks,
    recommendedDeck,
    structuredPlanDecks,
    extraDecks,
    practiceDecks,
    filterCounts,
  };
}
