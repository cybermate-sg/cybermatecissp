"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

interface ResumeStudyButtonProps {
  href: string;
  deckName?: string;
}

export function ResumeStudyButton({ href, deckName }: ResumeStudyButtonProps) {
  return (
    <>
      {/* Desktop version - Card in header area */}
      <div className="hidden md:block">
        <Link href={href}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Resume Studying</p>
                {deckName && (
                  <p className="text-sm text-blue-100 truncate max-w-xs">{deckName}</p>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Mobile version - Floating action button */}
      <div className="md:hidden">
        <Link href={href}>
          <button
            className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:scale-110"
            aria-label="Resume studying"
          >
            <BookOpen className="w-7 h-7" />
          </button>
        </Link>
      </div>
    </>
  );
}
