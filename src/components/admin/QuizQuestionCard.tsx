'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  onDelete: (questionId: string) => Promise<void>;
}

export function QuizQuestionCard({ question, index, onDelete }: QuizQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const correctCount = question.options.filter((o) => o.isCorrect).length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(question.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting question:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200 hover:border-slate-300 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Question Number Badge */}
            <div className="flex-shrink-0">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Q{index + 1}
              </Badge>
            </div>

            {/* Question Summary */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">
                {question.questionText}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{question.options.length}</span> options
                </span>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-medium text-green-700">{correctCount}</span> correct
                </span>
                {question.explanation && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-blue-600">Has explanation</span>
                  </>
                )}
                {question.difficulty && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span>Difficulty: {question.difficulty}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800"
                    title="View details"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Delete question"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expanded View (Nested Collapsible Content) */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="mt-4 pt-4 border-t border-slate-200">
              <div className="space-y-4 text-sm">
                {/* Full Question Text */}
                <div>
                  <span className="font-semibold text-slate-700 block mb-2">Question:</span>
                  <p className="text-slate-600 leading-relaxed">{question.questionText}</p>
                </div>

                {/* Options List */}
                <div>
                  <span className="font-semibold text-slate-700 block mb-2">Options:</span>
                  <ul className="space-y-2">
                    {question.options.map((option, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {option.isCorrect ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300 flex-shrink-0">
                            ✓
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-slate-600 bg-slate-50 flex-shrink-0"
                          >
                            {idx + 1}
                          </Badge>
                        )}
                        <span className={option.isCorrect ? 'font-medium text-slate-800' : 'text-slate-600'}>
                          {option.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-2">Explanation:</span>
                    <p className="text-slate-600 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {question.explanation}
                    </p>
                  </div>
                )}

                {/* Elimination Tactics */}
                {question.eliminationTactics && Object.keys(question.eliminationTactics).length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-2">
                      Elimination Tactics:
                    </span>
                    <ul className="space-y-2">
                      {Object.entries(question.eliminationTactics).map(([option, tactic], idx) => (
                        <li key={idx} className="bg-orange-50 p-2 rounded border border-orange-200">
                          <span className="font-medium text-orange-900 block">{option}</span>
                          <span className="text-orange-700 text-xs">{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-slate-500 pt-3 border-t border-slate-200 flex flex-wrap gap-3">
                  <span>Order: {question.order}</span>
                  <span>•</span>
                  <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Delete Quiz Question?</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-2">Question:</p>
              <p className="text-sm text-red-800 line-clamp-3">{question.questionText}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
