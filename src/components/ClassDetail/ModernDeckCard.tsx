"use client";

import Link from "next/link";
import { Layers, Target, Shield, Play, Check } from "lucide-react";

interface DeckInfo {
  id: string;
  name: string;
  type: 'flashcard' | 'quiz';
  cardCount: number;
  studiedCount: number;
  progress: number;
  order: number;
  domain?: number | null;
  domainName?: string;
  dayNumber?: number | null;
  isRecommended?: boolean;
}

interface ModernDeckCardProps {
  deck: DeckInfo;
  isSelected: boolean;
  onToggle: () => void;
  studyMode: string;
}

export function ModernDeckCard({ deck, isSelected, onToggle, studyMode }: ModernDeckCardProps) {
  const isMastered = deck.progress >= 90;
  const isQuiz = deck.type === 'quiz';

  // Calculate circular progress for the progress ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (deck.progress / 100) * circumference;

  return (
    <div
      className={`
        relative group bg-white rounded-2xl border-2 p-6
        transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1
        ${isSelected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200 hover:border-blue-300'}
        ${deck.isRecommended ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
      `}
    >
      {/* Recommended ribbon */}
      {deck.isRecommended && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
          ⭐ Recommended
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-1 cursor-pointer"
          aria-label="Select deck"
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-blue-500 border-blue-500 shadow-md'
              : 'border-gray-300 hover:border-blue-400'
          }`}>
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </button>

        {/* Deck icon */}
        <div className="flex-shrink-0">
          {isQuiz ? (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
              <Target className="w-7 h-7 text-blue-600" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm">
              <Layers className="w-7 h-7 text-green-600" />
            </div>
          )}
        </div>

        {/* Deck info */}
        <div className="flex-1 min-w-0">
          {/* Deck title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
            {deck.name}
          </h3>

          {/* Domain tag */}
          {deck.domain && deck.domainName && (
            <p className="text-sm text-gray-600 mb-2">
              Domain {deck.domain} – {deck.domainName}
            </p>
          )}

          {/* Progress info */}
          <p className="text-sm text-gray-500">
            {isQuiz ? (
              <span>{deck.studiedCount} of {deck.cardCount} questions attempted</span>
            ) : (
              <span>{deck.studiedCount} of {deck.cardCount} cards mastered</span>
            )}
          </p>

          {/* Type badge and Mastered badge */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isQuiz
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isQuiz ? '🎯 Quiz' : '📚 Flashcard'}
            </span>
            {isMastered && (
              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full border border-yellow-300">
                <Shield className="w-3 h-3" />
                Mastered
              </span>
            )}
          </div>
        </div>

        {/* Progress circle and play button */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3">
          {/* Circular progress indicator */}
          <div className="relative w-16 h-16">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={isMastered ? '#facc15' : '#3b82f6'}
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${isMastered ? 'text-yellow-600' : 'text-blue-600'}`}>
                {deck.progress}%
              </span>
            </div>
          </div>

          {/* Play button */}
          <Link href={`/dashboard/deck/${deck.id}?mode=${studyMode}`}>
            <button
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group-hover:scale-110"
              aria-label="Start studying"
            >
              <Play className="w-5 h-5 fill-white" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
