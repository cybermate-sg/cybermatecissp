"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Mail, Trash2 } from "lucide-react";
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

interface FeedbackDetailItem {
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

interface FeedbackDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: FeedbackDetailItem | null;
  onUpdate: () => void;
  onDelete: () => void;
}

/**
 * FeedbackDetailModal component
 * Displays full feedback details and allows admin to update status, priority, and add responses
 *
 * Features:
 * - View complete feedback information
 * - Update status, priority, and admin response
 * - Delete feedback
 * - Email notification on status change to resolved/closed
 */
export default function FeedbackDetailModal({
  isOpen,
  onClose,
  feedback,
  onUpdate,
  onDelete,
}: FeedbackDetailModalProps) {
  const [status, setStatus] = useState(feedback?.status || "pending");
  const [priority, setPriority] = useState(feedback?.priority || "medium");
  const [adminResponse, setAdminResponse] = useState(feedback?.adminResponse || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !feedback) return null;

  const handleClose = () => {
    if (!isUpdating && !isDeleting) {
      onClose();
      setUpdateStatus("idle");
      setErrorMessage("");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUpdating(true);
    setUpdateStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          priority,
          adminResponse: adminResponse.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update feedback");
      }

      setUpdateStatus("success");
      onUpdate();

      // Close modal after 1.5 seconds on success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update feedback");
      setUpdateStatus("error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setUpdateStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete feedback");
      }

      onDelete();
      handleClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete feedback");
      setUpdateStatus("error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getContentInfo = () => {
    if (feedback.flashcard) {
      return {
        type: "Flashcard",
        preview: feedback.flashcard.question?.replace(/<[^>]*>/g, "").substring(0, 200),
      };
    }
    if (feedback.quizQuestion) {
      return {
        type: "Quiz Question",
        preview: feedback.quizQuestion.questionText?.substring(0, 200),
      };
    }
    if (feedback.deckQuizQuestion) {
      return {
        type: "Deck Quiz Question",
        preview: feedback.deckQuizQuestion.questionText?.substring(0, 200),
      };
    }
    return { type: "Unknown", preview: "N/A" };
  };

  const contentInfo = getContentInfo();
  const statusChanged = status !== feedback.status;
  const willSendEmail = statusChanged && (status === "resolved" || status === "closed");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Feedback Details</h2>
            <p className="text-sm text-slate-400 mt-1">ID: {feedback.id}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUpdating || isDeleting}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close feedback detail modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Success Message */}
          {updateStatus === "success" && (
            <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Feedback updated successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {updateStatus === "error" && errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Email Notification Warning */}
          {willSendEmail && (
            <div className="flex items-center gap-3 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300">
              <Mail className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                An email notification will be sent to the user when you save this change.
              </p>
            </div>
          )}

          {/* User Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">User Information</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Name:</span>
                <span className="text-sm text-white">{feedback.user.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Email:</span>
                <span className="text-sm text-white">{feedback.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Submitted:</span>
                <span className="text-sm text-white">{formatDate(feedback.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Feedback Content */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Feedback</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-slate-400">Type:</span>
                <p className="text-sm text-white mt-1 capitalize">
                  {feedback.feedbackType.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-400">Message:</span>
                <p className="text-sm text-white mt-1 whitespace-pre-wrap">{feedback.feedbackText}</p>
              </div>
              {feedback.screenshotUrl && (
                <div>
                  <span className="text-sm text-slate-400 block mb-2">Screenshot:</span>
                  <img
                    src={feedback.screenshotUrl}
                    alt="Feedback screenshot"
                    className="max-w-full max-h-96 rounded border border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Related Content */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Related Content</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Content Type:</span>
                <span className="text-sm text-white">{contentInfo.type}</span>
              </div>
              <div>
                <span className="text-sm text-slate-400">Preview:</span>
                <p className="text-sm text-white mt-1">{contentInfo.preview}</p>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <h3 className="text-lg font-medium text-white">Admin Actions</h3>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-slate-300">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                disabled={isUpdating || isDeleting || updateStatus === "success"}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label htmlFor="priority" className="block text-sm font-medium text-slate-300">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                disabled={isUpdating || isDeleting || updateStatus === "success"}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Admin Response */}
            <div className="space-y-2">
              <label htmlFor="adminResponse" className="block text-sm font-medium text-slate-300">
                Admin Response (Optional)
              </label>
              <textarea
                id="adminResponse"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                disabled={isUpdating || isDeleting || updateStatus === "success"}
                placeholder="Add a response to the user (included in email notification)"
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
              />
              <div className="text-xs text-slate-400 text-right">{adminResponse.length}/1000</div>
            </div>

            {/* Resolver Info */}
            {feedback.resolver && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400">
                  Resolved by <span className="text-white">{feedback.resolver.name || feedback.resolver.email}</span> on{" "}
                  {feedback.resolvedAt && formatDate(feedback.resolvedAt)}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isUpdating || isDeleting || updateStatus === "success"}
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleClose}
              variant="ghost"
              disabled={isUpdating || isDeleting}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpdate}
              disabled={isUpdating || isDeleting || updateStatus === "success"}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : updateStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
