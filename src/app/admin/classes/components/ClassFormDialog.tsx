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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ClassFormData {
  name: string;
  description: string;
  order: number;
  icon: string;
  color: string;
  isPublished: boolean;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  order: number;
  icon: string | null;
  color: string | null;
  isPublished: boolean;
}

interface ClassFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass: Class | null;
  formData: ClassFormData;
  setFormData: (data: ClassFormData) => void;
  onSave: () => void;
  isSaving: boolean;
}

const ICON_OPTIONS = [
  { value: "🔐", label: "Lock" },
  { value: "🛡️", label: "Shield" },
  { value: "🔒", label: "Secure Lock" },
  { value: "🌐", label: "Globe" },
  { value: "💻", label: "Computer" },
  { value: "🔑", label: "Key" },
  { value: "🎯", label: "Target" },
  { value: "📊", label: "Chart" },
  { value: "🏢", label: "Building" },
  { value: "⚙️", label: "Gear" },
  { value: "📚", label: "Books" },
  { value: "🎓", label: "Graduation" },
];

const COLOR_OPTIONS = [
  { value: "purple", label: "Purple" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "pink", label: "Pink" },
  { value: "indigo", label: "Indigo" },
  { value: "teal", label: "Teal" },
];

export function ClassFormDialog({
  isOpen,
  onOpenChange,
  editingClass,
  formData,
  setFormData,
  onSave,
  isSaving,
}: ClassFormDialogProps) {
  const isEditMode = Boolean(editingClass);
  const dialogTitle = isEditMode ? "Edit Class" : "Create New Class";
  const dialogDescription = isEditMode
    ? "Update the class details below"
    : "Add a new class to your CISSP study platform";
  const saveButtonText = isEditMode ? "Update" : "Create";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Security and Risk Management"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this class..."
              className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-slate-700"
                    >
                      {option.value} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color Theme</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-slate-700"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="flex items-center justify-between py-2 px-3 bg-slate-900 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">Published</Label>
              <p className="text-xs text-gray-400">
                Make this class visible to users
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
              <>{saveButtonText} Class</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
