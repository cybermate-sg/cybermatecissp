import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface DialogHeader {
  title: string;
  description: string;
}

interface SaveAction {
  onSave: () => void;
  isSaving: boolean;
  buttonText: string;
}

interface FormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  header: DialogHeader;
  saveAction: SaveAction;
  children: ReactNode;
  maxHeight?: string;
}

export function FormDialog({
  isOpen,
  onOpenChange,
  header,
  saveAction,
  children,
  maxHeight = "none",
}: FormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{header.title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {header.description}
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-4 py-4"
          style={{
            maxHeight: maxHeight !== "none" ? maxHeight : undefined,
            overflowY: maxHeight !== "none" ? "auto" : undefined,
            paddingRight: maxHeight !== "none" ? "0.5rem" : undefined,
          }}
        >
          {children}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveAction.isSaving}
            className="border-slate-700 text-gray-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={saveAction.onSave}
            disabled={saveAction.isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saveAction.isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              saveAction.buttonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
