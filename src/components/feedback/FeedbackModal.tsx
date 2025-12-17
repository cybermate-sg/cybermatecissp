"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardId?: string;
  quizQuestionId?: string;
  deckQuizQuestionId?: string;
  deckId?: string;
  classId?: string;
}

type FeedbackType =
  | "content_error"
  | "typo"
  | "unclear_explanation"
  | "technical_issue"
  | "general_suggestion";

interface UploadedScreenshot {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * FeedbackModal component
 * Displays a modal for users to submit feedback about flashcards or quiz questions
 *
 * Features:
 * - Feedback type selection
 * - Text area for detailed feedback
 * - Optional screenshot upload
 * - Rate limiting (10 submissions per hour)
 * - Success and error states
 */
export default function FeedbackModal({
  isOpen,
  onClose,
  flashcardId,
  quizQuestionId,
  deckQuizQuestionId,
  deckId,
  classId,
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("content_error");
  const [feedbackText, setFeedbackText] = useState("");
  const [screenshot, setScreenshot] = useState<UploadedScreenshot | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting && !isUploading) {
      onClose();
      // Reset form after a short delay to avoid visual glitches
      setTimeout(() => {
        setFeedbackType("content_error");
        setFeedbackText("");
        setScreenshot(null);
        setSubmitStatus("idle");
        setErrorMessage("");
      }, 300);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      setSubmitStatus("error");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Invalid file type. Allowed types: JPEG, PNG, WebP");
      setSubmitStatus("error");
      return;
    }

    setIsUploading(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/feedback/upload-screenshot", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload screenshot");
      }

      setScreenshot({
        url: data.url,
        key: data.key,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload screenshot");
      setSubmitStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (feedbackText.trim().length < 10) {
      setErrorMessage("Please provide at least 10 characters of feedback");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcardId: flashcardId || null,
          quizQuestionId: quizQuestionId || null,
          deckQuizQuestionId: deckQuizQuestionId || null,
          deckId: deckId || null,
          classId: classId || null,
          feedbackType,
          feedbackText: feedbackText.trim(),
          screenshot: screenshot || null,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitStatus("success");

      // Close modal after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit feedback");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypeOptions = [
    { value: "content_error", label: "Content Error" },
    { value: "typo", label: "Typo" },
    { value: "unclear_explanation", label: "Unclear Explanation" },
    { value: "technical_issue", label: "Technical Issue" },
    { value: "general_suggestion", label: "General Suggestion" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Submit Feedback</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isUploading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close feedback modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {submitStatus === "success" && (
            <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Thank you for your feedback! Our team will review it shortly.</p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === "error" && errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Feedback Type */}
          <div className="space-y-2">
            <label htmlFor="feedbackType" className="block text-sm font-medium text-slate-300">
              Issue Type <span className="text-red-400">*</span>
            </label>
            <select
              id="feedbackType"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
              disabled={isSubmitting || submitStatus === "success"}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {feedbackTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label htmlFor="feedbackText" className="block text-sm font-medium text-slate-300">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="feedbackText"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={isSubmitting || submitStatus === "success"}
              placeholder="Please describe the issue or provide your feedback (minimum 10 characters)"
              rows={6}
              maxLength={500}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{feedbackText.length < 10 ? `${10 - feedbackText.length} more characters required` : "Minimum requirement met"}</span>
              <span>{feedbackText.length}/500</span>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Screenshot (Optional)
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Upload a screenshot to help us understand the issue better (max 5MB, JPEG/PNG/WebP)
            </p>

            {!screenshot ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={isUploading || isSubmitting || submitStatus === "success"}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Choose Image</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{screenshot.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {(screenshot.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  disabled={isSubmitting || submitStatus === "success"}
                  className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  aria-label="Remove screenshot"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              onClick={handleClose}
              variant="ghost"
              disabled={isSubmitting || isUploading}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isUploading ||
                submitStatus === "success" ||
                feedbackText.trim().length < 10
              }
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submitted
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
