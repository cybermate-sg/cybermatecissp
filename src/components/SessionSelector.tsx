"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SummaryCard } from "./SessionSelector/SummaryCard";
import { ClassCard } from "./SessionSelector/ClassCard";

interface Deck {
  id: string;
  name: string;
  cardCount: number;
}

interface ClassWithProgress {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  totalCards: number;
  studiedCount: number;
  progress: number;
  decks: Deck[];
}

interface SessionSelectorProps {
  classes: ClassWithProgress[];
  userId: string;
}

function getClassDecks(classes: ClassWithProgress[], classId: string): Deck[] {
  return classes.find(c => c.id === classId)?.decks || [];
}

function toggleDecksInSet(deckSet: Set<string>, decks: Deck[], add: boolean): Set<string> {
  const newSet = new Set(deckSet);
  decks.forEach(deck => add ? newSet.add(deck.id) : newSet.delete(deck.id));
  return newSet;
}

function hasAnyDeckSelected(deckSet: Set<string>, decks: Deck[]): boolean {
  return decks.some(deck => deckSet.has(deck.id));
}

function areAllDecksSelected(
  deckSet: Set<string>,
  decks: Deck[],
  includingDeckId?: string
): boolean {
  return decks.every(deck => deckSet.has(deck.id) || deck.id === includingDeckId);
}

function calculateTotalCards(classes: ClassWithProgress[], selectedDecks: Set<string>): number {
  return classes.reduce((sum, cls) => {
    return sum + cls.decks
      .filter(deck => selectedDecks.has(deck.id))
      .reduce((deckSum, deck) => deckSum + deck.cardCount, 0);
  }, 0);
}

async function createSession(userId: string, deckIds: string[]): Promise<string> {
  const response = await fetch('/api/sessions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, deckIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to create session');
  }

  const { sessionId } = await response.json();
  return sessionId;
}

function useClassSelection(classes: ClassWithProgress[]) {
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      const classDecks = getClassDecks(classes, classId);
      const isAdding = !newSet.has(classId);

      if (isAdding) {
        newSet.add(classId);
      } else {
        newSet.delete(classId);
      }
      setSelectedDecks(prevDecks => toggleDecksInSet(prevDecks, classDecks, isAdding));
      return newSet;
    });
  };

  const toggleDeck = (classId: string, deckId: string) => {
    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      const classDecks = getClassDecks(classes, classId);

      if (newSet.has(deckId)) {
        newSet.delete(deckId);
        if (!hasAnyDeckSelected(newSet, classDecks)) {
          setSelectedClasses(prevClasses => {
            const newClasses = new Set(prevClasses);
            newClasses.delete(classId);
            return newClasses;
          });
        }
      } else {
        newSet.add(deckId);
        if (areAllDecksSelected(newSet, classDecks, deckId)) {
          setSelectedClasses(prevClasses => new Set(prevClasses).add(classId));
        }
      }

      return newSet;
    });
  };

  return { selectedClasses, selectedDecks, toggleClass, toggleDeck };
}

export default function SessionSelector({ classes, userId }: SessionSelectorProps) {
  const router = useRouter();
  const { selectedClasses, selectedDecks, toggleClass, toggleDeck } = useClassSelection(classes);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [isStarting, setIsStarting] = useState(false);

  const toggleExpanded = (classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const startSession = async () => {
    if (selectedDecks.size === 0) return;

    setIsStarting(true);
    try {
      const sessionId = await createSession(userId, Array.from(selectedDecks));
      router.push(`/dashboard/session/${sessionId}/study?decks=${Array.from(selectedDecks).join(',')}`);
    } catch (error) {
      console.error('Error starting session:', error);
      setIsStarting(false);
      alert('Failed to start session. Please try again.');
    }
  };

  const totalSelectedCards = calculateTotalCards(classes, selectedDecks);

  return (
    <div className="space-y-6">
      <SummaryCard
        selectedDecksCount={selectedDecks.size}
        totalSelectedCards={totalSelectedCards}
        isStarting={isStarting}
        onStartSession={startSession}
      />

      <div className="space-y-4">
        {classes.map((cls) => (
          <ClassCard
            key={cls.id}
            classData={{
              id: cls.id,
              name: cls.name,
              description: cls.description,
              icon: cls.icon,
              color: cls.color,
              totalCards: cls.totalCards,
              progress: cls.progress,
              decks: cls.decks,
            }}
            selectionState={{
              isSelected: selectedClasses.has(cls.id),
              isExpanded: expandedClasses.has(cls.id),
              selectedDeckCount: cls.decks.filter(deck => selectedDecks.has(deck.id)).length,
              selectedDecks: selectedDecks,
            }}
            handlers={{
              onToggleClass: () => toggleClass(cls.id),
              onToggleExpand: () => toggleExpanded(cls.id),
              onToggleDeck: (deckId) => toggleDeck(cls.id, deckId),
            }}
          />
        ))}
      </div>
    </div>
  );
}
