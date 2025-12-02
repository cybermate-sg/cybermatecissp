import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";

interface BookmarksHeaderProps {
  bookmarksCount: number;
}

export function BookmarksHeader({ bookmarksCount }: BookmarksHeaderProps) {
  return (
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
            {bookmarksCount} {bookmarksCount === 1 ? 'card' : 'cards'} bookmarked
          </p>
        </div>
        {bookmarksCount > 0 && (
          <Link href="/dashboard/bookmarks/study">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
              <GraduationCap className="w-4 h-4 mr-2" />
              Study All Bookmarks
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
