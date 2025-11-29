import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Play, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DeckCardProps {
  deck: {
    id: string;
    name: string;
    description: string | null;
    cardCount: number;
    studiedCount: number;
    progress: number;
  };
  isSelected: boolean;
  onToggleSelection: (deckId: string) => void;
  classId: string;
  isAdmin: boolean;
}

const DeckCard = memo(({ deck, isSelected, onToggleSelection, classId, isAdmin }: DeckCardProps) => {
  return (
    <Card
      onClick={() => onToggleSelection(deck.id)}
      className={`cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-slate-200 hover:shadow-md'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500'
                : 'bg-slate-200'
            }`}>
              <Check className={`w-6 h-6 ${
                isSelected ? 'text-white' : 'text-slate-600'
              }`} />
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex-shrink-0">
            <div className="text-2xl font-bold text-slate-800">
              {deck.progress}%
            </div>
          </div>

          {/* Deck Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              {deck.name}
            </h3>
            <p className="text-sm text-slate-600">
              {deck.studiedCount} of {deck.cardCount} unique cards studied
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Link href={`/dashboard/deck/${deck.id}?mode=progressive`}>
              <Button size="sm" variant="outline" className="rounded-full">
                <Play className="w-4 h-4 fill-current" />
              </Button>
            </Link>
            {isAdmin && (
              <Link href={`/admin/classes/${classId}/decks/${deck.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Pencil className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={deck.progress} className="h-2" aria-label={`${deck.name} progress`} />
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.deck.id === nextProps.deck.id &&
    prevProps.deck.progress === nextProps.deck.progress &&
    prevProps.deck.studiedCount === nextProps.deck.studiedCount &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});

DeckCard.displayName = 'DeckCard';

export default DeckCard;
