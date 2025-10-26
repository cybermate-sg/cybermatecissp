"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";
import Flashcard from "@/components/Flashcard";
import ConfidenceRating from "@/components/ConfidenceRating";
import { toast } from "sonner";

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: number;
  deckName: string;
  topicName: string;
}

interface DomainData {
  id: string;
  name: string;
  description: string;
}

export default function DomainStudyPage() {
  const params = useParams();
  const domainId = params.id as string;

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [domain, setDomain] = useState<DomainData | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;

  // Load flashcards on mount
  useEffect(() => {
    loadFlashcards();
  }, [domainId]);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/domains/${domainId}/flashcards`);
      if (!res.ok) throw new Error("Failed to load flashcards");

      const data = await res.json();
      setDomain(data.domain);
      setFlashcards(data.flashcards || []);
    } catch (error) {
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
    setCurrentIndex(0);
    setStudiedCards(new Set());
    setShowRating(false);
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
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">No flashcards available</h1>
            <p className="text-gray-400">This domain doesn&apos;t have any flashcards yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const allCardsStudied = studiedCards.size === flashcards.length;
  const domainName = domain?.name || "Unknown Domain";
  const domainOrder = flashcards[0]?.topicName ? null : domainId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {domainName}
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
          <div className="space-y-8">
            {/* Flashcard */}
            <Flashcard
              question={currentCard.question}
              answer={currentCard.answer}
              onFlip={handleFlip}
            />

            {/* Confidence Rating */}
            {showRating && (
              <div className="animate-fade-in">
                <ConfidenceRating onRate={handleRate} />
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white">
              Great Job!
            </h2>
            <p className="text-xl text-gray-300">
              You&apos;ve completed all {flashcards.length} cards in this domain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleReset}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Study Tips */}
        {!allCardsStudied && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">💡 Study Tip</h3>
              <p className="text-gray-300 text-sm">
                Be honest with your confidence ratings. Cards you rate lower will appear more frequently
                in your study sessions, helping you focus on areas that need more attention.
              </p>
            </div>
          </div>
        )}
      </div>

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
