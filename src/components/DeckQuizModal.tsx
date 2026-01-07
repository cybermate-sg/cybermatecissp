"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Languages } from "lucide-react";

// Gamified components
import { QuizCompletionScreen } from "@/components/quiz/QuizCompletionScreen";
import { DeckQuizLoading } from "@/components/quiz/DeckQuizLoading";
import { DeckQuizActiveView } from "@/components/quiz/DeckQuizActiveView";

// Quiz hook
import { useDeckQuiz } from "@/hooks/useDeckQuiz";
import { triggerGoogleTranslate, isGoogleTranslateLoaded, isGoogleTranslateActive } from "@/lib/utils/google-translate";

interface DeckQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckName: string;
}

export function DeckQuizModal({ isOpen, onClose, deckId, deckName }: DeckQuizModalProps) {
  const {
    questions,
    currentQuestionIndex,
    selectedOption,
    showExplanation,
    correctAnswers,
    loading,
    quizCompleted,
    currentFeedback,
    completionMessage,
    gamification,
    handlers,
  } = useDeckQuiz({ deckId, isOpen, onClose });

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = () => {
    console.log('Translate button clicked');

    // Check if user has selected a language first
    if (!isGoogleTranslateActive()) {
      // No language selected yet - guide the user
      alert('Please select a language from the dropdown at the top of the page first, then click this button to translate the quiz content.');
      return;
    }

    setIsTranslating(true);
    // Trigger translation after a short delay to ensure content is rendered
    setTimeout(() => {
      triggerGoogleTranslate();
      // Wait longer for translation to complete (300ms switch + processing time)
      setTimeout(() => setIsTranslating(false), 2000);
    }, 100);
  };

  if (loading) {
    return <DeckQuizLoading isOpen={isOpen} onClose={handlers.handleClose} />;
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const showTranslateButton = isGoogleTranslateLoaded();

  return (
    <Dialog open={isOpen} onOpenChange={handlers.handleClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-blue-500/30 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Deck Test: {deckName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Take a quiz covering all cards in the {deckName} deck.
        </DialogDescription>

        {/* Translate Button - only show if Google Translate widget is loaded */}
        {showTranslateButton && (
          <div className="flex justify-end mb-4 mr-12 notranslate">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              variant="outline"
              size="sm"
              className="border-blue-400/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 notranslate"
            >
              {isTranslating ? (
                <span className="flex items-center notranslate">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating...
                </span>
              ) : (
                <span className="flex items-center notranslate">
                  <Languages className="w-4 h-4 mr-2" />
                  Translate
                </span>
              )}
            </Button>
          </div>
        )}

        {!quizCompleted ? (
          <DeckQuizActiveView
            currentQuestion={currentQuestion}
            progress={{
              currentQuestionIndex,
              totalQuestions: questions.length,
            }}
            answerState={{
              selectedOption,
              showExplanation,
            }}
            stats={{
              correctAnswers,
              currentStreak: gamification.currentStreak,
              maxStreak: gamification.maxStreak,
              totalXP: gamification.totalXP,
              currentLevel: gamification.currentLevel,
              progressToNextLevel: gamification.progressToNextLevel,
            }}
            currentFeedback={currentFeedback}
            handlers={{
              onOptionSelect: handlers.handleOptionSelect,
              onSubmitAnswer: handlers.handleSubmitAnswer,
              onNextQuestion: handlers.handleNextQuestion,
            }}
          />
        ) : (
          <QuizCompletionScreen
            correctAnswers={correctAnswers}
            totalQuestions={questions.length}
            maxStreak={gamification.maxStreak}
            totalXP={gamification.totalXP}
            achievements={gamification.earnedAchievements}
            completionMessage={completionMessage || { text: "Quiz completed!", emoji: "🎉" }}
            onRetake={handlers.handleRetakeQuiz}
            onClose={handlers.handleClose}
            accentColor="blue"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
