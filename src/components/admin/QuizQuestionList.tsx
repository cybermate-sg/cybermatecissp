'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { QuizQuestionCard } from './QuizQuestionCard';

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

interface QuizQuestionListProps {
  questions: QuizQuestion[];
  onDelete: (questionId: string) => Promise<void>;
  isLoading: boolean;
  emptyMessage?: string;
}

export function QuizQuestionList({
  questions,
  onDelete,
  isLoading,
  emptyMessage = 'No quiz questions yet. Upload a JSON file or use AI to generate questions.',
}: QuizQuestionListProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full" asChild>
        <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors group">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-semibold text-slate-800">Existing Quiz Questions</h3>
            {questions.length > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </Badge>
            )}
          </div>
          <div className="text-slate-500 group-hover:text-slate-700 transition-colors">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-slate-600">Loading questions...</span>
          </div>
        ) : questions.length === 0 ? (
          <Alert className="bg-slate-50 border-slate-300">
            <AlertDescription className="text-slate-600 text-sm">
              {emptyMessage}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuizQuestionCard
                key={question.id}
                question={question}
                index={index}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
