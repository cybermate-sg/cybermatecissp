"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import FeedbackFiltersComponent from "./FeedbackFilters";
import FeedbackItemRow from "./FeedbackItemRow";
import type { FeedbackItem, FeedbackFilters } from "./types";

interface FeedbackListProps {
  initialFeedback: FeedbackItem[];
  onSelectFeedback: (feedback: FeedbackItem) => void | Promise<void>;
  onFilterChange?: (filters: FeedbackFilters) => void;
}

export type { FeedbackFilters, FeedbackItem };

/**
 * FeedbackList component
 * Displays a paginated list of feedback submissions for admin dashboard
 *
 * Features:
 * - Filter by status, type, and priority
 * - Color-coded badges for visual scanning
 * - Expandable rows to see full feedback text
 * - Click to view full details
 */
export default function FeedbackList({
  initialFeedback,
  onSelectFeedback,
  onFilterChange,
}: FeedbackListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FeedbackFilters>({});

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleFilterChange = (key: keyof FeedbackFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === "all" ? undefined : value,
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="space-y-6">
      <FeedbackFiltersComponent filters={filters} onFilterChange={handleFilterChange} />

      {initialFeedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-lg text-slate-400">No feedback found</p>
          <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialFeedback.map((feedback) => (
            <FeedbackItemRow
              key={feedback.id}
              feedback={feedback}
              isExpanded={expandedRows.has(feedback.id)}
              onToggle={() => toggleRow(feedback.id)}
              onSelect={() => onSelectFeedback(feedback)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
