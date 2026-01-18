"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck2, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "isomorphic-dompurify";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { FlashcardContentArea, type FlashcardMedia } from "./FlashcardContentArea";
import { FlashcardImageZoom } from "./FlashcardImageZoom";
import FlashcardGlobalStyles from "./FlashcardGlobalStyles";

interface FlashcardProps {
  question: string;
  answer: string;
  questionImages?: FlashcardMedia[];
  answerImages?: FlashcardMedia[];
  flashcardId?: string;
  isBookmarked?: boolean;
  onFlip?: () => void;
  onTest?: () => void;
  onBookmarkToggle?: (flashcardId: string, isBookmarked: boolean) => void;
}

export default function Flashcard(props: FlashcardProps) {
  const {
    question,
    answer,
    questionImages = [],
    answerImages = [],
    flashcardId,
    isBookmarked = false,
    onFlip,
    onTest,
    onBookmarkToggle
  } = props;
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<FlashcardMedia | null>(null);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [fontScale, setFontScale] = useState(0);

  const handleIncreaseFont = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontScale((prev) => Math.min(prev + 1, 2));
  };

  const handleDecreaseFont = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontScale((prev) => Math.max(prev - 1, -1));
  };

  // Track if component is mounted for portal rendering
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  /**
   * XSS PREVENTION: Sanitize HTML content using DOMPurify
   * 
   * Security measures:
   * 1. DOMPurify removes all potentially malicious HTML/JavaScript
   * 2. Strict allowlist of safe HTML tags (no script, iframe, object, embed, etc.)
   * 3. Limited attributes (only href, class, target, rel for links)
   * 4. SAFE_FOR_TEMPLATES prevents template injection attacks
   * 5. RETURN_TRUSTED_TYPE ensures output is safe for innerHTML
   * 
   * This prevents XSS attacks even if user-generated content contains:
   * - <script> tags
   * - Event handlers (onclick, onerror, etc.)
   * - Data URIs with JavaScript
   * - HTML injection attempts
   */
  const sanitizedQuestion = useMemo(() => {
    if (typeof window === 'undefined') return question; // SSR safety

    return DOMPurify.sanitize(question, {
      // Strict allowlist of safe HTML tags for rich text content
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'a'
      ],
      // Only allow safe attributes (no event handlers, no data URIs)
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
      // Additional security flags
      ALLOW_DATA_ATTR: false, // Prevent data-* attributes
      ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http/https/mailto
      SAFE_FOR_TEMPLATES: true, // Prevent template injection
      RETURN_TRUSTED_TYPE: false // Return string for React
    });
  }, [question]);

  const sanitizedAnswer = useMemo(() => {
    if (typeof window === 'undefined') return answer; // SSR safety

    return DOMPurify.sanitize(answer, {
      // Strict allowlist of safe HTML tags for rich text content
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'a'
      ],
      // Only allow safe attributes (no event handlers, no data URIs)
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
      // Additional security flags
      ALLOW_DATA_ATTR: false, // Prevent data-* attributes
      ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http/https/mailto
      SAFE_FOR_TEMPLATES: true, // Prevent template injection
      RETURN_TRUSTED_TYPE: false // Return string for React
    });
  }, [answer]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  const handleImageClick = (e: React.MouseEvent, img: FlashcardMedia) => {
    e.stopPropagation(); // Prevent card flip when clicking image
    e.preventDefault(); // Prevent any default behavior
    setZoomedImage(img);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  const handleTestClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking Test button
    onTest?.();
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking Bookmark button
    if (flashcardId && onBookmarkToggle) {
      const newBookmarkedState = !bookmarked;
      setBookmarked(newBookmarkedState);
      onBookmarkToggle(flashcardId, newBookmarkedState);
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-7xl mx-auto">
      <div
        className={`relative w-full min-h-[600px] sm:min-h-[700px] transition-transform duration-500 preserve-3d cursor-pointer ${isFlipped ? "rotate-y-180" : ""
          }`}
        onClick={handleFlip}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
      >
        <Card
          className={`absolute inset-0 backface-hidden bg-slate-800/90 border-slate-700 ${isFlipped ? "pointer-events-none z-0" : "pointer-events-auto z-10"
            }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transformStyle: "preserve-3d"
          }}
        >
          <CardContent className="flex flex-col h-full p-0">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-700 bg-slate-900/50 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="text-xs sm:text-sm font-semibold text-purple-400">
                    Card Front
                  </div>
                </div>
                <div className="flex items-center gap-1" >
                  <div className="flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-800/50 p-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      onClick={handleDecreaseFont}
                      disabled={fontScale <= -1}
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-7 text-[10px] px-0 hover:bg-purple-500/10 ${fontScale <= -1 ? 'text-slate-600' : 'text-slate-400 hover:text-purple-400'}`}
                    >
                      A-
                    </Button>
                    <div className="w-px h-3 bg-slate-700" />
                    <Button
                      onClick={handleIncreaseFont}
                      disabled={fontScale >= 2}
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-7 text-[10px] px-0 hover:bg-purple-500/10 ${fontScale >= 2 ? 'text-slate-600' : 'text-slate-400 hover:text-purple-400'}`}
                    >
                      A+
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Body - Scrollable content area */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {/* Watermark removed */}
              <div className="relative z-10 h-full">
                <FlashcardContentArea
                  sanitizedHtml={sanitizedQuestion}
                  images={questionImages}
                  onImageClick={handleImageClick}
                  borderColor="border-slate-600"
                  hoverBgColor="bg-slate-900/70"
                  fontScale={fontScale}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-slate-700 bg-slate-900/50 px-4 sm:px-6 py-3 sm:py-4">
              <div className="text-center text-xs sm:text-sm text-gray-400">
                Click to Card Back
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back of card (Answer) */}
        <Card
          className={`absolute inset-0 backface-hidden bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729] border-blue-500/20 ${isFlipped ? "pointer-events-auto z-10" : "pointer-events-none z-0"
            }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            transformStyle: "preserve-3d"
          }}
        >
          <CardContent className="flex flex-col h-full p-0">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-blue-500/20 bg-slate-900/50 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="text-xs sm:text-sm font-semibold text-blue-300">
                    Card Back
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Font Controls */}
                  <div className="flex items-center gap-0.5 rounded-md border border-blue-500/20 bg-slate-900/30 p-0.5 mr-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      onClick={handleDecreaseFont}
                      disabled={fontScale <= -1}
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-7 text-[10px] px-0 hover:bg-blue-500/10 ${fontScale <= -1 ? 'text-slate-600' : 'text-slate-400 hover:text-blue-400'}`}
                    >
                      A-
                    </Button>
                    <div className="w-px h-3 bg-blue-500/20" />
                    <Button
                      onClick={handleIncreaseFont}
                      disabled={fontScale >= 2}
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-7 text-[10px] px-0 hover:bg-blue-500/10 ${fontScale >= 2 ? 'text-slate-600' : 'text-slate-400 hover:text-blue-400'}`}
                    >
                      A+
                    </Button>
                  </div>
                  {/* Feedback Button */}
                  {flashcardId && (
                    <FeedbackButton
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setIsFeedbackModalOpen(true);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 border border-blue-400/50 rounded-md shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                    />
                  )}
                  {/* Bookmark Button */}
                  {flashcardId && onBookmarkToggle && (
                    <Button
                      onClick={handleBookmarkClick}
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 border border-blue-400/50 rounded-md shadow-[0_0_8px_rgba(96,165,250,0.4)] transition-all duration-200 hover:scale-105 ${bookmarked
                        ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        : "text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                        }`}
                      title={bookmarked ? "Remove bookmark" : "Save for later"}
                      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                      aria-pressed={bookmarked}
                    >
                      {bookmarked ? (
                        <BookmarkCheck className="h-4 w-4 fill-current" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {/* Test Button */}
                  {onTest && (
                    <Button
                      onClick={handleTestClick}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 border border-blue-400/50 rounded-md shadow-[0_0_8px_rgba(96,165,250,0.4)] text-slate-400
                        hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50
                        transition-all duration-200 hover:scale-105"
                      aria-label="Start practice test"
                    >
                      <FileCheck2 className="h-4 w-4 mr-1.5" />
                      Test
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Body - Scrollable content area */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {/* Watermark removed */}
              <div className="relative z-10 h-full">
                <FlashcardContentArea
                  sanitizedHtml={sanitizedAnswer}
                  images={answerImages}
                  onImageClick={handleImageClick}
                  borderColor="border-blue-400"
                  hoverBgColor="bg-blue-900/70"
                  fontScale={fontScale}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-blue-500/20 bg-slate-900/50 px-4 sm:px-6 py-3 sm:py-4">
              <div className="text-center text-xs sm:text-sm text-blue-300">
                Click to Card Front
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Zoom Modal - Rendered via Portal */}
      {isMounted && zoomedImage && createPortal(
        <FlashcardImageZoom image={zoomedImage} onClose={closeZoom} />,
        document.body
      )}

      {/* Feedback Modal */}
      {flashcardId && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          flashcardId={flashcardId}
        />
      )}

      <FlashcardGlobalStyles />
    </div>
  );
}
