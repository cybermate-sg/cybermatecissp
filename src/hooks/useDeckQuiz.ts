import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useQuizGamification } from "./useQuizGamification";
import { shuffleQuestionOptions } from "@/lib/utils/shuffle";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  explanation: string | null;
  eliminationTactics?: Record<string, string> | null;
  correctAnswerWithJustification?: Record<string, string> | null;
  compareRemainingOptionsWithJustification?: Record<string, string> | null;
  correctOptionsJustification?: Record<string, string> | null;
  order: number;
  difficulty?: number | null;
}

interface UseDeckQuizParams {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function useDeckQuiz({ deckId, isOpen, onClose }: UseDeckQuizParams) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [firstThreeWrong, setFirstThreeWrong] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    xpEarned: number;
    message: { text: string; emoji?: string };
    streakMessage: { text: string; emoji?: string } | null;
  } | null>(null);
  const [completionMessage, setCompletionMessage] = useState<{ text: string; emoji?: string } | null>(null);

  // Track quiz start time and all answers for database storage
  const [quizStartTime] = useState(Date.now());
  const [allAnswers, setAllAnswers] = useState<Array<{
    questionId: string;
    questionType: 'deck';
    selectedOptionIndex: number;
    isCorrect: boolean;
    timeSpent: number;
    questionOrder: number;
  }>>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const gamification = useQuizGamification({
    totalQuestions: questions.length || 0,
  });

  const prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Track previous isOpen state to detect modal open transitions
  const prevIsOpenRef = useRef(isOpen);

  const triggerConfetti = useCallback(() => {
    if (prefersReducedMotion) return;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#06b6d4", "#22d3ee", "#60a5fa"],
    });
  }, [prefersReducedMotion]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setCorrectAnswers(0);
    setQuizCompleted(false);
    setFirstThreeWrong(false);
    setCurrentFeedback(null);
    setCompletionMessage(null);
    setAllAnswers([]);
    setQuestionStartTime(Date.now());
    gamification.resetSession();
    // Reshuffle options for all questions on retake
    setQuestions((prev) => shuffleQuestionOptions(prev));
  }, [gamification]);

  const fetchQuizQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/quiz`);
      if (!res.ok) {
        throw new Error("Failed to fetch deck quiz questions");
      }
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        // Shuffle answer options for each question to prevent position memorization
        setQuestions(shuffleQuestionOptions(data.questions));
        // Reset state inline to avoid circular dependency
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setCorrectAnswers(0);
        setQuizCompleted(false);
        setFirstThreeWrong(false);
        setCurrentFeedback(null);
        setCompletionMessage(null);
        setAllAnswers([]);
        setQuestionStartTime(Date.now());
      } else {
        toast.error("No quiz questions found for this deck");
        onClose();
      }
    } catch (error) {
      console.error("Error fetching deck quiz:", error);
      toast.error("Failed to load deck quiz questions");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [deckId, onClose]);

  useEffect(() => {
    // Only fetch and reset when modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current && deckId) {
      fetchQuizQuestions();
      gamification.resetSession();
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, deckId, fetchQuizQuestions]);

  const handleOptionSelect = useCallback((index: number) => {
    if (showExplanation) return;
    setSelectedOption(index);
  }, [showExplanation]);

  const handleSubmitAnswer = useCallback(() => {
    if (selectedOption === null) {
      toast.error("Please select an answer");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.options[selectedOption].isCorrect;

    // Record this answer for database storage
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setAllAnswers((prev) => [...prev, {
      questionId: currentQuestion.id,
      questionType: 'deck',
      selectedOptionIndex: selectedOption,
      isCorrect,
      timeSpent,
      questionOrder: currentQuestionIndex,
    }]);

    const feedback = gamification.recordAnswer(isCorrect);
    setCurrentFeedback(feedback);

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      triggerConfetti();
    } else {
      if (currentQuestionIndex < 3) {
        setFirstThreeWrong((prev) => prev || true);
      }
    }

    setShowExplanation(true);
  }, [selectedOption, questions, currentQuestionIndex, gamification, triggerConfetti, questionStartTime]);

  const saveQuizResults = useCallback(async () => {
    try {
      await fetch('/api/quiz-sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId,
          quizType: 'deck',
          answers: allAnswers,
          totalQuestions: questions.length,
          correctAnswers,
          startTime: quizStartTime,
        }),
      });
    } catch (error) {
      console.error('Failed to save quiz results:', error);
      // Don't throw - allow quiz to complete even if save fails
    }
  }, [deckId, allAnswers, questions.length, correctAnswers, quizStartTime]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setCurrentFeedback(null);
      setQuestionStartTime(Date.now()); // Reset timer for next question
    } else {
      // Quiz completed - save to database
      saveQuizResults();

      const result = gamification.finalizeQuiz(correctAnswers, firstThreeWrong);
      setCompletionMessage(result.completionMessage);
      setQuizCompleted(true);
    }
  }, [currentQuestionIndex, questions.length, gamification, correctAnswers, firstThreeWrong, saveQuizResults]);

  const handleRetakeQuiz = useCallback(() => {
    resetQuiz();
  }, [resetQuiz]);

  const handleClose = useCallback(() => {
    resetQuiz();
    onClose();
  }, [resetQuiz, onClose]);

  return {
    questions,
    currentQuestionIndex,
    selectedOption,
    showExplanation,
    correctAnswers,
    loading,
    quizCompleted,
    firstThreeWrong,
    currentFeedback,
    completionMessage,
    gamification,
    handlers: {
      handleOptionSelect,
      handleSubmitAnswer,
      handleNextQuestion,
      handleRetakeQuiz,
      handleClose,
    },
  };
}
