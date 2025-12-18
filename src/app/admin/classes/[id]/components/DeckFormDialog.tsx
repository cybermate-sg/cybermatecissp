import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type QuizFile } from "@/lib/validations/quiz";
import { QuizFileUpload } from "./QuizFileUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";

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

interface QuizFileProps {
  data: QuizFile | null;
  fileName: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

interface DialogState {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SaveAction {
  onSave: () => void;
  isSaving: boolean;
}

interface FormState {
  data: DeckFormData;
  onChange: (data: DeckFormData) => void;
}

interface DeckFormDialogProps {
  dialog: DialogState;
  deck: Deck | null;
  form: FormState;
  quizFile: QuizFileProps;
  saveAction: SaveAction;
}

export function DeckFormDialog({
  dialog,
  deck,
  form,
  quizFile,
  saveAction,
}: DeckFormDialogProps) {
  const { data: formData, onChange: setFormData } = form;
  const isEditMode = Boolean(deck);
  const dialogTitle = isEditMode ? "Edit Deck" : "Create New Deck";
  const dialogDescription = isEditMode
    ? "Update the deck details below"
    : "Add a new deck to this class";
  const saveButtonText = isEditMode ? "Update" : "Create";

  return (
    <FormDialog
      isOpen={dialog.isOpen}
      onOpenChange={dialog.onOpenChange}
      header={{
        title: dialogTitle,
        description: dialogDescription,
      }}
      saveAction={{
        onSave: saveAction.onSave,
        isSaving: saveAction.isSaving,
        buttonText: `${saveButtonText} Deck`,
      }}
      maxHeight="60vh"
    >
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
        <RichTextEditor
          label="Description"
          content={formData.description}
          onChange={(html) => setFormData({ ...formData, description: html })}
          placeholder="Brief description of this deck... You can use formatting, lists, and tables."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Deck Type *</Label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'flashcard' | 'quiz' })}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="flashcard">Flashcard</option>
          <option value="quiz">Quiz</option>
        </select>
        <p className="text-xs text-gray-400">
          {formData.type === 'quiz'
            ? 'Quiz deck with multiple-choice questions (requires JSON file upload)'
            : 'Traditional flashcard deck with questions and answers'}
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
        <QuizFileUpload
          quizData={quizFile.data}
          fileName={quizFile.fileName}
          onFileSelect={quizFile.onFileSelect}
          onRemove={quizFile.onRemove}
          isRequired
        />
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
    </FormDialog>
  );
}
