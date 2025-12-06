import { useMemo } from "react";
import type { DeckFilter } from "./FilterBar";

interface DeckWithProgress {
  id: string;
  progress: number;
  type: "flashcard" | "quiz";
}

export function useDeckFiltering<T extends DeckWithProgress>(
  decks: T[],
  activeFilter: DeckFilter,
  excludeDeckId?: string | null
) {
  return useMemo(() => {
    return decks.filter(deck => {
      // Exclude specified deck from the list
      if (excludeDeckId && deck.id === excludeDeckId) return false;

      if (activeFilter === "all") return true;
      if (activeFilter === "not-started") return deck.progress === 0;
      if (activeFilter === "in-progress") return deck.progress > 0 && deck.progress < 90;
      if (activeFilter === "mastered") return deck.progress >= 90;
      if (activeFilter === "quiz") return deck.type === 'quiz';
      return true;
    });
  }, [decks, activeFilter, excludeDeckId]);
}
