"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileCheck2 } from "lucide-react";
import ConfidenceRating from "@/components/ConfidenceRating";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { QuizModal } from "@/components/QuizModal";
import { DeckQuizModal } from "@/components/DeckQuizModal";
import { FlashcardDynamic as Flashcard } from "@/components/FlashcardDynamic";
import { StudyPageHeader } from "@/components/study/StudyPageHeader";
import { EmptyDeckState } from "@/components/study/EmptyDeckState";
import { DeckCompletionState } from "@/components/study/DeckCompletionState";
import { toast } from "sonner";
import { useDeckData } from "@/components/study/hooks/useDeckData";



const FLASHCARD_ID_PATTERN = /^[a-zA-Z0-9_\-]{1,128}$/;

export default function DeckStudyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const deckId = params.id as string;
  const mode = searchParams.get('mode') || 'all';

  const { deck, flashcards, loading } = useDeckData(deckId, mode);
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(new Set());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Session tracking for stats
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Deck quiz state
  const [showDeckQuizModal, setShowDeckQuizModal] = useState(false);
  const [deckHasQuiz, setDeckHasQuiz] = useState(false);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;



  // Check if deck has quiz on mount
  useEffect(() => {
    const checkDeckQuiz = async () => {
      if (!deckId) return;
      try {
        const res = await fetch(`/api/decks/${deckId}/has-quiz`);
        const data = await res.json();
        setDeckHasQuiz(data.hasQuiz);
      } catch (error) {
        console.error('Error checking deck quiz:', error);
      }
    };
    checkDeckQuiz();
  }, [deckId]);

  // Create study session when flashcards are loaded
  useEffect(() => {
    const createSession = async () => {
      if (flashcards.length === 0 || sessionId) return;

      try {
        const res = await fetch('/api/sessions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckIds: [deckId] }),
        });

        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
        } else {
          console.error('Failed to create study session');
        }
      } catch (error) {
        console.error('Error creating study session:', error);
      }
    };

    createSession();
  }, [flashcards.length, deckId, sessionId]);

  // End session when all cards studied
  useEffect(() => {
    const allCardsStudied = studiedCards.size === flashcards.length && flashcards.length > 0;

    if (allCardsStudied && sessionId && !sessionEnded) {
      const endSessionNow = async () => {
        try {
          setSessionEnded(true);
          await fetch('/api/sessions/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              cardsStudied: studiedCards.size,
            }),
          });
        } catch (error) {
          console.error('Error ending session:', error);
        }
      };
      endSessionNow();
    }
  }, [studiedCards.size, flashcards.length, sessionId, sessionEnded]);

  // Cleanup: End session on unmount
  useEffect(() => {
    return () => {
      if (sessionId && !sessionEnded && studiedCards.size > 0) {
        fetch('/api/sessions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            cardsStudied: studiedCards.size,
          }),
        }).catch(console.error);
      }
    };
  }, [sessionId, sessionEnded, studiedCards.size]);



  const handleRate = async (confidence: number) => {
    if (!currentCard) return;

    try {
      // Save to session cards table (for stats tracking)
      if (sessionId) {
        await fetch('/api/sessions/card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            flashcardId: currentCard.id,
            confidenceRating: confidence,
            responseTime: Math.floor((Date.now() - sessionStartTime) / 1000),
          }),
        });
      }

      // Save confidence rating to user card progress (for mastery tracking)
      const res = await fetch("/api/progress/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          confidenceLevel: confidence,
        }),
      });

      if (!res.ok) throw new Error("Failed to save progress");

      const newStudied = new Set(studiedCards);
      newStudied.add(currentIndex);
      setStudiedCards(newStudied);

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowRating(false);
      } else {
        // Completed all cards
        setShowRating(false);
      }
    } catch (error) {
      toast.error("Failed to save your rating");
      console.error("Error saving progress:", error);
    }
  };

  const handleFlip = () => {
    if (!showRating) {
      setTimeout(() => setShowRating(true), 300);
    }
  };

  const handleReset = () => {
    console.log('Reset Progress clicked - Before:', { currentIndex, studiedCardsSize: studiedCards.size });
    setCurrentIndex(0);
    setStudiedCards(new Set());
    setShowRating(false);
    toast.success("Progress reset! Starting from card 1");
    console.log('Reset Progress clicked - After: currentIndex set to 0, studiedCards cleared');
  };

  const handleTest = () => {
    setShowQuizModal(true);
  };

  const handleDeckTest = () => {
    setShowDeckQuizModal(true);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowRating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowRating(false);
    }
  };

  const handleGoToCard = (cardNumber: number) => {
    // cardNumber is 1-indexed (user input), but currentIndex is 0-indexed
    const targetIndex = cardNumber - 1;
    if (targetIndex >= 0 && targetIndex < flashcards.length) {
      setCurrentIndex(targetIndex);
      setShowRating(false);
      toast.success(`Jumped to card ${cardNumber}`);
    }
  };

  const handleBookmarkToggle = async (flashcardId: string, isBookmarked: boolean) => {
    try {
      // Validate flashcardId format (CUID/UUID pattern)
      // This flashcardId comes from internal application state (currentCard.id), not user input
      // We add strict regex validation to prevent any potential SSRF/Injection vectors
      // We limit the length to 128 chars to prevent ReDoS
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
      if (!flashcardId || typeof flashcardId !== 'string' || !FLASHCARD_ID_PATTERN.test(flashcardId)) {
        throw new Error('Invalid flashcard ID');
      }

      if (isBookmarked) {
        // Add bookmark
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flashcardId }),
        });

        if (!res.ok) throw new Error('Failed to add bookmark');

        setBookmarkedCards(prev => new Set(prev).add(flashcardId));
        toast.success("Card bookmarked!");
      } else {
        // SSRF Protection: 
        // 1. Hardcoded prefix '/api/bookmarks/' forces a relative URL, preventing external domain access.
        // 2. flashcardId is validated against stricter FLASHCARD_ID_PATTERN (alphanumeric allowlist) above.
        // 3. encodeURIComponent prevents path traversal or special character injection.
        const res = await fetch(`/api/bookmarks/${encodeURIComponent(flashcardId)}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to remove bookmark');

        setBookmarkedCards(prev => {
          const updated = new Set(prev);
          updated.delete(flashcardId);
          return updated;
        });
        toast.success("Bookmark removed");
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error("Failed to update bookmark");
      // Revert the UI change on error by re-rendering
      setBookmarkedCards(prev => new Set(prev));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading Skeleton for better UX */}
          <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="space-y-4">
              <div className="h-10 w-32 bg-slate-700 rounded" />
              <div className="h-8 w-64 bg-slate-700 rounded" />
              <div className="h-4 w-40 bg-slate-700 rounded" />
            </div>
            {/* Progress bar skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-700 rounded" />
                <div className="h-4 w-12 bg-slate-700 rounded" />
              </div>
              <div className="h-2 w-full bg-slate-700 rounded" />
            </div>
            {/* Card skeleton */}
            <div className="max-w-7xl mx-auto">
              <div className="h-96 bg-slate-800 border border-slate-700 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <EmptyDeckState
        deck={deck}
        deckHasQuiz={deckHasQuiz}
        showDeckQuizModal={showDeckQuizModal}
        setShowDeckQuizModal={setShowDeckQuizModal}
        onDeckTest={handleDeckTest}
      />
    );
  }

  const allCardsStudied = studiedCards.size === flashcards.length;
  const deckName = deck?.name || "Unknown Deck";
  const className = deck?.className || "Unknown Class";

  const getModeName = () => {
    switch (mode) {
      case 'progressive':
        return 'Progressive';
      case 'random':
        return 'Random';
      case 'all':
      default:
        return '';
    }
  };

  const modeName = getModeName();
  const displayTitle = modeName ? `${deckName} - ${modeName} Mode` : deckName;

  const globalStyles = (
    <style jsx global>{`
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    `}</style>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729]">
      {/* Performance Monitoring */}
      <PerformanceMonitor pageName="Deck Study Page" showVisual={false} />
      {globalStyles}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <StudyPageHeader
          navigation={{
            backLink: deck?.classId ? `/dashboard/class/${deck.classId}` : "/dashboard",
            backLabel: className,
            subtitle: className,
            title: displayTitle,
          }}
          stats={{
            currentIndex,
            totalCards: flashcards.length,
            progress,
            progressLabel: "Deck study progress",
          }}
          onReset={handleReset}
          onGoToCard={handleGoToCard}
          extraActions={
            deckHasQuiz && (
              <Button
                onClick={handleDeckTest}
                variant="outline"
                className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10
                  hover:border-emerald-400 transition-all duration-200"
                aria-label="Take deck test"
              >
                <FileCheck2 className="h-4 w-4 mr-2" />
                Take Deck Test
              </Button>
            )
          }
        />

        {/* Flashcard or Completion */}
        {!allCardsStudied ? (
          <div className="space-y-8">
            {/* Navigation buttons and Flashcard */}
            <div className="flex items-center gap-4 max-w-7xl mx-auto">
              {/* Previous Button */}
              <Button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-12 w-12 rounded-full bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>

              {/* Flashcard */}
              <div className="flex-1">
                <Flashcard
                  key={currentCard.id}
                  flashcardId={currentCard.id}
                  question={currentCard.question}
                  answer={currentCard.answer}
                  isBookmarked={bookmarkedCards.has(currentCard.id)}
                  questionImages={currentCard.media?.filter(m => m.placement === 'question').sort((a, b) => a.order - b.order).map(m => ({
                    id: m.id,
                    url: m.fileUrl,
                    altText: m.altText,
                    placement: m.placement,
                    order: m.order
                  }))}
                  answerImages={currentCard.media?.filter(m => m.placement === 'answer').sort((a, b) => a.order - b.order).map(m => ({
                    id: m.id,
                    url: m.fileUrl,
                    altText: m.altText,
                    placement: m.placement,
                    order: m.order
                  }))}
                  onFlip={handleFlip}
                  onTest={handleTest}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              </div>

              {/* Next Button */}
              <Button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-12 w-12 rounded-full bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </Button>
            </div>

            {/* Confidence Rating */}
            {showRating && (
              <div className="animate-fade-in">
                <ConfidenceRating onRate={handleRate} />
              </div>
            )}
          </div>
        ) : (
          <DeckCompletionState
            flashcardCount={flashcards.length}
            deck={deck}
            onReset={handleReset}
          />
        )}

        {/* Study Tips - Removed backdrop-blur for better performance */}
        {!allCardsStudied && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Study Tip</h3>
              <p className="text-gray-300 text-sm">
                Be honest with your confidence ratings. Cards you rate lower will appear more frequently
                in your study sessions, helping you focus on areas that need more attention.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {currentCard && (
        <QuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          flashcardId={currentCard.id}
          flashcardQuestion={currentCard.question}
        />
      )}

      {/* Deck Quiz Modal */}
      {deckHasQuiz && (
        <DeckQuizModal
          isOpen={showDeckQuizModal}
          onClose={() => setShowDeckQuizModal(false)}
          deckId={deckId}
          deckName={deckName}
        />
      )}


    </div>
  );
}
