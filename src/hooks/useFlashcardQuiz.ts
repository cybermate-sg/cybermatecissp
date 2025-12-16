import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useQuizGamification } from "./useQuizGamification";

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
}

interface UseFlashcardQuizParams {
  flashcardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function useFlashcardQuiz({ flashcardId, isOpen, onClose }: UseFlashcardQuizParams) {
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
      colors: ["#a855f7", "#06b6d4", "#22d3ee", "#8b5cf6"],
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
    gamification.resetSession();
  }, [gamification]);

  const fetchQuizQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flashcards/${flashcardId}/quiz`);
      if (!res.ok) {
        throw new Error("Failed to fetch quiz questions");
      }
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        // Reset state inline to avoid circular dependency
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setCorrectAnswers(0);
        setQuizCompleted(false);
        setFirstThreeWrong(false);
        setCurrentFeedback(null);
        setCompletionMessage(null);
      } else {
        toast.error("No quiz questions found for this flashcard");
        onClose();
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz questions");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [flashcardId, onClose]);

  useEffect(() => {
    // Only fetch and reset when modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current && flashcardId) {
      fetchQuizQuestions();
      gamification.resetSession();
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, flashcardId, fetchQuizQuestions]);

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
  }, [selectedOption, questions, currentQuestionIndex, gamification, triggerConfetti]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setCurrentFeedback(null);
    } else {
      const result = gamification.finalizeQuiz(correctAnswers, firstThreeWrong);
      setCompletionMessage(result.completionMessage);
      setQuizCompleted(true);
    }
  }, [currentQuestionIndex, questions.length, gamification, correctAnswers, firstThreeWrong]);

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
