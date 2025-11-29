"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, Check, Layers, ClipboardList, HelpCircle } from "lucide-react";
import type { ClassData } from "@/lib/api/class-server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StudyMode = "progressive" | "random";

interface ClassDetailClientProps {
  classData: ClassData;
  isAdmin: boolean;
  userName: string;
  daysLeft: number | null;
}

export default function ClassDetailClient({ classData, userName, daysLeft }: ClassDetailClientProps) {
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

  // Get flashcard decks only (quiz decks can't be studied in class mode)
  const flashcardDecks = useMemo(() => decks.filter(d => d.type === 'flashcard'), [decks]);

  // Toggle select all flashcard decks - memoized with flashcardDecks dependency
  const toggleSelectAll = useCallback(() => {
    const flashcardDeckIds = flashcardDecks.map(d => d.id);
    const allFlashcardsSelected = flashcardDeckIds.every(id => selectedDecks.has(id));

    if (allFlashcardsSelected && flashcardDeckIds.length > 0) {
      // Deselect all flashcard decks (keep any quiz decks selected)
      setSelectedDecks(prev => {
        const newSet = new Set(prev);
        flashcardDeckIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all flashcard decks (keep any quiz decks selected)
      setSelectedDecks(prev => {
        const newSet = new Set(prev);
        flashcardDeckIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [selectedDecks, flashcardDecks]);

  const allFlashcardsSelected = useMemo(() => {
    if (flashcardDecks.length === 0) return false;
    return flashcardDecks.every(d => selectedDecks.has(d.id));
  }, [selectedDecks, flashcardDecks]);

  // Check deck types in selection
  const decksToStudy = selectedDecks.size > 0
    ? decks.filter(d => selectedDecks.has(d.id))
    : decks;
  const hasFlashcardDecks = decksToStudy.some(d => d.type === 'flashcard');
  const hasQuizDecks = decksToStudy.some(d => d.type === 'quiz');
  const onlyQuizDecks = !hasFlashcardDecks && hasQuizDecks;
  const hasBothTypes = hasFlashcardDecks && hasQuizDecks;

  // Get flashcard-only deck IDs for study route
  const flashcardDeckIds = decksToStudy
    .filter(d => d.type === 'flashcard')
    .map(d => d.id);

  // Get quiz deck names for info message
  const quizDeckNames = decksToStudy
    .filter(d => d.type === 'quiz')
    .map(d => d.name);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Class Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          CISSP in 50 Days Program
        </h1>
        {daysLeft !== null && (
          <p className="text-base text-gray-600 mb-6">
            Hi, <span className="text-blue-600 font-medium">{userName}</span>, you have{' '}
            <span className="text-gray-900 font-bold">{daysLeft}</span> days left
          </p>
        )}

        {/* Overall Progress Card */}
        <Card className="bg-white border-gray-200 mb-6 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Overall Progress</h2>
              <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 mb-3" aria-label={`${classData.name} overall progress`} />
            <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded inline-block">
              {totalStudied} of {totalCards} unique cards studied
            </p>
          </CardContent>
        </Card>

        {/* Study Mode Toggle & Study Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          {/* Study Mode Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setStudyMode("progressive")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                studyMode === "progressive"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              PROGRESSIVE
            </button>
            <button
              onClick={() => setStudyMode("random")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                studyMode === "random"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
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
            className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-1.5"
          >
            What&apos;s this?
            <HelpCircle className="w-4 h-4" />
          </Button>

          {/* Select All Button */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900 ml-auto"
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              allFlashcardsSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
            }`}>
              {allFlashcardsSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm font-medium">Select All</span>
          </button>
        </div>

        {/* Study Button */}
        {onlyQuizDecks ? (
          <div>
            <Button
              size="lg"
              disabled
              className="w-full bg-gray-400 text-white font-semibold text-base py-6 mb-2 cursor-not-allowed"
            >
              <Play className="w-5 h-5 mr-2 fill-white" />
              STUDY
            </Button>
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded mb-6 border border-amber-200">
              Quiz decks cannot be studied in class mode. Use the quick play button on each quiz deck to take the test.
            </p>
          </div>
        ) : (
          <div>
            <Link
              href={
                selectedDecks.size > 0 && flashcardDeckIds.length > 0
                  ? `/dashboard/class/${classData.id}/study?mode=${studyMode}&decks=${flashcardDeckIds.join(',')}`
                  : `/dashboard/class/${classData.id}/study?mode=${studyMode}`
              }
            >
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 mb-2"
              >
                <Play className="w-5 h-5 mr-2 fill-white" />
                STUDY
              </Button>
            </Link>
            {hasBothTypes && (
              <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded mb-6 border border-blue-200 flex items-start gap-2">
                <span className="text-blue-600 font-semibold flex-shrink-0">ℹ️</span>
                <span>
                  <strong>{flashcardDeckIds.length} flashcard deck{flashcardDeckIds.length !== 1 ? 's' : ''}</strong> will be studied.
                  Quiz deck{quizDeckNames.length !== 1 ? 's' : ''} ({quizDeckNames.join(', ')}) should be accessed via {quizDeckNames.length !== 1 ? 'their' : 'its'} quick play button.
                </span>
              </p>
            )}
            {!hasBothTypes && <div className="mb-6" />}
          </div>
        )}
      </div>

      {/* Deck List */}
      <div>
        {decks.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                No decks available in this class yet.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {decks.map((deck) => {
              const isSelected = selectedDecks.has(deck.id);
              return (
                <Card
                  key={deck.id}
                  className={`transition-all bg-white border shadow-sm ${
                    isSelected
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Selection Checkbox */}
                      <div
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => toggleDeckSelection(deck.id)}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      {/* Deck Type Icon */}
                      <div className="flex-shrink-0">
                        {deck.type === 'quiz' ? (
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center" title="Quiz Deck">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center" title="Flashcard Deck">
                            <Layers className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                      </div>

                      {/* Deck Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {deck.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            deck.type === 'quiz'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {deck.type === 'quiz' ? 'Quiz' : 'Flashcard'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {deck.studiedCount} of {deck.cardCount} unique cards studied
                        </p>
                      </div>

                      {/* Progress Percentage */}
                      <div className="flex-shrink-0">
                        <div className="text-2xl font-bold text-blue-600">
                          {deck.progress}%
                        </div>
                      </div>

                      {/* Quick Play Button */}
                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/dashboard/deck/${deck.id}?mode=${studyMode}`}>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 w-12 p-0"
                          >
                            <Play className="w-5 h-5 fill-white" />
                          </Button>
                        </Link>
                      </div>
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
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Study Modes</DialogTitle>
            <div className="space-y-4 pt-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Progressive Mode</h4>
                <p className="text-sm">
                  Focuses on cards that need the most attention. Shows cards with low confidence
                  ratings or those due for review based on spaced repetition.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Random Mode</h4>
                <p className="text-sm">
                  Cards are shuffled randomly to test your knowledge in an unpredictable order.
                  Perfect for simulating exam conditions.
                </p>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
