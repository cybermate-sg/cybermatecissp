"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Flashcard from "@/components/Flashcard";
import { QuizModal } from "@/components/QuizModal";
import { toast } from "sonner";

interface FlashcardMedia {
  id: string;
  fileUrl: string;
  altText: string | null;
  placement: string;
  order: number;
}

interface BookmarkedCard {
  id: string;
  flashcardId: string;
  question: string;
  answer: string;
  deckId: string;
  deckName: string;
  classId: string;
  className: string;
  bookmarkedAt: string;
  media: FlashcardMedia[];
}

function BookmarkStudyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startIndex = parseInt(searchParams.get('start') || '0');

  const [bookmarks, setBookmarks] = useState<BookmarkedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showQuizModal, setShowQuizModal] = useState(false);

  const currentCard = bookmarks[currentIndex];
  const progress = bookmarks.length > 0 ? ((currentIndex + 1) / bookmarks.length) * 100 : 0;

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookmarks');
      if (!res.ok) throw new Error('Failed to load bookmarks');

      const data = await res.json();
      const bookmarkedCards = data.bookmarks || [];

      if (bookmarkedCards.length === 0) {
        toast.info("No bookmarks to study");
        router.push('/dashboard/bookmarks');
        return;
      }

      setBookmarks(bookmarkedCards);

      // Validate start index
      if (startIndex >= bookmarkedCards.length) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error("Failed to load bookmarks");
      router.push('/dashboard/bookmarks');
    } finally {
      setLoading(false);
    }
  }, [router, startIndex]);

  const handleNext = useCallback(() => {
    if (bookmarks.length === 0) return;
    // Loop to beginning when reaching the end
    setCurrentIndex((prev) => (prev + 1) % bookmarks.length);
  }, [bookmarks.length]);

  const handlePrevious = useCallback(() => {
    if (bookmarks.length === 0) return;
    // Loop to end when at beginning
    setCurrentIndex((prev) => (prev - 1 + bookmarks.length) % bookmarks.length);
  }, [bookmarks.length]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  const handleBookmarkToggle = async (flashcardId: string, isBookmarked: boolean) => {
    try {
      if (!isBookmarked) {
        // Remove bookmark
        const res = await fetch(`/api/bookmarks/${flashcardId}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to remove bookmark');

        // Remove from local state
        const updatedBookmarks = bookmarks.filter(b => b.flashcardId !== flashcardId);
        setBookmarks(updatedBookmarks);

        toast.success("Bookmark removed");

        // If no more bookmarks, redirect back
        if (updatedBookmarks.length === 0) {
          toast.info("No more bookmarks to study");
          router.push('/dashboard/bookmarks');
          return;
        }

        // Adjust current index if needed
        if (currentIndex >= updatedBookmarks.length) {
          setCurrentIndex(updatedBookmarks.length - 1);
        }
      } else {
        // This shouldn't happen in bookmark study mode, but handle it anyway
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flashcardId }),
        });

        if (!res.ok) throw new Error('Failed to add bookmark');
        toast.success("Card bookmarked!");
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleTest = () => {
    setShowQuizModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">No bookmarks found</h1>
            <Link href="/dashboard/bookmarks">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                Back to Bookmarks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/bookmarks">
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookmarks
            </Button>
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-purple-400 mb-1">{currentCard.className}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Studying Bookmarks
              </h1>
              <p className="text-gray-400">
                Card {currentIndex + 1} of {bookmarks.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Flashcard */}
        <div className="space-y-8">
          <Flashcard
            key={currentCard.flashcardId}
            flashcardId={currentCard.flashcardId}
            question={currentCard.question}
            answer={currentCard.answer}
            isBookmarked={true}
            questionImages={currentCard.media?.filter(m => m.placement === 'question').sort((a, b) => a.order - b.order).map(m => ({
              id: m.id,
              url: m.fileUrl,
              altText: m.altText,
              placement: m.placement,
              order: m.order
            }))}
            answerImages={currentCard.media?.filter(m => m.placement === 'answer').sort((a, b) => a.order - b.order).map(m => ({
              id: m.id,
              url: m.fileUrl,
              altText: m.altText,
              placement: m.placement,
              order: m.order
            }))}
            onTest={handleTest}
            onBookmarkToggle={handleBookmarkToggle}
          />

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Study Info */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">💡 Navigation Tips</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Use arrow keys (← →) to navigate between cards</li>
              <li>• Click the card to flip and see the answer</li>
              <li>• Remove bookmarks you&apos;ve mastered to focus on harder cards</li>
              <li>• Cards loop automatically - keep practicing!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {currentCard && (
        <QuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          flashcardId={currentCard.flashcardId}
          flashcardQuestion={currentCard.question}
        />
      )}
    </div>
  );
}

export default function BookmarkStudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </div>
      </div>
    }>
      <BookmarkStudyContent />
    </Suspense>
  );
}
