import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import { type QuizFile } from "@/lib/validations/quiz";

interface DeckFormData {
  name: string;
  description: string;
  type: 'flashcard' | 'quiz';
  order: number;
  isPremium: boolean;
  isPublished: boolean;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  type: 'flashcard' | 'quiz';
  order: number;
  isPremium: boolean;
  isPublished: boolean;
}

interface DeckFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingDeck: Deck | null;
  formData: DeckFormData;
  setFormData: (data: DeckFormData) => void;
  deckQuizData: QuizFile | null;
  deckQuizFileName: string;
  onDeckQuizFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDeckQuiz: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function DeckFormDialog({
  isOpen,
  onOpenChange,
  editingDeck,
  formData,
  setFormData,
  deckQuizData,
  deckQuizFileName,
  onDeckQuizFileSelect,
  onRemoveDeckQuiz,
  onSave,
  isSaving,
}: DeckFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingDeck ? "Edit Deck" : "Create New Deck"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {editingDeck
              ? "Update the deck details below"
              : "Add a new deck to this class"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="name">Deck Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Security Architecture and Engineering"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this deck..."
              className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Deck Type *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as 'flashcard' | 'quiz';
                setFormData({ ...formData, type: newType });
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="flashcard">Flashcard</option>
              <option value="quiz">Quiz</option>
            </select>
            <p className="text-xs text-gray-400">
              {formData.type === 'flashcard'
                ? 'Traditional flashcard deck with questions and answers'
                : 'Quiz deck with multiple-choice questions (requires JSON file upload)'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="bg-slate-900 border-slate-700 text-white"
              min={0}
            />
            <p className="text-xs text-gray-400">
              Lower numbers appear first in the list
            </p>
          </div>

          {formData.type === 'quiz' && (
            <div className="space-y-2">
              <Label htmlFor="deckQuiz">
                Quiz Questions File {formData.type === 'quiz' && '*'}
              </Label>
              <p className="text-xs text-gray-400">
                Upload a JSON file with multiple-choice questions for this quiz deck
              </p>

              <Input
                id="deckQuiz"
                type="file"
                accept=".json"
                onChange={onDeckQuizFileSelect}
                className="bg-slate-900 border-slate-700 text-white cursor-pointer"
              />

              {deckQuizData && (
                <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-300">
                        ✓ {deckQuizData.questions.length} question{deckQuizData.questions.length !== 1 ? 's' : ''} loaded
                      </p>
                      <p className="text-xs text-blue-400 mt-1">{deckQuizFileName}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onRemoveDeckQuiz}
                      className="text-blue-300 hover:text-blue-100 hover:bg-blue-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-700">
                    <p className="text-xs text-blue-300 font-medium mb-1">Preview:</p>
                    <div className="space-y-1">
                      {deckQuizData.questions.slice(0, 2).map((q, idx) => (
                        <div key={idx} className="text-xs text-blue-200">
                          <p className="font-medium">Q{idx + 1}: {q.question}</p>
                          <p className="text-blue-400 ml-2 mt-0.5">
                            {q.options.length} options, {q.options.filter(o => o.isCorrect).length} correct
                          </p>
                        </div>
                      ))}
                      {deckQuizData.questions.length > 2 && (
                        <p className="text-xs text-blue-400 italic">
                          +{deckQuizData.questions.length - 2} more question(s)...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between py-2 px-3 bg-slate-900 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isPremium">Premium Content</Label>
              <p className="text-xs text-gray-400">
                Requires paid subscription to access
              </p>
            </div>
            <Switch
              id="isPremium"
              checked={formData.isPremium}
              onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-slate-900 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">Published</Label>
              <p className="text-xs text-gray-400">
                Make this deck visible to users
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="border-slate-700 text-gray-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>{editingDeck ? "Update" : "Create"} Deck</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
