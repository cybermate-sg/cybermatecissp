"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackUser {
  clerkUserId: string;
  email: string;
  name: string | null;
}

interface FeedbackContent {
  id: string;
  question?: string;
  questionText?: string;
  answer?: string;
  name?: string;
  deckId?: string;
  flashcardId?: string;
}

interface FeedbackItem {
  id: string;
  feedbackType: "content_error" | "typo" | "unclear_explanation" | "technical_issue" | "general_suggestion";
  feedbackText: string;
  status: "pending" | "in_review" | "resolved" | "closed" | "rejected";
  priority: "low" | "medium" | "high" | "critical";
  screenshotUrl: string | null;
  screenshotKey: string | null;
  userAgent: string | null;
  pageUrl: string | null;
  adminResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: FeedbackUser;
  resolver: FeedbackUser | null;
  flashcard?: FeedbackContent | null;
  quizQuestion?: FeedbackContent | null;
  deckQuizQuestion?: FeedbackContent | null;
  deck?: FeedbackContent | null;
  class?: FeedbackContent | null;
}

interface FeedbackListProps {
  initialFeedback: FeedbackItem[];
  onSelectFeedback: (feedback: FeedbackItem) => void | Promise<void>;
  onFilterChange?: (filters: FeedbackFilters) => void;
}

export interface FeedbackFilters {
  status?: string;
  type?: string;
  priority?: string;
}

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

  const getStatusBadgeColor = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
      case "in_review":
        return "bg-blue-900/30 text-blue-300 border-blue-700";
      case "resolved":
        return "bg-green-900/30 text-green-300 border-green-700";
      case "closed":
        return "bg-slate-700/30 text-slate-300 border-slate-600";
      case "rejected":
        return "bg-red-900/30 text-red-300 border-red-700";
    }
  };

  const getPriorityBadgeColor = (priority: FeedbackItem["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-slate-700/30 text-slate-300 border-slate-600";
      case "medium":
        return "bg-blue-900/30 text-blue-300 border-blue-700";
      case "high":
        return "bg-orange-900/30 text-orange-300 border-orange-700";
      case "critical":
        return "bg-red-900/30 text-red-300 border-red-700";
    }
  };

  const getTypeBadgeColor = (type: FeedbackItem["feedbackType"]) => {
    switch (type) {
      case "content_error":
        return "bg-red-900/30 text-red-300 border-red-700";
      case "typo":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
      case "unclear_explanation":
        return "bg-blue-900/30 text-blue-300 border-blue-700";
      case "technical_issue":
        return "bg-purple-900/30 text-purple-300 border-purple-700";
      case "general_suggestion":
        return "bg-green-900/30 text-green-300 border-green-700";
    }
  };

  const formatTypeLabel = (type: FeedbackItem["feedbackType"]) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatStatusLabel = (status: FeedbackItem["status"]) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatPriorityLabel = (priority: FeedbackItem["priority"]) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getContentPreview = (feedback: FeedbackItem) => {
    if (feedback.flashcard) {
      const text = feedback.flashcard.question?.replace(/<[^>]*>/g, "") || "";
      return text.substring(0, 100) + (text.length > 100 ? "..." : "");
    }
    if (feedback.quizQuestion) {
      return feedback.quizQuestion.questionText?.substring(0, 100) || "";
    }
    if (feedback.deckQuizQuestion) {
      return feedback.deckQuizQuestion.questionText?.substring(0, 100) || "";
    }
    return "N/A";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <select
            id="statusFilter"
            value={filters.status || "all"}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label htmlFor="typeFilter" className="block text-sm font-medium text-slate-300 mb-2">
            Type
          </label>
          <select
            id="typeFilter"
            value={filters.type || "all"}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="content_error">Content Error</option>
            <option value="typo">Typo</option>
            <option value="unclear_explanation">Unclear Explanation</option>
            <option value="technical_issue">Technical Issue</option>
            <option value="general_suggestion">General Suggestion</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label htmlFor="priorityFilter" className="block text-sm font-medium text-slate-300 mb-2">
            Priority
          </label>
          <select
            id="priorityFilter"
            value={filters.priority || "all"}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      {initialFeedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-lg text-slate-400">No feedback found</p>
          <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialFeedback.map((feedback) => {
            const isExpanded = expandedRows.has(feedback.id);
            return (
              <div
                key={feedback.id}
                className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors"
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 space-y-2">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeColor(feedback.status)}`}>
                          {formatStatusLabel(feedback.status)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityBadgeColor(feedback.priority)}`}>
                          {formatPriorityLabel(feedback.priority)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeBadgeColor(feedback.feedbackType)}`}>
                          {formatTypeLabel(feedback.feedbackType)}
                        </span>
                      </div>

                      {/* User and Date */}
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{feedback.user.name || feedback.user.email}</span>
                        <span>•</span>
                        <span>{formatDate(feedback.createdAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleRow(feedback.id)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => onSelectFeedback(feedback)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300">
                      <span className="font-medium">Feedback:</span>{" "}
                      {isExpanded
                        ? feedback.feedbackText
                        : feedback.feedbackText.substring(0, 150) +
                          (feedback.feedbackText.length > 150 ? "..." : "")}
                    </p>

                    {isExpanded && (
                      <>
                        <p className="text-sm text-slate-400">
                          <span className="font-medium">Content:</span> {getContentPreview(feedback)}
                        </p>
                        {feedback.screenshotUrl && (
                          <div className="mt-3">
                            <p className="text-sm text-slate-400 mb-2">Screenshot:</p>
                            <Image
                              src={feedback.screenshotUrl}
                              alt="Feedback screenshot"
                              width={600}
                              height={400}
                              className="max-w-full max-h-64 rounded border border-slate-700 object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
