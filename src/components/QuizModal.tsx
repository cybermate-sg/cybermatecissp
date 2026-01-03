"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Languages } from "lucide-react";
import { FlashcardQuizActiveView } from "@/components/quiz/FlashcardQuizActiveView";
import { QuizCompletionScreen } from "@/components/quiz/QuizCompletionScreen";
import { useFlashcardQuiz } from "@/hooks/useFlashcardQuiz";
import { triggerGoogleTranslate, isGoogleTranslateActive } from "@/lib/utils/google-translate";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardId: string;
  flashcardQuestion: string;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

export function QuizModal({ isOpen, onClose, flashcardId, flashcardQuestion }: QuizModalProps) {
  const quiz = useFlashcardQuiz({ flashcardId, isOpen, onClose });
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = () => {
    console.log('Translate button clicked');
    setIsTranslating(true);
    // Trigger translation after a short delay to ensure content is rendered
    setTimeout(() => {
      triggerGoogleTranslate();
      // Wait longer for translation to complete (300ms switch + processing time)
      setTimeout(() => setIsTranslating(false), 2000);
    }, 100);
  };

  if (quiz.loading) {
    return (
      <Dialog open={isOpen} onOpenChange={quiz.handlers.handleClose}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogTitle className="sr-only">Loading quiz questions</DialogTitle>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (quiz.questions.length === 0) return null;

  const currentQuestion = quiz.questions[quiz.currentQuestionIndex];

  const showTranslateButton = isGoogleTranslateActive();

  return (
    <Dialog open={isOpen} onOpenChange={quiz.handlers.handleClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Quiz: {stripHtml(flashcardQuestion)}
        </DialogTitle>

        {/* Translate Button - only show if Google Translate is active */}
        {showTranslateButton && (
          <div className="flex justify-end mb-4 notranslate">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              variant="outline"
              size="sm"
              className="border-purple-400/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 notranslate"
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

        {!quiz.quizCompleted ? (
          <FlashcardQuizActiveView
            currentQuestion={currentQuestion}
            progress={{
              currentQuestionIndex: quiz.currentQuestionIndex,
              totalQuestions: quiz.questions.length,
            }}
            answerState={{
              selectedOption: quiz.selectedOption,
              showExplanation: quiz.showExplanation,
            }}
            stats={{
              correctAnswers: quiz.correctAnswers,
              currentStreak: quiz.gamification.currentStreak,
              maxStreak: quiz.gamification.maxStreak,
              totalXP: quiz.gamification.totalXP,
              currentLevel: quiz.gamification.currentLevel,
              progressToNextLevel: quiz.gamification.progressToNextLevel,
            }}
            currentFeedback={quiz.currentFeedback}
            handlers={{
              onOptionSelect: quiz.handlers.handleOptionSelect,
              onSubmitAnswer: quiz.handlers.handleSubmitAnswer,
              onNextQuestion: quiz.handlers.handleNextQuestion,
            }}
          />
        ) : (
          <QuizCompletionScreen
            correctAnswers={quiz.correctAnswers}
            totalQuestions={quiz.questions.length}
            maxStreak={quiz.gamification.maxStreak}
            totalXP={quiz.gamification.totalXP}
            achievements={quiz.gamification.earnedAchievements}
            completionMessage={quiz.completionMessage || { text: "Quiz completed!", emoji: "🎉" }}
            onRetake={quiz.handlers.handleRetakeQuiz}
            onClose={quiz.handlers.handleClose}
            accentColor="purple"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
