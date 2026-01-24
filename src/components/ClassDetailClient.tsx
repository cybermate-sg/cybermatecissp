"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ClassData } from "@/lib/api/class-server";
import { HeroSection } from "./ClassDetail/HeroSection";
import { StatsCard } from "./ClassDetail/StatsCard";
import { DomainMasteryBar } from "./ClassDetail/DomainMasteryBar";
import { FilterBar, type DeckFilter } from "./ClassDetail/FilterBar";
import { ModernDeckCard } from "./ClassDetail/ModernDeckCard";
import { ResumeStudyButton } from "./ClassDetail/ResumeStudyButton";
import { StudyModeSelector } from "./ClassDetail/StudyModeSelector";
import { StudyButton } from "./ClassDetail/StudyButton";
import { StudyModeInfoDialog } from "./ClassDetail/StudyModeInfoDialog";
import { DeckSection } from "./ClassDetail/DeckSection";
import { useDeckSelection } from "./ClassDetail/useDeckSelection";
import { useDeckCategories } from "./ClassDetail/useDeckCategories";
import { useDeckFiltering } from "./ClassDetail/useDeckFiltering";
import { calculateDomainProgress, calculateDomainQuizProgress } from "@/lib/utils/cissp-domains";

type StudyMode = "progressive" | "random";

interface ClassDetailClientProps {
  classData: ClassData;
  isAdmin: boolean;
  userName: string;
  daysLeft: number;
  userStats?: {
    streak: number;
    minutesToday: number;
    cardsToday: number;
    accuracy: number;
    last7DaysActivity: number[];
  };
}

// Helper: Calculate overall progress from decks
function calculateOverallProgress(decks: ClassData['decks']) {
  const totalCards = decks.reduce((sum, deck) => sum + deck.cardCount, 0);
  const totalStudied = decks.reduce((sum, deck) => sum + deck.studiedCount, 0);
  return totalCards > 0 ? Math.round((totalStudied / totalCards) * 100) : 0;
}

// Helper: Get study session configuration
function getStudySessionConfig(decksToStudy: ClassData['decks']) {
  const hasFlashcardDecks = decksToStudy.some(d => d.type === 'flashcard');
  const hasQuizDecks = decksToStudy.some(d => d.type === 'quiz');

  return {
    onlyQuizDecks: !hasFlashcardDecks && hasQuizDecks,
    hasBothTypes: hasFlashcardDecks && hasQuizDecks,
    flashcardDeckIds: decksToStudy.filter(d => d.type === 'flashcard').map(d => d.id),
    quizDeckNames: decksToStudy.filter(d => d.type === 'quiz').map(d => d.name),
  };
}

// Helper: Get resume study link
function getResumeStudyLink(
  recommendedDeck: { id: string } | null,
  decks: ClassData['decks'],
  studyMode: StudyMode
) {
  if (recommendedDeck) {
    return `/dashboard/deck/${recommendedDeck.id}?mode=${studyMode}`;
  }
  if (decks.length > 0) {
    return `/dashboard/deck/${decks[0].id}?mode=${studyMode}`;
  }
  return '#';
}

export default function ClassDetailClient({
  classData,
  userName,
  daysLeft,
  userStats = { streak: 0, minutesToday: 0, cardsToday: 0, accuracy: 0, last7DaysActivity: [0, 0, 0, 0, 0, 0, 0] }
}: ClassDetailClientProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>("progressive");
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DeckFilter>("all");
  const [structuredPlanExpanded, setStructuredPlanExpanded] = useState(true);
  const [extraDecksExpanded, setExtraDecksExpanded] = useState(true);
  const [practiceDecksExpanded, setPracticeDecksExpanded] = useState(true);

  const decks = classData.decks;
  const { selectedDecks, toggleDeckSelection, decksToStudy } = useDeckSelection(decks);

  // Calculate overall progress
  const overallProgress = useMemo(() => calculateOverallProgress(decks), [decks]);

  // Calculate domain mastery (flashcard and quiz progress separately)
  const flashcardDomainProgress = useMemo(() => calculateDomainProgress(decks), [decks]);
  const quizDomainProgress = useMemo(() => calculateDomainQuizProgress(decks), [decks]);
  const {
    recommendedDeck,
    structuredPlanDecks,
    extraDecks,
    practiceDecks,
    filterCounts,
  } = useDeckCategories(decks);

  // Apply filters (exclude recommended deck from regular lists to avoid duplication)
  const filteredStructuredDecks = useDeckFiltering(structuredPlanDecks, activeFilter, recommendedDeck?.id);
  const filteredExtraDecks = useDeckFiltering(extraDecks, activeFilter, recommendedDeck?.id);
  const filteredPracticeDecks = useDeckFiltering(practiceDecks, activeFilter);

  // Study session config
  const studyConfig = useMemo(() => getStudySessionConfig(decksToStudy), [decksToStudy]);

  // Resume study link
  const resumeStudyLink = useMemo(
    () => getResumeStudyLink(recommendedDeck, decks, studyMode),
    [recommendedDeck, decks, studyMode]
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <HeroSection
          userName={userName}
          daysLeft={daysLeft}
          overallProgress={overallProgress}
          className={classData.name}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Domain Mastery Bar */}
            <DomainMasteryBar
              flashcardProgress={flashcardDomainProgress}
              quizProgress={quizDomainProgress}
            />

            {/* Resume Study Button (Desktop) and Study Mode Selector */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <StudyModeSelector
                  mode={studyMode}
                  onModeChange={setStudyMode}
                  onShowInfo={() => setShowModeInfo(true)}
                />
              </div>
              <ResumeStudyButton
                href={resumeStudyLink}
                deckName={recommendedDeck?.name}
              />
            </div>

            {/* Study Button */}
            <StudyButton
              classId={classData.id}
              studyMode={studyMode}
              onlyQuizDecks={studyConfig.onlyQuizDecks}
              hasBothTypes={studyConfig.hasBothTypes}
              flashcardDeckIds={studyConfig.flashcardDeckIds}

            />

            {/* Filter Bar */}
            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={filterCounts}
            />

            {/* Recommended Deck (if exists and not filtered out) */}
            {recommendedDeck && activeFilter === "all" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">⭐</span> Recommended Next Deck
                </h2>
                <ModernDeckCard
                  deck={{ ...recommendedDeck, isRecommended: true }}
                  isSelected={selectedDecks.has(recommendedDeck.id)}
                  onToggle={() => toggleDeckSelection(recommendedDeck.id)}
                  studyMode={studyMode}
                />
              </div>
            )}

            {/* Structured Plan Section */}
            {structuredPlanDecks.length > 0 && (
              <DeckSection
                title="Your 50-Day Structured Plan"
                decks={filteredStructuredDecks}
                expansion={{
                  isExpanded: structuredPlanExpanded,
                  onToggle: () => setStructuredPlanExpanded(!structuredPlanExpanded),
                }}
                selection={{
                  selectedDecks,
                  onToggleDeck: toggleDeckSelection,
                }}
                filterConfig={{
                  studyMode,
                  recommendedDeckId: recommendedDeck?.id,
                  activeFilter,
                }}
              />
            )}

            {/* Decks Section (Extra flashcard decks without day numbers) */}
            {extraDecks.length > 0 && (
              <DeckSection
                title="Decks"
                decks={filteredExtraDecks}
                expansion={{
                  isExpanded: extraDecksExpanded,
                  onToggle: () => setExtraDecksExpanded(!extraDecksExpanded),
                }}
                selection={{
                  selectedDecks,
                  onToggleDeck: toggleDeckSelection,
                }}
                filterConfig={{
                  studyMode,
                  recommendedDeckId: recommendedDeck?.id,
                  activeFilter,
                }}
              />
            )}

            {/* Practice Section (Quiz decks) */}
            {practiceDecks.length > 0 && (
              <DeckSection
                title="Practice"
                decks={filteredPracticeDecks}
                expansion={{
                  isExpanded: practiceDecksExpanded,
                  onToggle: () => setPracticeDecksExpanded(!practiceDecksExpanded),
                }}
                selection={{
                  selectedDecks,
                  onToggleDeck: toggleDeckSelection,
                }}
                filterConfig={{
                  studyMode,
                  recommendedDeckId: recommendedDeck?.id,
                  activeFilter,
                }}
              />
            )}

            {/* No decks message */}
            {decks.length === 0 && (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-12 text-center text-gray-500">
                  No decks available in this class yet.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats Sidebar (Desktop only) */}
          <div className="hidden lg:block">
            <StatsCard
              streak={userStats.streak}
              minutesToday={userStats.minutesToday}
              cardsToday={userStats.cardsToday}
              accuracy={userStats.accuracy}
              last7DaysActivity={userStats.last7DaysActivity}
            />
          </div>
        </div>
      </div>

      {/* Study Mode Info Dialog */}
      <StudyModeInfoDialog
        open={showModeInfo}
        onOpenChange={setShowModeInfo}
      />
    </div>
  );
}
