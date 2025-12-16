"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { FlashcardQuizActiveView } from "@/components/quiz/FlashcardQuizActiveView";
import { QuizCompletionScreen } from "@/components/quiz/QuizCompletionScreen";
import { useFlashcardQuiz } from "@/hooks/useFlashcardQuiz";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardId: string;
  flashcardQuestion: string;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

export function QuizModal({ isOpen, onClose, flashcardId, flashcardQuestion }: QuizModalProps) {
  const quiz = useFlashcardQuiz({ flashcardId, isOpen, onClose });

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

  return (
    <Dialog open={isOpen} onOpenChange={quiz.handlers.handleClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Quiz: {stripHtml(flashcardQuestion)}
        </DialogTitle>

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
