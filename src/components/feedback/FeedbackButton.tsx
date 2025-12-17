"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackButtonProps {
  onClick: (e: React.MouseEvent) => void;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

/**
 * FeedbackButton component
 * Displays a button to open the feedback modal
 *
 * Usage:
 * <FeedbackButton onClick={() => setIsOpen(true)} />
 */
export default function FeedbackButton({
  onClick,
  variant = "ghost",
  size = "sm",
  className = "",
  showLabel = false,
}: FeedbackButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={`text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors ${className}`}
      title="Report an issue or provide feedback"
      type="button"
    >
      <MessageSquare className="w-4 h-4" />
      {showLabel && <span className="ml-2">Feedback</span>}
    </Button>
  );
}
