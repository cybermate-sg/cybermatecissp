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

interface Deck {
  id: string;
  name: string;
  cardCount: number;
}

interface DeleteDeckDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deck: Deck | null;
  onConfirm: () => void;
  isSaving: boolean;
}

export function DeleteDeckDialog({
  isOpen,
  onOpenChange,
  deck,
  onConfirm,
  isSaving,
}: DeleteDeckDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Delete Deck</DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to delete &quot;{deck?.name}&quot;?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">
              <strong>Warning:</strong> This will permanently delete the deck and all its flashcards.
              This action cannot be undone.
            </p>
            {deck && deck.cardCount > 0 && (
              <p className="text-sm text-red-300 mt-2">
                This deck contains {deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''} which will also be deleted.
              </p>
            )}
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
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Deck"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
