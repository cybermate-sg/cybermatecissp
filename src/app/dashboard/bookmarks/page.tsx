"use client";

import { useBookmarks } from "./hooks/useBookmarks";
import { BookmarkCard } from "./components/BookmarkCard";
import { EmptyBookmarksState } from "./components/EmptyBookmarksState";
import { LoadingState } from "./components/LoadingState";
import { BookmarksHeader } from "./components/BookmarksHeader";

export default function BookmarksPage() {
  const { bookmarks, loading, handleRemoveBookmark } = useBookmarks();

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookmarksHeader bookmarksCount={bookmarks.length} />

        {bookmarks.length === 0 ? (
          <EmptyBookmarksState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                bookmarks={bookmarks}
                onRemove={handleRemoveBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
