"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Check, ChevronDown, ChevronUp } from "lucide-react";

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

const getColorClass = (color: string | null) => {
  const colorMap: { [key: string]: string } = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
  };
  return colorMap[color || "purple"] || "bg-purple-500";
};

export default function SessionSelector({ classes, userId }: SessionSelectorProps) {
  const router = useRouter();
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [isStarting, setIsStarting] = useState(false);

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
        // Remove all decks from this class
        const classDecks = classes.find(c => c.id === classId)?.decks || [];
        setSelectedDecks(prevDecks => {
          const newDecks = new Set(prevDecks);
          classDecks.forEach(deck => newDecks.delete(deck.id));
          return newDecks;
        });
      } else {
        newSet.add(classId);
        // Add all decks from this class
        const classDecks = classes.find(c => c.id === classId)?.decks || [];
        setSelectedDecks(prevDecks => {
          const newDecks = new Set(prevDecks);
          classDecks.forEach(deck => newDecks.add(deck.id));
          return newDecks;
        });
      }
      return newSet;
    });
  };

  const toggleDeck = (classId: string, deckId: string) => {
    setSelectedDecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deckId)) {
        newSet.delete(deckId);
        // Check if all decks from this class are deselected
        const classDecks = classes.find(c => c.id === classId)?.decks || [];
        const hasAnySelected = classDecks.some(deck => newSet.has(deck.id));
        if (!hasAnySelected) {
          setSelectedClasses(prevClasses => {
            const newClasses = new Set(prevClasses);
            newClasses.delete(classId);
            return newClasses;
          });
        }
      } else {
        newSet.add(deckId);
        // Check if all decks from this class are now selected
        const classDecks = classes.find(c => c.id === classId)?.decks || [];
        const allSelected = classDecks.every(deck => newSet.has(deck.id) || deck.id === deckId);
        if (allSelected) {
          setSelectedClasses(prevClasses => new Set(prevClasses).add(classId));
        }
      }
      return newSet;
    });
  };

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
    if (selectedDecks.size === 0) {
      return;
    }

    setIsStarting(true);

    try {
      // Create a new session
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deckIds: Array.from(selectedDecks),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const { sessionId } = await response.json();

      // Navigate to the study session
      router.push(`/dashboard/session/${sessionId}/study?decks=${Array.from(selectedDecks).join(',')}`);
    } catch (error) {
      console.error('Error starting session:', error);
      setIsStarting(false);
      alert('Failed to start session. Please try again.');
    }
  };

  const totalSelectedCards = classes.reduce((sum, cls) => {
    return sum + cls.decks
      .filter(deck => selectedDecks.has(deck.id))
      .reduce((deckSum, deck) => deckSum + deck.cardCount, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Session Summary</h3>
              <p className="text-sm text-gray-400">
                {selectedDecks.size} deck{selectedDecks.size !== 1 ? 's' : ''} selected • {totalSelectedCards} card{totalSelectedCards !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={startSession}
              disabled={selectedDecks.size === 0 || isStarting}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Play className="w-5 h-5 mr-2 fill-white" />
              {isStarting ? 'Starting...' : 'Start Session'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Class Selection */}
      <div className="space-y-4">
        {classes.map((cls) => {
          const isClassSelected = selectedClasses.has(cls.id);
          const isExpanded = expandedClasses.has(cls.id);
          const selectedDeckCount = cls.decks.filter(deck => selectedDecks.has(deck.id)).length;

          return (
            <Card
              key={cls.id}
              className={`bg-slate-800/50 border-2 transition-all ${
                isClassSelected
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleClass(cls.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        isClassSelected
                          ? 'bg-blue-500'
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      {isClassSelected && <Check className="w-6 h-6 text-white" />}
                    </button>

                    {/* Class Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {cls.icon && <span className="text-2xl">{cls.icon}</span>}
                        <div className={`w-3 h-3 rounded-full ${getColorClass(cls.color)}`}></div>
                      </div>
                      <CardTitle className="text-lg text-white mb-1">{cls.name}</CardTitle>
                      <p className="text-sm text-gray-400">
                        {cls.decks.length} deck{cls.decks.length !== 1 ? 's' : ''} • {cls.totalCards} card{cls.totalCards !== 1 ? 's' : ''}
                        {selectedDeckCount > 0 && ` • ${selectedDeckCount} selected`}
                      </p>
                      <div className="mt-2">
                        <Progress value={cls.progress} className="h-2" aria-label={`${cls.name} progress`} />
                      </div>
                    </div>

                    {/* Expand Button */}
                    {cls.decks.length > 0 && (
                      <button
                        onClick={() => toggleExpanded(cls.id)}
                        className="p-2 rounded-full hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Deck List (Expanded) */}
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-2 pl-14">
                    {cls.decks.map((deck) => {
                      const isDeckSelected = selectedDecks.has(deck.id);
                      return (
                        <button
                          key={deck.id}
                          onClick={() => toggleDeck(cls.id, deck.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isDeckSelected
                              ? 'bg-blue-500/20 border-2 border-blue-500'
                              : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                            isDeckSelected
                              ? 'bg-blue-500'
                              : 'bg-slate-600 border border-slate-500'
                          }`}>
                            {isDeckSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-white">{deck.name}</p>
                            <p className="text-xs text-gray-400">{deck.cardCount} cards</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
