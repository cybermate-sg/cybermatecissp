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
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (deck.progress / 100) * circumference;

  return (
    <div
      className={`
        relative group bg-slate-800/80 rounded-xl border p-3
        transition-all duration-300 hover:bg-slate-800
        ${isSelected ? 'border-blue-500' : 'border-gray-700 hover:border-blue-400'}
        ${deck.isRecommended ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}
      `}
    >
      {/* Recommended ribbon */}
      {deck.isRecommended && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
          ⭐ Recommended
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 cursor-pointer"
          aria-label="Select deck"
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-blue-500 border-blue-500 shadow-md'
              : 'border-gray-600 hover:border-blue-400'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </button>

        {/* Deck icon */}
        <div className="flex-shrink-0">
          {isQuiz ? (
            <div className="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-green-900/50 flex items-center justify-center">
              <Layers className="w-6 h-6 text-green-400" />
            </div>
          )}
        </div>

        {/* Deck info */}
        <div className="flex-1 min-w-0">
          {/* Deck title */}
          <h3 className="text-base font-bold text-white mb-0.5 line-clamp-1">
            {deck.name}
          </h3>

          {/* Progress info with badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-400">
              {isQuiz ? (
                <span>{deck.studiedCount} of {deck.cardCount} questions attempted</span>
              ) : (
                <span>{deck.studiedCount} of {deck.cardCount} cards completed</span>
              )}
            </p>
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
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Progress circle and play button */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2">
          {/* Circular progress indicator */}
          <div className="relative w-14 h-14">
            <svg className="transform -rotate-90 w-14 h-14">
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke="#374151"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                stroke={isMastered ? '#facc15' : '#3b82f6'}
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${isMastered ? 'text-yellow-400' : 'text-blue-400'}`}>
                {deck.progress}%
              </span>
            </div>
          </div>

          {/* Play button */}
          <Link href={`/dashboard/deck/${deck.id}?mode=${studyMode}`}>
            <button
              className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group-hover:scale-110"
              aria-label="Start studying"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
