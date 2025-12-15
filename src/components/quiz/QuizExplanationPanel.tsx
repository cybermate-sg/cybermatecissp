"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Target, Scale, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizExplanationPanelProps {
  explanation: string | null;
  eliminationTactics?: Record<string, string> | null;
  correctJustification?: Record<string, string> | null;
  compareOptions?: Record<string, string> | null;
  className?: string;
}

export function QuizExplanationPanel({
  explanation,
  eliminationTactics,
  correctJustification,
  compareOptions,
  className,
}: QuizExplanationPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    explanation: true,
    elimination: false,
    justification: false,
    compare: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Strip HTML from explanation text
  const cleanExplanation = explanation
    ? explanation.replace(/<[^>]*>/g, "").trim()
    : null;

  const hasContent =
    cleanExplanation ||
    eliminationTactics ||
    correctJustification ||
    compareOptions;

  if (!hasContent) return null;

  return (
    <div
      className={cn(
        "mt-6 space-y-3 p-5 md:p-6 rounded-xl bg-blue-900/30 border border-blue-500/30",
        className
      )}
    >
      {/* Main Explanation */}
      {cleanExplanation && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("explanation")}
            className="flex items-center justify-between w-full text-left group"
            aria-expanded={expandedSections.explanation}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-400" />
              <h4 className="text-base font-semibold text-blue-200">
                Explanation
              </h4>
            </div>
            {expandedSections.explanation ? (
              <ChevronUp className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            )}
          </button>

          {expandedSections.explanation && (
            <div className="pl-7 text-sm md:text-base text-blue-100 leading-relaxed whitespace-pre-wrap">
              {cleanExplanation}
            </div>
          )}
        </div>
      )}

      {/* Elimination Tactics */}
      {eliminationTactics && Object.keys(eliminationTactics).length > 0 && (
        <div className="space-y-2 pt-3 border-t border-blue-500/20">
          <button
            onClick={() => toggleSection("elimination")}
            className="flex items-center justify-between w-full text-left group"
            aria-expanded={expandedSections.elimination}
          >
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-400" />
              <h4 className="text-base font-semibold text-blue-200">
                Elimination Tactics
              </h4>
            </div>
            {expandedSections.elimination ? (
              <ChevronUp className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            )}
          </button>

          {expandedSections.elimination && (
            <div className="pl-7 space-y-3">
              {Object.entries(eliminationTactics).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-semibold text-red-300">{key}</p>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Correct Answer Justification */}
      {correctJustification && Object.keys(correctJustification).length > 0 && (
        <div className="space-y-2 pt-3 border-t border-blue-500/20">
          <button
            onClick={() => toggleSection("justification")}
            className="flex items-center justify-between w-full text-left group"
            aria-expanded={expandedSections.justification}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <h4 className="text-base font-semibold text-blue-200">
                Correct Answer Justification
              </h4>
            </div>
            {expandedSections.justification ? (
              <ChevronUp className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            )}
          </button>

          {expandedSections.justification && (
            <div className="pl-7 space-y-3">
              {Object.entries(correctJustification).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-semibold text-green-300">{key}</p>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compare Remaining Options */}
      {compareOptions && Object.keys(compareOptions).length > 0 && (
        <div className="space-y-2 pt-3 border-t border-blue-500/20">
          <button
            onClick={() => toggleSection("compare")}
            className="flex items-center justify-between w-full text-left group"
            aria-expanded={expandedSections.compare}
          >
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan-400" />
              <h4 className="text-base font-semibold text-blue-200">
                Compare Options
              </h4>
            </div>
            {expandedSections.compare ? (
              <ChevronUp className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
            )}
          </button>

          {expandedSections.compare && (
            <div className="pl-7 space-y-3">
              {Object.entries(compareOptions).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-semibold text-cyan-300">{key}</p>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
