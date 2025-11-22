"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ChevronRight, Award } from "lucide-react";
import { toast } from "sonner";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  explanation: string | null;
  eliminationTactics?: string | null;
  correctAnswerWithJustification?: string | null;
  order: number;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardId: string;
  flashcardQuestion: string;
}

export function QuizModal({ isOpen, onClose, flashcardId, flashcardQuestion }: QuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Strip HTML tags from question text for display
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const fetchQuizQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flashcards/${flashcardId}/quiz`);
      if (!res.ok) {
        throw new Error('Failed to fetch quiz questions');
      }
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        resetQuiz();
      } else {
        toast.error('No quiz questions found for this flashcard');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz questions');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [flashcardId, onClose]);

  // Fetch quiz questions when modal opens
  useEffect(() => {
    if (isOpen && flashcardId) {
      fetchQuizQuestions();
    }
  }, [isOpen, flashcardId, fetchQuizQuestions]);

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setCorrectAnswers(0);
    setQuizCompleted(false);
  };

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return; // Prevent changing answer after submission
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) {
      toast.error('Please select an answer');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.options[selectedOption].isCorrect;

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }

    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRetakeQuiz = () => {
    resetQuiz();
  };

  const handleClose = () => {
    resetQuiz();
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogTitle className="sr-only">Loading quiz questions</DialogTitle>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Quiz: {stripHtml(flashcardQuestion)}
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>
              Score: {correctAnswers}/{currentQuestionIndex + (showExplanation ? 1 : 0)}
            </span>
          </div>
        </DialogHeader>

        {!quizCompleted ? (
          <div className="space-y-6 mt-4">
            {/* Question */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <p className="text-lg font-medium text-slate-800">{currentQuestion.questionText}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = option.isCorrect;
                const showCorrectness = showExplanation;

                let buttonClasses = "w-full p-4 text-left border-2 rounded-lg transition-all ";

                if (showCorrectness) {
                  if (isCorrect) {
                    buttonClasses += "border-green-500 bg-green-50 text-green-900";
                  } else if (isSelected && !isCorrect) {
                    buttonClasses += "border-red-500 bg-red-50 text-red-900";
                  } else {
                    buttonClasses += "border-slate-200 bg-slate-50 text-slate-600";
                  }
                } else {
                  if (isSelected) {
                    buttonClasses += "border-purple-500 bg-purple-50 text-purple-900";
                  } else {
                    buttonClasses += "border-slate-300 bg-white text-slate-800 hover:border-purple-300 hover:bg-purple-50";
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showExplanation}
                    className={buttonClasses}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {showCorrectness ? (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border-2 ${
                              isSelected ? "border-purple-500 bg-purple-500" : "border-slate-300"
                            }`}
                          />
                        )}
                      </div>
                      <span className="flex-1">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                {currentQuestion.explanation && (
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
                    <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
                  </div>
                )}

                {currentQuestion.eliminationTactics && (
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">Elimination Tactics:</p>
                    <p className="text-sm text-blue-800">{currentQuestion.eliminationTactics}</p>
                  </div>
                )}

                {currentQuestion.correctAnswerWithJustification && (
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">Correct Answer with Justification:</p>
                    <p className="text-sm text-blue-800">{currentQuestion.correctAnswerWithJustification}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {!showExplanation ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "View Results"
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Quiz Completed Screen
          <div className="space-y-6 mt-4">
            <div className="text-center py-8">
              <Award className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Quiz Completed!</h3>
              <p className="text-lg text-slate-600 mb-6">
                You scored {correctAnswers} out of {questions.length} ({scorePercentage}%)
              </p>

              {/* Score feedback */}
              <div className="mb-6">
                {scorePercentage >= 80 ? (
                  <p className="text-green-600 font-medium">Excellent work! 🎉</p>
                ) : scorePercentage >= 60 ? (
                  <p className="text-blue-600 font-medium">Good job! Keep practicing! 👍</p>
                ) : (
                  <p className="text-orange-600 font-medium">Keep studying and try again! 📚</p>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-4 mb-8">
                <div
                  className={`h-4 rounded-full transition-all ${
                    scorePercentage >= 80
                      ? "bg-green-500"
                      : scorePercentage >= 60
                      ? "bg-blue-500"
                      : "bg-orange-500"
                  }`}
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3">
              <Button onClick={handleRetakeQuiz} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                Retake Quiz
              </Button>
              <Button onClick={handleClose} className="bg-purple-600 hover:bg-purple-700 text-white">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
