import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Flashcard to avoid SSR issues with DOMPurify
export const FlashcardDynamic = dynamic(() => import("@/components/Flashcard"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[500px]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  ),
});
