import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ModernDeckCard } from "./ModernDeckCard";
import type { EnrichedDeck } from "./useDeckCategories";

type StudyMode = "progressive" | "random";

interface DeckSectionProps {
  title: string;
  decks: EnrichedDeck[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedDecks: Set<string>;
  onToggleDeck: (deckId: string) => void;
  studyMode: StudyMode;
  recommendedDeckId?: string | null;
  activeFilter: string;
}

export function DeckSection({
  title,
  decks,
  isExpanded,
  onToggleExpand,
  selectedDecks,
  onToggleDeck,
  studyMode,
  recommendedDeckId,
  activeFilter,
}: DeckSectionProps) {
  return (
    <div>
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between mb-4 text-left"
      >
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
          <span className="ml-3 text-sm font-normal text-gray-500">
            ({decks.length} decks)
          </span>
        </h2>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-gray-600" />
        ) : (
          <ChevronDown className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {decks.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="py-8 text-center text-gray-500">
                No decks match the current filter.
              </CardContent>
            </Card>
          ) : (
            decks.map((deck) => (
              <ModernDeckCard
                key={deck.id}
                deck={{
                  ...deck,
                  isRecommended: deck.id === recommendedDeckId && activeFilter !== "all",
                }}
                isSelected={selectedDecks.has(deck.id)}
                onToggle={() => onToggleDeck(deck.id)}
                studyMode={studyMode}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
