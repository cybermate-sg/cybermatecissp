"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeckQuizLoadingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeckQuizLoading({ isOpen, onClose }: DeckQuizLoadingProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogTitle className="sr-only">Loading deck quiz questions</DialogTitle>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
