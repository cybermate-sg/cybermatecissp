export interface FeedbackUser {
  clerkUserId: string;
  email: string;
  name: string | null;
}

export interface FeedbackContent {
  id: string;
  question?: string;
  questionText?: string;
  answer?: string;
  name?: string;
  deckId?: string;
  flashcardId?: string;
}

export interface FeedbackItem {
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

export interface FeedbackFilters {
  status?: string;
  type?: string;
  priority?: string;
}
