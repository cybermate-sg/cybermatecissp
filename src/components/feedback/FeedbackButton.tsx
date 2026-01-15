"use client";

import { Flag } from "lucide-react";
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
      className={`text-slate-400 hover:text-amber-400 hover:bg-amber-500/10
        hover:border-amber-500/50 transition-all duration-200 hover:scale-105 ${className}`}
      title="Report an issue or provide feedback"
      aria-label="Report an issue or provide feedback"
      type="button"
    >
      <Flag className="h-4 w-4" />
      {showLabel && <span className="ml-2">Report</span>}
    </Button>
  );
}
