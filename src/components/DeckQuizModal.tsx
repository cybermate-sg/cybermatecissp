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
  eliminationTactics?: Record<string, string> | null;
  correctAnswerWithJustification?: Record<string, string> | null;
  compareRemainingOptionsWithJustification?: Record<string, string> | null;
  correctOptionsJustification?: Record<string, string> | null;
  order: number;
  difficulty?: number | null;
}

interface DeckQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckName: string;
}

export function DeckQuizModal({ isOpen, onClose, deckId, deckName }: DeckQuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const fetchQuizQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/quiz`);
      if (!res.ok) {
        throw new Error('Failed to fetch deck quiz questions');
      }
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        resetQuiz();
      } else {
        toast.error('No quiz questions found for this deck');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching deck quiz:', error);
      toast.error('Failed to load deck quiz questions');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [deckId, onClose]);

  useEffect(() => {
    if (isOpen && deckId) {
      fetchQuizQuestions();
    }
  }, [isOpen, deckId, fetchQuizQuestions]);

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setCorrectAnswers(0);
    setQuizCompleted(false);
  };

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return;
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
          <DialogHeader>
            <DialogTitle className="sr-only">Loading quiz questions</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
            Deck Test: {deckName}
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
              {currentQuestion.difficulty && (
                <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Difficulty: {currentQuestion.difficulty}/5
                </span>
              )}
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
                    buttonClasses += "border-blue-500 bg-blue-50 text-blue-900";
                  } else {
                    buttonClasses += "border-slate-300 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50";
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
                              isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
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
              <div className="bg-blue-50 rounded-lg p-6 space-y-6">
                {currentQuestion.explanation && (
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 mb-3">Explanation</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {currentQuestion.eliminationTactics && typeof currentQuestion.eliminationTactics === 'object' && Object.keys(currentQuestion.eliminationTactics).length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 mb-3">Elimination Tactics</h3>
                    <div className="space-y-3">
                      {Object.entries(currentQuestion.eliminationTactics).map(([option, reason]) => (
                        <div key={option} className="text-sm text-blue-800 leading-relaxed">
                          <span className="font-semibold text-blue-900">{option}:</span> {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.compareRemainingOptionsWithJustification && typeof currentQuestion.compareRemainingOptionsWithJustification === 'object' && Object.keys(currentQuestion.compareRemainingOptionsWithJustification).length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 mb-3">Compare Remaining Options</h3>
                    <div className="space-y-3">
                      {Object.entries(currentQuestion.compareRemainingOptionsWithJustification).map(([option, comparison]) => (
                        <div key={option} className="text-sm text-blue-800 leading-relaxed">
                          <span className="font-semibold text-blue-900">{option}:</span> {comparison}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.correctOptionsJustification && typeof currentQuestion.correctOptionsJustification === 'object' && Object.keys(currentQuestion.correctOptionsJustification).length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 mb-3">Correct Option Justification</h3>
                    <div className="space-y-3">
                      {Object.entries(currentQuestion.correctOptionsJustification).map(([option, justification]) => (
                        <div key={option} className="text-sm text-blue-800 leading-relaxed">
                          <p className="text-sm text-blue-800 leading-relaxed">{justification}</p>
                        </div>
                      ))}
                    </div>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
              <Award className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Deck Test Completed!</h3>
              <p className="text-lg text-slate-600 mb-6">
                You scored {correctAnswers} out of {questions.length} ({scorePercentage}%)
              </p>

              {/* Score feedback */}
              <div className="mb-6">
                {scorePercentage >= 80 ? (
                  <p className="text-green-600 font-medium">Excellent work! You&apos;ve mastered this deck! 🎉</p>
                ) : scorePercentage >= 60 ? (
                  <p className="text-blue-600 font-medium">Good job! Review the deck and try again! 👍</p>
                ) : (
                  <p className="text-orange-600 font-medium">Keep studying this deck and retake the test! 📚</p>
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
              <Button onClick={handleRetakeQuiz} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Retake Test
              </Button>
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700 text-white">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
