'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { QuizFile } from '@/lib/validations/quiz';
import { toast } from 'sonner';

interface AiQuizGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string, questions: QuizFile) => void;
  generationType: 'flashcard' | 'deck';
  targetFlashcardId?: string;
  targetDeckId?: string;
}

interface QuotaInfo {
  dailyUsed: number;
  dailyLimit: number;
  remaining: number;
  resetTime: string;
}

export function AiQuizGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  generationType,
  targetFlashcardId,
  targetDeckId,
}: AiQuizGenerationModalProps) {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(generationType === 'flashcard' ? 5 : 50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  // Fetch quota information when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchQuota();
    }
  }, [isOpen]);

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/admin/ai-quiz/quota');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuota({
            dailyUsed: data.data.generationsUsedToday,
            dailyLimit: data.data.dailyQuotaLimit,
            remaining: data.data.remainingGenerations,
            resetTime: data.data.resetTime,
          });

          // Update default question counts from config
          if (generationType === 'flashcard') {
            setQuestionCount(data.data.config.flashcardQuestionsDefault);
          } else {
            setQuestionCount(data.data.config.deckQuestionsDefault);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  };

  const handleGenerate = async () => {
    // Validate topic
    if (topic.trim().length < 3) {
      setError('Please enter a topic (at least 3 characters)');
      return;
    }

    if (topic.trim().length > 500) {
      setError('Topic must be less than 500 characters');
      return;
    }

    // Check quota
    if (quota && quota.remaining <= 0) {
      setError(`Daily quota exceeded. Resets at ${new Date(quota.resetTime).toLocaleTimeString()}`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedQuestions(null);

    try {
      const response = await fetch('/api/admin/ai-quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          generationType,
          customQuestionCount: questionCount,
          targetFlashcardId,
          targetDeckId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      if (data.success) {
        setGeneratedQuestions(data.data.questions);

        // Update quota
        if (data.remainingQuota) {
          setQuota(data.remainingQuota);
        }

        toast.success(`Successfully generated ${data.data.questions.questions.length} questions!`);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseQuestions = () => {
    if (generatedQuestions) {
      onGenerate(topic, generatedQuestions);
      handleClose();
    }
  };

  const handleClose = () => {
    setTopic('');
    setGeneratedQuestions(null);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setGeneratedQuestions(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Quiz Generation
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Generate CISSP-style quiz questions using AI. Enter a topic and customize the number of questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Quota Display */}
          {quota && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-900">Daily Quota:</span>
                  <span className="ml-2 text-blue-700">
                    {quota.dailyUsed} / {quota.dailyLimit} used
                  </span>
                </div>
                <div className="text-xs text-blue-600">
                  {quota.remaining} remaining
                </div>
              </div>
            </div>
          )}

          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-base font-semibold">
              Topic
            </Label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g., SAML 2.0 authentication, Risk management frameworks, etc."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-white border-slate-300"
              disabled={isGenerating}
              maxLength={500}
            />
            <p className="text-xs text-slate-500">
              {topic.length} / 500 characters
            </p>
          </div>

          {/* Question Count Selector */}
          <div className="space-y-2">
            <Label htmlFor="questionCount" className="text-base font-semibold">
              Number of Questions
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="questionCount"
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                className="bg-white border-slate-300 w-24"
                disabled={isGenerating}
              />
              <span className="text-sm text-slate-600">
                (1-50 questions)
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && !generatedQuestions && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="text-red-700 hover:text-red-900 hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Success Display */}
          {generatedQuestions && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  Successfully generated {generatedQuestions.questions.length} questions!
                </p>
              </div>

              {/* Preview first 2 questions */}
              <div className="space-y-3 mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-green-700 font-medium">Preview (first 2 questions):</p>
                {generatedQuestions.questions.slice(0, 2).map((q, idx) => (
                  <div key={idx} className="text-xs text-green-800 bg-white p-2 rounded border border-green-100">
                    <p className="font-medium">Q{idx + 1}: {q.question}</p>
                    <p className="text-green-600 ml-2 mt-1">
                      {q.options.length} options, {q.options.filter(o => o.isCorrect).length} correct
                    </p>
                  </div>
                ))}
                {generatedQuestions.questions.length > 2 && (
                  <p className="text-xs text-green-600 italic">
                    + {generatedQuestions.questions.length - 2} more questions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>

            {generatedQuestions ? (
              <Button
                onClick={handleUseQuestions}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Use These Questions
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || (quota?.remaining === 0)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Questions
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
