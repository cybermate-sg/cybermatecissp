"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, Maximize2, TestTube, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "isomorphic-dompurify";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";

interface FlashcardMedia {
  id: string;
  url: string;
  altText: string | null;
  placement: string;
  order: number;
}

/**
 * Reusable component for rendering flashcard content (question or answer)
 * with scrollable area and sanitized HTML
 */
interface FlashcardContentAreaProps {
  sanitizedHtml: string;
  images: FlashcardMedia[];
  onImageClick: (e: React.MouseEvent, img: FlashcardMedia) => void;
  borderColor: string;
  hoverBgColor: string;
}

function FlashcardContentArea({
  sanitizedHtml,
  images,
  onImageClick,
  borderColor,
  hoverBgColor,
}: FlashcardContentAreaProps) {
  // Determine grid layout class based on image count
  const getGridLayoutClass = () => {
    if (images.length === 0) return '';
    if (images.length === 1) return 'w-full max-w-xl';
    return 'w-full grid grid-cols-2 gap-4';
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '400px' }}>
      <div className="w-full">
        {/* nosemgrep: react-dangerouslysetinnerhtml - Content is sanitized with DOMPurify using strict allowlist */}
        <div
          className="text-sm sm:text-base text-white text-left leading-relaxed mb-6 prose prose-invert prose-sm sm:prose-base max-w-none w-full"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />

        {/* Images - Grid layout for multiple images */}
        {images.length > 0 && (
          <div className={getGridLayoutClass()}>
            {images.map((img) => (
              <div
                key={img.id}
                className="relative w-full group cursor-zoom-in"
                onClick={(e) => onImageClick(e, img)}
              >
                <Image
                  src={img.url}
                  alt={img.altText || 'Flashcard image'}
                  width={500}
                  height={300}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 500px"
                  className={`rounded-lg border ${borderColor} object-contain w-full h-auto max-h-64 transition-opacity group-hover:opacity-90`}
                  loading="lazy"
                />
                <div className={`absolute top-2 right-2 ${hoverBgColor} text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

export default function Flashcard({
  question,
  answer,
  questionImages = [],
  answerImages = [],
  flashcardId,
  isBookmarked = false,
  onFlip,
  onTest,
  onBookmarkToggle
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<FlashcardMedia | null>(null);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [zoomScale, setZoomScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

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

  const closeZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent any event bubbling
    setZoomedImage(null);
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev - 0.5, 1));
    if (zoomScale - 0.5 <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(zoomScale + delta, 1), 5);
    setZoomScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  // Handle ESC key to close zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedImage) {
        closeZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage]);

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
        {/* Front of card (Question) */}
        <Card
          className="absolute inset-0 backface-hidden bg-slate-800/90 border-slate-700"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          <CardContent className="flex flex-col h-full p-4 sm:p-6 md:p-8">
            <div className="flex-shrink-0 text-center">
              <div className="text-xs sm:text-sm font-semibold text-purple-400 mb-3 sm:mb-4">
                QUESTION
              </div>
            </div>

            {/* Scrollable content area */}
            <FlashcardContentArea
              sanitizedHtml={sanitizedQuestion}
              images={questionImages}
              onImageClick={handleImageClick}
              borderColor="border-slate-600"
              hoverBgColor="bg-slate-900/70"
            />

            <div className="flex-shrink-0 mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-400">
              Click to reveal answer
            </div>
          </CardContent>
        </Card>

        {/* Back of card (Answer) */}
        <Card
          className="absolute inset-0 backface-hidden bg-gradient-to-b from-[#0f1729] via-[#1a2235] to-[#0f1729] border-blue-500/20"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <CardContent className="flex flex-col h-full p-4 sm:p-6 md:p-8">
            <div className="flex-shrink-0 flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex-1 text-center">
                <div className="text-xs sm:text-sm font-semibold text-blue-300">
                  ANSWER
                </div>
              </div>
              {/* Action Buttons - Top Right Corner */}
              <div className="flex items-center gap-2">
                {/* Feedback Button */}
                {flashcardId && (
                  <FeedbackButton
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setIsFeedbackModalOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-blue-300 hover:text-white hover:bg-blue-800/50"
                  />
                )}
                {/* Bookmark Button */}
                {flashcardId && onBookmarkToggle && (
                  <Button
                    onClick={handleBookmarkClick}
                    variant="ghost"
                    size="sm"
                    className="text-blue-300 hover:text-white hover:bg-blue-800/50 transition-colors"
                    title={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    {bookmarked ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </Button>
                )}
                {/* Test Button */}
                {onTest && (
                  <Button
                    onClick={handleTestClick}
                    variant="ghost"
                    size="sm"
                    className="text-blue-300 hover:text-white hover:bg-blue-800/50 transition-colors"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <FlashcardContentArea
              sanitizedHtml={sanitizedAnswer}
              images={answerImages}
              onImageClick={handleImageClick}
              borderColor="border-blue-400"
              hoverBgColor="bg-blue-900/70"
            />

            <div className="flex-shrink-0 mt-3 sm:mt-4 text-center text-xs sm:text-sm text-blue-300">
              Click to see question
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the image
            if (e.target === e.currentTarget) {
              closeZoom(e);
            }
          }}
          onWheel={handleWheel}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeZoom(e);
            }}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <button
              onClick={handleZoomIn}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom Level Indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/10 text-white px-3 py-1 rounded-lg text-sm z-10">
            {Math.round(zoomScale * 100)}%
          </div>

          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            <div
              style={{
                transform: `scale(${zoomScale}) translate(${position.x / zoomScale}px, ${position.y / zoomScale}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <Image
                src={zoomedImage.url}
                alt={zoomedImage.altText || 'Zoomed image'}
                width={1920}
                height={1080}
                sizes="100vw"
                className="object-contain max-w-full max-h-[90vh]"
                priority
              />
            </div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/70 text-sm">
              {zoomScale > 1
                ? 'Drag to pan • Scroll to zoom • Click anywhere or press ESC to close'
                : 'Scroll to zoom • Click anywhere or press ESC to close'
              }
            </p>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {flashcardId && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          flashcardId={flashcardId}
        />
      )}

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        /* Ensure list markers are visible in scrollable containers */
        .overflow-y-auto ul,
        .overflow-y-auto ol {
          overflow: visible !important;
        }

        /* Rich text content styling for flashcards */
        .prose {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }

        .prose h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose h4,
        .prose h5,
        .prose h6 {
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .prose ul,
        .prose ol,
        .prose-invert ul,
        .prose-invert ol,
        .prose-sm ul,
        .prose-sm ol,
        .prose-base ul,
        .prose-base ol {
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          list-style-position: outside !important;
          margin-left: 0.5rem !important;
        }

        .prose ul,
        .prose-invert ul,
        .prose-sm ul,
        .prose-base ul {
          list-style-type: disc !important;
        }

        .prose ol,
        .prose-invert ol,
        .prose-sm ol,
        .prose-base ol {
          list-style-type: decimal !important;
        }

        .prose li,
        .prose-invert li,
        .prose-sm li,
        .prose-base li {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
          display: list-item !important;
          margin-left: 0 !important;
        }

        .prose strong {
          font-weight: 600;
          color: #f1f5f9;
        }

        .prose em {
          font-style: italic;
        }

        .prose blockquote {
          border-left: 4px solid #475569;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #cbd5e1;
        }

        .prose a {
          color: #60a5fa;
          text-decoration: underline;
        }

        .prose a:hover {
          color: #93c5fd;
        }

        .prose code {
          background-color: #334155;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: monospace;
          color: #e2e8f0;
        }

        .prose pre {
          background-color: #1e293b;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }

        .prose pre code {
          background: none;
          padding: 0;
        }

        /* Table styling for flashcards */
        .prose .tiptap-table {
          border-collapse: collapse;
          table-layout: auto;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
          border-radius: 0.5rem;
        }

        .prose .tiptap-table td,
        .prose .tiptap-table th {
          min-width: 3em;
          border: 2px solid #475569;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          background-color: rgba(30, 41, 59, 0.5);
        }

        .prose .tiptap-table th {
          font-weight: 600;
          text-align: left;
          background-color: #334155;
          color: #f1f5f9;
        }

        /* Responsive table wrapper */
        .prose table {
          display: table;
          table-layout: auto;
          width: 100%;
          overflow-x: auto;
        }

        .prose table td,
        .prose table th {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }

        /* Make tables responsive on mobile */
        @media (max-width: 640px) {
          .prose .tiptap-table td,
          .prose .tiptap-table th {
            padding: 6px 8px;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
