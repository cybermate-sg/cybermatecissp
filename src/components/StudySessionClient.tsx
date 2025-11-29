"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";

interface Flashcard {
  id: string;
  deckId: string;
  deckName: string;
  question: string;
  answer: string;
  explanation: string | null;
}

interface StudySessionClientProps {
  sessionId: string;
  flashcards: Flashcard[];
  userId: string;
}

export default function StudySessionClient({
  sessionId,
  flashcards,
  userId,
}: StudySessionClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set<string>());
  const [startTime] = useState(new Date());

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const handleConfidenceRating = async (rating: number) => {
    if (!currentCard) return;

    const responseTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    // Mark card as studied
    setStudiedCards(prev => new Set(prev).add(currentCard.id));

    // Save to database
    try {
      await fetch('/api/sessions/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          flashcardId: currentCard.id,
          confidenceRating: rating,
          responseTime,
        }),
      });

      // Also update user card progress
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          confidenceLevel: rating,
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }

    // Move to next card or finish
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // End session
      endSession();
    }
  };

  const endSession = async () => {
    try {
      const response = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          cardsStudied: studiedCards.size,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/session/${sessionId}/summary?cards=${data.session.cardsStudied}&duration=${data.session.studyDuration}`);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      router.push('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const handleExit = async () => {
    if (confirm('Are you sure you want to exit this session? Your progress will be saved.')) {
      await endSession();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Progress value={progress} className="h-2" aria-label="Study session progress" />
              <p className="text-sm text-gray-400 mt-2">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="ml-4 text-gray-300 hover:text-white hover:bg-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Deck Name */}
          <p className="text-sm text-gray-400 mb-4">{currentCard.deckName}</p>

          {/* Question Card */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                {currentCard.question}
              </h2>

              {!showAnswer ? (
                <Button
                  onClick={() => setShowAnswer(true)}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Show Answer
                </Button>
              ) : (
                <div className="space-y-6">
                  {/* Answer */}
                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">ANSWER</h3>
                    <p className="text-lg text-white">{currentCard.answer}</p>
                  </div>

                  {/* Explanation */}
                  {currentCard.explanation && (
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">EXPLANATION</h3>
                      <p className="text-base text-gray-300">{currentCard.explanation}</p>
                    </div>
                  )}

                  {/* Confidence Rating */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">How confident are you?</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          onClick={() => handleConfidenceRating(rating)}
                          className={`h-16 text-lg font-semibold ${
                            rating <= 2
                              ? 'bg-red-500 hover:bg-red-600'
                              : rating === 3
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Not confident</span>
                      <span>Very confident</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={() => setShowAnswer(false)}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Card
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              variant="outline"
              className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
