"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, Check } from "lucide-react";
import type { ClassData } from "@/lib/api/class-server";

// Lazy load Dialog for better initial bundle size
const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.Dialog })), {
  ssr: false,
});
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogContent })), {
  ssr: false,
});
const DialogDescription = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogDescription })), {
  ssr: false,
});
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogHeader })), {
  ssr: false,
});
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogTitle })), {
  ssr: false,
});

type StudyMode = "progressive" | "random";

interface ClassDetailClientProps {
  classData: ClassData;
  isAdmin: boolean;
}

export default function ClassDetailClient({ classData }: ClassDetailClientProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>("progressive");
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());
  const [showModeInfo, setShowModeInfo] = useState(false);

  const decks = classData.decks;

  // Memoized calculations
  const totalCards = useMemo(() => decks.reduce((sum, deck) => sum + deck.cardCount, 0), [decks]);
  const totalStudied = useMemo(() => decks.reduce((sum, deck) => sum + deck.studiedCount, 0), [decks]);
  const overallProgress = useMemo(
    () => totalCards > 0 ? Math.round((totalStudied / totalCards) * 100) : 0,
    [totalCards, totalStudied]
  );

  // Handle deck selection toggle - memoized to prevent re-renders
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

  // Toggle select all decks - memoized with decks dependency
  const toggleSelectAll = useCallback(() => {
    if (selectedDecks.size === decks.length) {
      setSelectedDecks(new Set());
    } else {
      setSelectedDecks(new Set(decks.map(d => d.id)));
    }
  }, [selectedDecks.size, decks]);

  const allSelected = selectedDecks.size === decks.length && decks.length > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Class Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {classData.name}
        </h1>

        {/* Overall Progress Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-300">Overall Progress</h3>
              <span className="text-2xl font-bold text-blue-400">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 mb-2" />
            <p className="text-sm text-gray-400">
              {totalStudied} of {totalCards} unique cards studied
            </p>
          </CardContent>
        </Card>

        {/* Study Mode Toggle & Study Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          {/* Study Mode Selector */}
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setStudyMode("progressive")}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                studyMode === "progressive"
                  ? "bg-slate-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              PROGRESSIVE
            </button>
            <button
              onClick={() => setStudyMode("random")}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                studyMode === "random"
                  ? "bg-slate-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              RANDOM
            </button>
          </div>

          {/* Mode Info Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModeInfo(true)}
            className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            What&apos;s this?
          </Button>

          {/* Select All Button */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-colors text-gray-300 hover:text-white"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              allSelected ? 'bg-blue-500' : 'bg-slate-700 border border-slate-600'
            }`}>
              {allSelected && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-sm font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </button>
        </div>

        {/* Study Button */}
        <Link
          href={
            selectedDecks.size > 0
              ? `/dashboard/class/${classData.id}/study?mode=${studyMode}&decks=${Array.from(selectedDecks).join(',')}`
              : `/dashboard/class/${classData.id}/study?mode=${studyMode}`
          }
        >
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-6"
          >
            <Play className="w-5 h-5 mr-2 fill-white" />
            {selectedDecks.size > 0
              ? `STUDY (${selectedDecks.size} ${selectedDecks.size === 1 ? 'Deck' : 'Decks'})`
              : 'STUDY'
            }
          </Button>
        </Link>
      </div>

      {/* Deck List */}
      <div>
        {decks.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12">
              <div className="text-center text-gray-400">
                No decks available in this class yet.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => {
              const isSelected = selectedDecks.has(deck.id);
              return (
                <Card
                  key={deck.id}
                  onClick={() => toggleDeckSelection(deck.id)}
                  className={`cursor-pointer transition-all border-2 bg-slate-800/50 ${
                    isSelected
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 hover:border-slate-600 hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Selection Checkbox */}
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-500'
                            : 'bg-slate-700 border border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="flex-shrink-0">
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {deck.progress}%
                        </div>
                      </div>

                      {/* Deck Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                          {deck.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {deck.studiedCount} of {deck.cardCount} unique cards studied
                        </p>
                      </div>

                      {/* Quick Play Button */}
                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/dashboard/deck/${deck.id}?mode=${studyMode}`}>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 p-0"
                          >
                            <Play className="w-4 h-4 fill-white" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <Progress value={deck.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Study Mode Info Dialog */}
      <Dialog open={showModeInfo} onOpenChange={setShowModeInfo}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Study Modes</DialogTitle>
            <DialogDescription className="space-y-4 pt-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-1">Progressive Mode</h4>
                <p className="text-sm">
                  Focuses on cards that need the most attention. Shows cards with low confidence
                  ratings or those due for review based on spaced repetition.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Random Mode</h4>
                <p className="text-sm">
                  Cards are shuffled randomly to test your knowledge in an unpredictable order.
                  Perfect for simulating exam conditions.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
