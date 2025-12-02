import { useState, useMemo, useCallback } from "react";
import type { ClassData } from "@/lib/api/class-server";

export function useDeckSelection(decks: ClassData['decks']) {
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());

  const flashcardDecks = useMemo(
    () => decks.filter(d => d.type === 'flashcard'),
    [decks]
  );

  const toggleDeckSelection = useCallback((deckId: string) => {
    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deckId)) {
        newSet.delete(deckId);
      } else {
        newSet.add(deckId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const flashcardDeckIds = flashcardDecks.map(d => d.id);
    const allSelected = flashcardDeckIds.every(id => selectedDecks.has(id));

    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      flashcardDeckIds.forEach(id => allSelected ? newSet.delete(id) : newSet.add(id));
      return newSet;
    });
  }, [selectedDecks, flashcardDecks]);

  const allFlashcardsSelected = useMemo(() => {
    if (flashcardDecks.length === 0) return false;
    return flashcardDecks.every(d => selectedDecks.has(d.id));
  }, [selectedDecks, flashcardDecks]);

  const decksToStudy = useMemo(() =>
    selectedDecks.size > 0
      ? decks.filter(d => selectedDecks.has(d.id))
      : decks,
    [selectedDecks, decks]
  );

  return {
    selectedDecks,
    flashcardDecks,
    toggleDeckSelection,
    toggleSelectAll,
    allFlashcardsSelected,
    decksToStudy,
  };
}
