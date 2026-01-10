'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { quizQuestionUpdateSchema, deckQuizQuestionUpdateSchema } from '@/lib/validations/quiz';
import type { QuizQuestionUpdate, DeckQuizQuestionUpdate } from '@/lib/validations/quiz';

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  explanation: string | null;
  eliminationTactics: Record<string, string> | null;
  correctAnswerWithJustification: Record<string, string> | null;
  compareRemainingOptionsWithJustification: Record<string, string> | null;
  correctOptionsJustification: Record<string, string> | null;
  order: number;
  createdAt: Date;
  createdBy: string;
  difficulty?: number | null;
}

interface QuizQuestionEditDialogProps {
  question: QuizQuestion | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (questionId: string, data: QuizQuestionUpdate | DeckQuizQuestionUpdate) => Promise<void>;
  isSaving: boolean;
  isDeckQuiz?: boolean;
}

export function QuizQuestionEditDialog({
  question,
  isOpen,
  onOpenChange,
  onSave,
  isSaving,
  isDeckQuiz = false,
}: QuizQuestionEditDialogProps) {
  // Form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<QuizOption[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<number | null>(null);

  // Advanced metadata state (as JSON strings)
  const [eliminationTactics, setEliminationTactics] = useState('{}');
  const [correctAnswerWithJustification, setCorrectAnswerWithJustification] = useState('{}');
  const [compareRemainingOptionsWithJustification, setCompareRemainingOptionsWithJustification] = useState('{}');
  const [correctOptionsJustification, setCorrectOptionsJustification] = useState('{}');

  // UI state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form when question changes
  useEffect(() => {
    if (question && isOpen) {
      setQuestionText(question.questionText);
      setOptions(question.options);
      setExplanation(question.explanation || '');
      setDifficulty(question.difficulty || null);

      // Initialize metadata fields
      setEliminationTactics(
        question.eliminationTactics ? JSON.stringify(question.eliminationTactics, null, 2) : '{}'
      );
      setCorrectAnswerWithJustification(
        question.correctAnswerWithJustification
          ? JSON.stringify(question.correctAnswerWithJustification, null, 2)
          : '{}'
      );
      setCompareRemainingOptionsWithJustification(
        question.compareRemainingOptionsWithJustification
          ? JSON.stringify(question.compareRemainingOptionsWithJustification, null, 2)
          : '{}'
      );
      setCorrectOptionsJustification(
        question.correctOptionsJustification
          ? JSON.stringify(question.correctOptionsJustification, null, 2)
          : '{}'
      );

      setErrors({});
      setIsDirty(false);
      setIsAdvancedOpen(false);
    }
  }, [question, isOpen]);

  // Validate JSON field
  const validateJSON = (jsonString: string): boolean => {
    if (jsonString.trim() === '' || jsonString.trim() === '{}') return true;
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  // Parse JSON safely
  const parseJSONSafe = (jsonString: string): Record<string, string> | undefined => {
    const trimmed = jsonString.trim();
    if (trimmed === '' || trimmed === '{}') return undefined;
    try {
      const parsed = JSON.parse(trimmed);
      return Object.keys(parsed).length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  // Add option
  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', isCorrect: false }]);
      setIsDirty(true);
    }
  };

  // Remove option
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      setIsDirty(true);
    }
  };

  // Update option text
  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    setOptions(updated);
    setIsDirty(true);
  };

  // Toggle option correctness
  const handleOptionCorrectChange = (index: number, isCorrect: boolean) => {
    const updated = [...options];
    updated[index] = { ...updated[index], isCorrect };
    setOptions(updated);
    setIsDirty(true);
  };

  // Validate and save
  const handleSave = async () => {
    setErrors({});

    // Prepare data
    const data: QuizQuestionUpdate | DeckQuizQuestionUpdate = {
      questionText,
      options,
      explanation: explanation.trim() || undefined,
      eliminationTactics: parseJSONSafe(eliminationTactics),
      correctAnswerWithJustification: parseJSONSafe(correctAnswerWithJustification),
      compareRemainingOptionsWithJustification: parseJSONSafe(compareRemainingOptionsWithJustification),
      correctOptionsJustification: parseJSONSafe(correctOptionsJustification),
    };

    // Add difficulty for deck quizzes
    if (isDeckQuiz) {
      (data as DeckQuizQuestionUpdate).difficulty = difficulty;
    }

    // Validate with Zod
    const schema = isDeckQuiz ? deckQuizQuestionUpdateSchema : quizQuestionUpdateSchema;
    const validation = schema.safeParse(data);

    console.log('Validation data:', data);
    console.log('Validation result:', validation);

    if (!validation.success) {
      const zodErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        zodErrors[path] = issue.message;
      });
      console.error('Validation errors:', zodErrors);
      setErrors(zodErrors);
      return;
    }

    // Validate JSON fields
    const jsonFields = {
      eliminationTactics,
      correctAnswerWithJustification,
      compareRemainingOptionsWithJustification,
      correctOptionsJustification,
    };

    const jsonErrors: Record<string, string> = {};
    Object.entries(jsonFields).forEach(([key, value]) => {
      if (!validateJSON(value)) {
        jsonErrors[key] = 'Invalid JSON format';
      }
    });

    if (Object.keys(jsonErrors).length > 0) {
      setErrors({ ...errors, ...jsonErrors });
      return;
    }

    // Save
    if (question) {
      await onSave(question.id, data);
      setIsDirty(false);
    }
  };

  // Handle close with dirty check
  const handleClose = () => {
    if (isDirty && !isSaving) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onOpenChange(false);
        setIsDirty(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quiz Question</DialogTitle>
          <DialogDescription className="text-slate-600">
            Modify the question, options, and metadata. Order cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="questionText" className="text-slate-700 font-semibold">
              Question Text <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Enter the quiz question..."
              className="min-h-[100px] border-slate-300 focus:border-purple-500"
              autoFocus
            />
            {errors.questionText && (
              <p className="text-sm text-red-600">{errors.questionText}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700 font-semibold">
                Options <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-2 font-normal">(2-6 options)</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                disabled={options.length >= 6}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg border ${
                    option.isCorrect ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <Badge variant="outline" className="mt-2 flex-shrink-0">
                    {index + 1}
                  </Badge>
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(index, e.target.value)}
                    placeholder={`Option ${index + 1} text...`}
                    className="flex-1 bg-white"
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${index}`}
                        checked={option.isCorrect}
                        onCheckedChange={(checked) =>
                          handleOptionCorrectChange(index, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="text-sm text-slate-700 cursor-pointer whitespace-nowrap"
                      >
                        Correct
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {errors.options && <p className="text-sm text-red-600">{errors.options}</p>}
            {errors['options.0'] && <p className="text-sm text-red-600">{errors['options.0']}</p>}
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation" className="text-slate-700 font-semibold">
              Explanation <span className="text-xs text-slate-500 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => {
                setExplanation(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Explain why the correct answer(s) are correct..."
              className="min-h-[80px] border-slate-300 focus:border-purple-500"
            />
          </div>

          {/* Order (Read-only) */}
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-medium">Order:</span>
            <Badge variant="outline">{question.order}</Badge>
            <span className="text-xs text-slate-500">(read-only)</span>
          </div>

          {/* Difficulty (Deck Quiz Only) */}
          {isDeckQuiz && (
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-slate-700 font-semibold">
                Difficulty <span className="text-xs text-slate-500 font-normal">(1-5, Optional)</span>
              </Label>
              <Input
                id="difficulty"
                type="number"
                min={1}
                max={5}
                value={difficulty || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setDifficulty(val);
                  setIsDirty(true);
                }}
                placeholder="Enter difficulty level (1-5)"
                className="border-slate-300 focus:border-purple-500"
              />
              {errors.difficulty && (
                <p className="text-sm text-red-600">{errors.difficulty}</p>
              )}
            </div>
          )}

          {/* Advanced Metadata */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between border-slate-300 hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-700">Advanced Metadata</span>
                {isAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4 space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  These fields accept JSON objects with option text as keys. Leave as empty braces if not
                  needed.
                </AlertDescription>
              </Alert>

              {/* Elimination Tactics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="eliminationTactics" className="text-slate-700 font-medium">
                    Elimination Tactics
                  </Label>
                  {validateJSON(eliminationTactics) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Textarea
                  id="eliminationTactics"
                  value={eliminationTactics}
                  onChange={(e) => {
                    setEliminationTactics(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder='{"Wrong option": "Reason to eliminate"}'
                  className="font-mono text-sm min-h-[100px] border-slate-300"
                />
                {errors.eliminationTactics && (
                  <p className="text-sm text-red-600">{errors.eliminationTactics}</p>
                )}
              </div>

              {/* Correct Answer Justification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="correctAnswerWithJustification" className="text-slate-700 font-medium">
                    Correct Answer Justification
                  </Label>
                  {validateJSON(correctAnswerWithJustification) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Textarea
                  id="correctAnswerWithJustification"
                  value={correctAnswerWithJustification}
                  onChange={(e) => {
                    setCorrectAnswerWithJustification(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder='{"Correct option": "Why this is correct"}'
                  className="font-mono text-sm min-h-[100px] border-slate-300"
                />
                {errors.correctAnswerWithJustification && (
                  <p className="text-sm text-red-600">{errors.correctAnswerWithJustification}</p>
                )}
              </div>

              {/* Compare Remaining Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="compareRemainingOptionsWithJustification"
                    className="text-slate-700 font-medium"
                  >
                    Compare Remaining Options
                  </Label>
                  {validateJSON(compareRemainingOptionsWithJustification) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Textarea
                  id="compareRemainingOptionsWithJustification"
                  value={compareRemainingOptionsWithJustification}
                  onChange={(e) => {
                    setCompareRemainingOptionsWithJustification(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder='{"Option A vs B": "Comparison justification"}'
                  className="font-mono text-sm min-h-[100px] border-slate-300"
                />
                {errors.compareRemainingOptionsWithJustification && (
                  <p className="text-sm text-red-600">
                    {errors.compareRemainingOptionsWithJustification}
                  </p>
                )}
              </div>

              {/* Correct Options Justification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="correctOptionsJustification" className="text-slate-700 font-medium">
                    Correct Options Justification
                  </Label>
                  {validateJSON(correctOptionsJustification) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <Textarea
                  id="correctOptionsJustification"
                  value={correctOptionsJustification}
                  onChange={(e) => {
                    setCorrectOptionsJustification(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder='{"Correct option": "Detailed justification"}'
                  className="font-mono text-sm min-h-[100px] border-slate-300"
                />
                {errors.correctOptionsJustification && (
                  <p className="text-sm text-red-600">{errors.correctOptionsJustification}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
