import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Layers, ClipboardList, Edit2, Trash2 } from "lucide-react";
import { FormattedContent } from "@/components/admin/FormattedContent";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  type: 'flashcard' | 'quiz';
  cardCount: number;
  order: number;
  isPremium: boolean;
  isPublished: boolean;
}

interface DeckListItemProps {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
}

export function DeckListItem({ deck, onEdit, onDelete }: DeckListItemProps) {
  return (
    <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Deck Type Icon */}
          <div className="flex-shrink-0 mt-1">
            {deck.type === 'quiz' ? (
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center" title="Quiz Deck">
                <ClipboardList className="w-5 h-5 text-blue-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center justify-center" title="Flashcard Deck">
                <Layers className="w-5 h-5 text-green-400" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white text-lg">
                {deck.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded border ${
                deck.type === 'quiz'
                  ? 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                  : 'bg-green-900/30 text-green-400 border-green-500/30'
              }`}>
                {deck.type === 'quiz' ? 'Quiz' : 'Flashcard'}
              </span>
              {!deck.isPublished && (
                <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                  Draft
                </span>
              )}
              {deck.isPremium && (
                <span className="text-xs px-2 py-1 rounded bg-amber-900/30 text-amber-400 border border-amber-500/30">
                  Premium
                </span>
              )}
            </div>
            {deck.description && (
              <div className="text-sm text-gray-300 mb-2">
                <FormattedContent
                  html={deck.description}
                  className="prose-p:my-0.5 prose-strong:text-gray-200 prose-headings:text-gray-200"
                />
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Order: {deck.order}</span>
              <span>•</span>
              <span>{deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/decks/${deck.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-gray-300 hover:bg-slate-700"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Cards
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(deck)}
            className="text-gray-300 hover:text-white hover:bg-slate-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(deck)}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
