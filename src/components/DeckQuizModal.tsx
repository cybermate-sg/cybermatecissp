"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Gamified components
import { QuizCompletionScreen } from "@/components/quiz/QuizCompletionScreen";
import { DeckQuizLoading } from "@/components/quiz/DeckQuizLoading";
import { DeckQuizActiveView } from "@/components/quiz/DeckQuizActiveView";

// Quiz hook
import { useDeckQuiz } from "@/hooks/useDeckQuiz";

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

  if (loading) {
    return <DeckQuizLoading isOpen={isOpen} onClose={handlers.handleClose} />;
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handlers.handleClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-blue-500/30 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Deck Test: {deckName}
        </DialogTitle>

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
