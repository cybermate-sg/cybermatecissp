import Image from "next/image";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedbackItem } from "./types";
import {
  getStatusBadgeColor,
  getPriorityBadgeColor,
  getTypeBadgeColor,
  formatTypeLabel,
  formatStatusLabel,
  formatPriorityLabel,
  getContentPreview,
  formatDate,
} from "./feedbackUtils";

interface FeedbackItemRowProps {
  feedback: FeedbackItem;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

export default function FeedbackItemRow({
  feedback,
  isExpanded,
  onToggle,
  onSelect,
}: FeedbackItemRowProps) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
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
              onClick={onToggle}
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
              onClick={onSelect}
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
}
