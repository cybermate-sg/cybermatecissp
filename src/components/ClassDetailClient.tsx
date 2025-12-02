"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { ClassData } from "@/lib/api/class-server";
import { ProgressCard } from "./ClassDetail/ProgressCard";
import { StudyModeSelector } from "./ClassDetail/StudyModeSelector";
import { StudyButton } from "./ClassDetail/StudyButton";
import { DeckListItem } from "./ClassDetail/DeckListItem";
import { StudyModeInfoDialog } from "./ClassDetail/StudyModeInfoDialog";
import { useDeckSelection } from "./ClassDetail/useDeckSelection";

type StudyMode = "progressive" | "random";

interface ClassDetailClientProps {
  classData: ClassData;
  isAdmin: boolean;
  userName: string;
  daysLeft: number | null;
}

export default function ClassDetailClient({ classData, userName, daysLeft }: ClassDetailClientProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>("progressive");
  const [showModeInfo, setShowModeInfo] = useState(false);

  const decks = classData.decks;
  const {
    selectedDecks,
    toggleDeckSelection,
    toggleSelectAll,
    allFlashcardsSelected,
    decksToStudy,
  } = useDeckSelection(decks);

  const totalCards = useMemo(() => decks.reduce((sum, deck) => sum + deck.cardCount, 0), [decks]);
  const totalStudied = useMemo(() => decks.reduce((sum, deck) => sum + deck.studiedCount, 0), [decks]);
  const overallProgress = useMemo(
    () => totalCards > 0 ? Math.round((totalStudied / totalCards) * 100) : 0,
    [totalCards, totalStudied]
  );

  const hasFlashcardDecks = decksToStudy.some(d => d.type === 'flashcard');
  const hasQuizDecks = decksToStudy.some(d => d.type === 'quiz');
  const onlyQuizDecks = !hasFlashcardDecks && hasQuizDecks;
  const hasBothTypes = hasFlashcardDecks && hasQuizDecks;

  const flashcardDeckIds = decksToStudy.filter(d => d.type === 'flashcard').map(d => d.id);
  const quizDeckNames = decksToStudy.filter(d => d.type === 'quiz').map(d => d.name);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <ProgressCard
          className={classData.name}
          overallProgress={overallProgress}
          totalStudied={totalStudied}
          totalCards={totalCards}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <StudyModeSelector
            mode={studyMode}
            onModeChange={setStudyMode}
            onShowInfo={() => setShowModeInfo(true)}
          />

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

        <StudyButton
          classId={classData.id}
          studyMode={studyMode}
          onlyQuizDecks={onlyQuizDecks}
          hasBothTypes={hasBothTypes}
          flashcardDeckIds={flashcardDeckIds}
          quizDeckNames={quizDeckNames}
        />
      </div>

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
            {decks.map((deck) => (
              <DeckListItem
                key={deck.id}
                deck={deck}
                isSelected={selectedDecks.has(deck.id)}
                studyMode={studyMode}
                onToggle={() => toggleDeckSelection(deck.id)}
              />
            ))}
          </div>
        )}
      </div>

      <StudyModeInfoDialog
        open={showModeInfo}
        onOpenChange={setShowModeInfo}
      />
    </div>
  );
}
