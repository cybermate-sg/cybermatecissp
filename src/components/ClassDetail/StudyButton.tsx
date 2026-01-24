import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface StudyButtonProps {
  classId: string;
  studyMode: string;
  onlyQuizDecks: boolean;
  hasBothTypes: boolean;
  flashcardDeckIds: string[];
  quizDeckNames: string[];
}

export function StudyButton({
  classId,
  studyMode,
  onlyQuizDecks,
  hasBothTypes,
  flashcardDeckIds,
  quizDeckNames,
}: StudyButtonProps) {
  if (onlyQuizDecks) {
    return (
      <div>
        <Button
          size="lg"
          disabled
          className="w-full bg-gray-400 text-white font-semibold text-base py-6 mb-2 cursor-not-allowed"
        >
          <Play className="w-5 h-5 mr-2 fill-white" />
          STUDY
        </Button>
        <p className="text-sm text-amber-800 bg-amber-50/95 px-3 py-2 rounded mb-6 border border-amber-200">
          Quiz decks cannot be studied in class mode. Use the quick play button on each quiz deck to take the test.
        </p>
      </div>
    );
  }

  const studyUrl = flashcardDeckIds.length > 0
    ? `/dashboard/class/${classId}/study?mode=${studyMode}&decks=${flashcardDeckIds.join(',')}`
    : `/dashboard/class/${classId}/study?mode=${studyMode}`;

  return (
    <div>
      <Link href={studyUrl}>
        <Button
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 mb-2"
        >
          <Play className="w-5 h-5 mr-2 fill-white" />
          STUDY
        </Button>
      </Link>
      {/* {hasBothTypes && (
        <p className="text-sm text-blue-900 bg-blue-50/95 px-3 py-2 rounded mb-6 border border-blue-200 flex items-start gap-2">
          <span className="text-blue-600 font-semibold flex-shrink-0">ℹ️</span>
          <span>
            <strong>{flashcardDeckIds.length} flashcard deck{flashcardDeckIds.length !== 1 ? "s" : ""}</strong> will be studied.
            Quiz deck{quizDeckNames.length !== 1 ? "s" : ""} ({quizDeckNames.join(", ")}) should be accessed via {quizDeckNames.length !== 1 ? "their" : "its"} quick play button.
          </span>
        </p>
      )} */}
      {!hasBothTypes && <div className="mb-6" />}
    </div>
  );
}
