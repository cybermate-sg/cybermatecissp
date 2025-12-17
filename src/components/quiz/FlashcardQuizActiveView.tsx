"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { QuizProgressHeader } from "./QuizProgressHeader";
import { QuizQuestionHeader } from "./QuizQuestionHeader";
import { QuizOptionCard } from "./QuizOptionCard";
import { QuizFeedbackBanner } from "./QuizFeedbackBanner";
import { QuizExplanationPanel } from "./QuizExplanationPanel";
import { type Level } from "@/lib/gamification/xp-system";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  explanation: string | null;
  eliminationTactics?: Record<string, string> | null;
  correctAnswerWithJustification?: Record<string, string> | null;
  compareRemainingOptionsWithJustification?: Record<string, string> | null;
  correctOptionsJustification?: Record<string, string> | null;
  order: number;
}

interface QuizProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
}

interface AnswerState {
  selectedOption: number | null;
  showExplanation: boolean;
}

interface QuizStats {
  correctAnswers: number;
  currentStreak: number;
  maxStreak: number;
  totalXP: number;
  currentLevel: Level;
  progressToNextLevel: number;
}

interface QuizHandlers {
  onOptionSelect: (index: number) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
}

interface FlashcardQuizActiveViewProps {
  currentQuestion: QuizQuestion;
  progress: QuizProgress;
  answerState: AnswerState;
  stats: QuizStats;
  currentFeedback: {
    xpEarned: number;
    message: { text: string; emoji?: string };
    streakMessage: { text: string; emoji?: string } | null;
  } | null;
  handlers: QuizHandlers;
}

export function FlashcardQuizActiveView({
  currentQuestion,
  progress,
  answerState,
  stats,
  currentFeedback,
  handlers,
}: FlashcardQuizActiveViewProps) {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { currentQuestionIndex, totalQuestions } = progress;
  const { selectedOption, showExplanation } = answerState;
  const { correctAnswers, currentStreak, maxStreak, totalXP, currentLevel, progressToNextLevel } = stats;
  const { onOptionSelect, onSubmitAnswer, onNextQuestion } = handlers;

  const isAnswerCorrect = selectedOption !== null && currentQuestion.options[selectedOption].isCorrect;

  return (
    <div className="space-y-6">
      {/* Progress Header with Gamification Stats */}
      <QuizProgressHeader
        progress={{
          currentQuestion: currentQuestionIndex + (showExplanation ? 1 : 0),
          totalQuestions: totalQuestions,
        }}
        score={correctAnswers}
        streak={{
          current: currentStreak,
          max: maxStreak,
        }}
        xp={{
          total: totalXP,
          level: currentLevel,
          progressToNextLevel: progressToNextLevel,
        }}
      />

      {/* Main Content - Glassmorphism Card */}
      <div className="glass p-6 md:p-8 rounded-xl space-y-6">
        {/* Question Header */}
        <QuizQuestionHeader
          questionText={currentQuestion.questionText}
          questionNumber={currentQuestionIndex + 1}
        />

        {/* Option Cards */}
        <div className="space-y-4 mt-8">
          {currentQuestion.options.map((option, index) => (
            <QuizOptionCard
              key={index}
              option={option}
              isSelected={selectedOption === index}
              isCorrect={showExplanation && option.isCorrect}
              isWrong={
                showExplanation &&
                selectedOption === index &&
                !option.isCorrect
              }
              isDisabled={showExplanation}
              onClick={() => onOptionSelect(index)}
              accentColor="purple"
            />
          ))}
        </div>

        {/* Feedback Banner */}
        {showExplanation && currentFeedback && (
          <QuizFeedbackBanner
            isCorrect={isAnswerCorrect}
            message={currentFeedback.message}
            xpEarned={currentFeedback.xpEarned}
            streakMessage={currentFeedback.streakMessage}
            accentColor="purple"
          />
        )}

        {/* Explanation Panel */}
        {showExplanation && (
          <QuizExplanationPanel
            explanation={currentQuestion.explanation}
            eliminationTactics={currentQuestion.eliminationTactics}
            correctJustification={
              currentQuestion.correctAnswerWithJustification ||
              currentQuestion.correctOptionsJustification
            }
            compareOptions={
              currentQuestion.compareRemainingOptionsWithJustification
            }
          />
        )}
      </div>

      {/* Action Buttons */}
      <DialogFooter className="flex items-center justify-between">
        <FeedbackButton
          onClick={(e: React.MouseEvent) => setIsFeedbackModalOpen(true)}
          variant="ghost"
          size="sm"
          showLabel
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        />
        {!showExplanation ? (
          <Button
            onClick={onSubmitAnswer}
            disabled={selectedOption === null}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            size="lg"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={onNextQuestion}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            size="lg"
          >
            {currentQuestionIndex < totalQuestions - 1
              ? "Next Question"
              : "View Results"}
          </Button>
        )}
      </DialogFooter>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        quizQuestionId={currentQuestion.id}
      />
    </div>
  );
}
