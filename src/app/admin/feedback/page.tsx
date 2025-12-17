"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import FeedbackList, { FeedbackFilters } from "@/components/feedback/FeedbackList";
import FeedbackDetailModal from "@/components/feedback/FeedbackDetailModal";

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

interface FeedbackStats {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
}

/**
 * Admin Feedback Page
 * Displays all user feedback submissions with filtering and management capabilities
 *
 * Features:
 * - View all feedback with filters
 * - Update feedback status, priority, and responses
 * - Delete feedback
 * - Statistics overview
 */
export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
  });
  const [filters, setFilters] = useState<FeedbackFilters>({});

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.priority) params.append("priority", filters.priority);
      params.append("limit", "50");
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "desc");

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load feedback");

      const data = await res.json();
      setFeedback(data.feedback || []);

      // Calculate stats
      const allFeedback = data.feedback || [];
      setStats({
        total: allFeedback.length,
        pending: allFeedback.filter((f: FeedbackItem) => f.status === "pending").length,
        inReview: allFeedback.filter((f: FeedbackItem) => f.status === "in_review").length,
        resolved: allFeedback.filter((f: FeedbackItem) => f.status === "resolved").length,
      });
    } catch (error) {
      toast.error("Failed to load feedback");
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFeedback = async (feedbackItem: FeedbackItem) => {
    try {
      // Fetch full details from API
      const res = await fetch(`/api/admin/feedback/${feedbackItem.id}`);
      if (!res.ok) throw new Error("Failed to load feedback details");

      const data = await res.json();
      setSelectedFeedback(data.feedback);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error("Failed to load feedback details");
      console.error("Error loading feedback details:", error);
    }
  };

  const handleUpdate = () => {
    toast.success("Feedback updated successfully");
    loadFeedback();
  };

  const handleDelete = () => {
    toast.success("Feedback deleted successfully");
    setIsDetailModalOpen(false);
    loadFeedback();
  };

  const handleFilterChange = (newFilters: FeedbackFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-400" />
          User Feedback
        </h1>
        <p className="text-slate-400">
          Review and manage user feedback submissions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">Total Feedback</CardDescription>
            <CardTitle className="text-3xl text-white">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-400">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">In Review</CardDescription>
            <CardTitle className="text-3xl text-blue-400">{stats.inReview}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardDescription className="text-slate-400">Resolved</CardDescription>
            <CardTitle className="text-3xl text-green-400">{stats.resolved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Feedback List */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Feedback Submissions</CardTitle>
          <CardDescription className="text-slate-400">
            Click on any feedback item to view details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <FeedbackList
              initialFeedback={feedback}
              onSelectFeedback={handleSelectFeedback}
              onFilterChange={handleFilterChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Modal */}
      <FeedbackDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        feedback={selectedFeedback}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
