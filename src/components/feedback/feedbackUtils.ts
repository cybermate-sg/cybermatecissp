import type { FeedbackItem } from "./types";

/**
 * Get badge color classes for feedback status
 */
export function getStatusBadgeColor(status: FeedbackItem["status"]) {
  const colorMap: Record<FeedbackItem["status"], string> = {
    pending: "bg-yellow-900/30 text-yellow-300 border-yellow-700",
    in_review: "bg-blue-900/30 text-blue-300 border-blue-700",
    resolved: "bg-green-900/30 text-green-300 border-green-700",
    closed: "bg-slate-700/30 text-slate-300 border-slate-600",
    rejected: "bg-red-900/30 text-red-300 border-red-700",
  };
  return colorMap[status];
}

/**
 * Get badge color classes for priority level
 */
export function getPriorityBadgeColor(priority: FeedbackItem["priority"]) {
  const colorMap: Record<FeedbackItem["priority"], string> = {
    low: "bg-slate-700/30 text-slate-300 border-slate-600",
    medium: "bg-blue-900/30 text-blue-300 border-blue-700",
    high: "bg-orange-900/30 text-orange-300 border-orange-700",
    critical: "bg-red-900/30 text-red-300 border-red-700",
  };
  return colorMap[priority];
}

/**
 * Get badge color classes for feedback type
 */
export function getTypeBadgeColor(type: FeedbackItem["feedbackType"]) {
  const colorMap: Record<FeedbackItem["feedbackType"], string> = {
    content_error: "bg-red-900/30 text-red-300 border-red-700",
    typo: "bg-yellow-900/30 text-yellow-300 border-yellow-700",
    unclear_explanation: "bg-blue-900/30 text-blue-300 border-blue-700",
    technical_issue: "bg-purple-900/30 text-purple-300 border-purple-700",
    general_suggestion: "bg-green-900/30 text-green-300 border-green-700",
  };
  return colorMap[type];
}

/**
 * Format type label for display
 */
export function formatTypeLabel(type: FeedbackItem["feedbackType"]) {
  return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

/**
 * Format status label for display
 */
export function formatStatusLabel(status: FeedbackItem["status"]) {
  return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

/**
 * Format priority label for display
 */
export function formatPriorityLabel(priority: FeedbackItem["priority"]) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Get content preview text from feedback item
 */
export function getContentPreview(feedback: FeedbackItem) {
  const contentSources = [
    { content: feedback.flashcard, getText: (item: typeof feedback.flashcard) => item?.question?.replace(/<[^>]*>/g, "") },
    { content: feedback.quizQuestion, getText: (item: typeof feedback.quizQuestion) => item?.questionText },
    { content: feedback.deckQuizQuestion, getText: (item: typeof feedback.deckQuizQuestion) => item?.questionText },
  ];

  for (const source of contentSources) {
    if (source.content) {
      const text = source.getText(source.content) || "";
      return text.substring(0, 100) + (text.length > 100 ? "..." : "");
    }
  }

  return "N/A";
}

/**
 * Format date string for display
 */
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
