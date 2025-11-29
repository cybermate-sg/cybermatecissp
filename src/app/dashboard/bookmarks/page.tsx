"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookmarkX, Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

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
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookmarks');
      if (!res.ok) throw new Error('Failed to load bookmarks');

      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (flashcardId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${flashcardId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove bookmark');

      setBookmarks(prev => prev.filter(b => b.flashcardId !== flashcardId));
      toast.success("Bookmark removed");
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error("Failed to remove bookmark");
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                My Bookmarks
              </h1>
              <p className="text-gray-400">
                {bookmarks.length} {bookmarks.length === 1 ? 'card' : 'cards'} bookmarked
              </p>
            </div>
            {bookmarks.length > 0 && (
              <Link href="/dashboard/bookmarks/study">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Study All Bookmarks
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Empty State */}
        {bookmarks.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No bookmarks yet
            </h2>
            <p className="text-gray-400 mb-8">
              Start bookmarking cards while studying to easily find them later!
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                <GraduationCap className="w-4 h-4 mr-2" />
                Start Studying
              </Button>
            </Link>
          </div>
        ) : (
          /* Bookmarks Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500 transition-all"
              >
                {/* Class and Deck Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-400 mb-1 truncate">
                      {bookmark.className}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {bookmark.deckName}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRemoveBookmark(bookmark.flashcardId)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 -mt-2 -mr-2"
                    title="Remove bookmark"
                  >
                    <BookmarkX className="w-4 h-4" />
                  </Button>
                </div>

                {/* Question Preview */}
                <div className="mb-4">
                  <p className="text-white text-sm line-clamp-4">
                    {bookmark.question}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link href={`/dashboard/bookmarks/study?start=${bookmarks.findIndex(b => b.id === bookmark.id)}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full border-purple-400 text-purple-200 hover:bg-purple-500/10"
                    >
                      Study This Card
                    </Button>
                  </Link>
                  <Link href={`/dashboard/deck/${bookmark.deckId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-gray-400 hover:text-white text-xs"
                    >
                      View Full Deck
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
