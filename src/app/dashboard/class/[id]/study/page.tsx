"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";
import Flashcard from "@/components/Flashcard";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { toast } from "sonner";

interface FlashcardMedia {
  id: string;
  fileUrl: string;
  altText: string | null;
  placement: string;
  order: number;
}

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  deckName: string;
  className: string;
  media: FlashcardMedia[];
}

export default function ClassStudyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const mode = searchParams.get('mode') || 'progressive';
  const selectedDecks = searchParams.get('decks'); // Comma-separated deck IDs

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;

  // Load flashcards on mount
  useEffect(() => {
    loadFlashcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, mode, selectedDecks]);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      const url = selectedDecks
        ? `/api/classes/${classId}/study?mode=${mode}&decks=${selectedDecks}`
        : `/api/classes/${classId}/study?mode=${mode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load flashcards");

      const data = await res.json();
      setClassName(data.className || "Unknown Class");
      setFlashcards(data.flashcards || []);

      if (data.flashcards.length === 0) {
        toast.info("No cards available for this study mode");
      }
    } catch {
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (confidence: number) => {
    if (!currentCard) return;

    try {
      // Save confidence rating to database
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

  const getModeName = () => {
    switch (mode) {
      case 'progressive':
        return 'Progressive';
      case 'random':
        return 'Random';
      case 'all':
        return 'All Cards';
      default:
        return mode;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={`/dashboard/class/${classId}`}>
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {className}
            </Button>
          </Link>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">No flashcards available</h1>
            <p className="text-gray-400">
              {mode === 'progressive'
                ? "Great job! You've mastered all cards. Try 'All' or 'Random' mode to review."
                : "This class doesn't have any flashcards yet."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allCardsStudied = studiedCards.size === flashcards.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Performance Monitoring */}
      <PerformanceMonitor pageName="Class Study Page" showVisual={false} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/class/${classId}`}>
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {className}
            </Button>
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-purple-400 mb-1">{className}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {getModeName()} Mode
              </h1>
              <p className="text-gray-400">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Progress
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Flashcard or Completion */}
        {!allCardsStudied ? (
          <div className="pb-32">
            {/* Flashcard */}
            <Flashcard
              key={currentCard.id}
              question={currentCard.question}
              answer={currentCard.answer}
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
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white">
              Great Job!
            </h2>
            <p className="text-xl text-gray-300">
              You&apos;ve completed all {flashcards.length} cards in {getModeName()} mode.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleReset}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Link href={`/dashboard/class/${classId}`}>
                <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto">
                  Back to {className}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Study Tips */}
        {!allCardsStudied && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Study Mode: {getModeName()}</h3>
              <p className="text-gray-300 text-sm">
                {mode === 'progressive' && "You're studying cards that need the most attention - those with low confidence or due for review."}
                {mode === 'random' && "Cards are shuffled randomly to test your knowledge in an unpredictable order."}
                {mode === 'all' && "You're studying all cards in this class in their default order."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Rating Bar */}
      {!allCardsStudied && showRating && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent backdrop-blur-lg border-t border-slate-700 py-6 px-4 z-50 animate-fade-in">
          <div className="container mx-auto max-w-4xl">
            <p className="text-center text-white text-lg font-semibold mb-4">
              How well did you know this?
            </p>
            <p className="text-center text-gray-400 text-sm mb-6">
              Be honest - this helps us optimize your learning
            </p>
            <div className="flex justify-center gap-2 sm:gap-4">
              {[
                { level: 1, color: 'bg-red-600 hover:bg-red-700', label: 'Not at all', subtext: "I don't know this" },
                { level: 2, color: 'bg-orange-600 hover:bg-orange-700', label: 'Barely', subtext: 'I barely remember' },
                { level: 3, color: 'bg-yellow-600 hover:bg-yellow-700', label: 'Somewhat', subtext: 'I sort of know this' },
                { level: 4, color: 'bg-lime-600 hover:bg-lime-700', label: 'Mostly', subtext: 'I know this well' },
                { level: 5, color: 'bg-green-600 hover:bg-green-700', label: 'Perfectly', subtext: 'I know this perfectly' },
              ].map((option) => (
                <button
                  key={option.level}
                  onClick={() => handleRate(option.level)}
                  className={`${option.color} text-white px-4 py-6 sm:px-6 sm:py-8 rounded-xl flex flex-col items-center justify-center transition-all transform hover:scale-105 hover:shadow-2xl min-w-[80px] sm:min-w-[120px]`}
                >
                  <span className="text-3xl sm:text-4xl font-bold mb-2">{option.level}</span>
                  <span className="text-xs sm:text-sm font-semibold">{option.label}</span>
                  <span className="text-[10px] sm:text-xs opacity-80 mt-1 hidden sm:block">{option.subtext}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
    </div>
  );
}
