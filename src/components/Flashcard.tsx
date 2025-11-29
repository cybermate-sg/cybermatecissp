"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, Maximize2, TestTube, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

interface FlashcardMedia {
  id: string;
  url: string;
  altText: string | null;
  placement: string;
  order: number;
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

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedQuestion = useMemo(() => {
    return DOMPurify.sanitize(question, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'a'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
    });
  }, [question]);

  const sanitizedAnswer = useMemo(() => {
    return DOMPurify.sanitize(answer, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'a'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
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
        className={`relative w-full min-h-[500px] sm:min-h-[600px] transition-transform duration-500 preserve-3d cursor-pointer ${
          isFlipped ? "rotate-y-180" : ""
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2" style={{ maxHeight: 'calc(600px - 120px)' }}>
              <div className="flex flex-col items-center">
                <div
                  className="text-sm sm:text-base text-white text-left leading-relaxed mb-6 max-w-5xl prose prose-invert prose-sm sm:prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedQuestion }}
                />

                {/* Question Images - Grid layout for multiple images */}
                {questionImages.length > 0 && (
                  <div className={`w-full ${
                    questionImages.length === 1
                      ? 'max-w-xl'
                      : questionImages.length === 2
                      ? 'grid grid-cols-2 gap-4'
                      : 'grid grid-cols-2 gap-4'
                  }`}>
                    {questionImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-full group cursor-zoom-in"
                        onClick={(e) => handleImageClick(e, img)}
                      >
                        <Image
                          src={img.url}
                          alt={img.altText || 'Question image'}
                          width={500}
                          height={300}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 500px"
                          className="rounded-lg border border-slate-600 object-contain w-full h-auto max-h-64 transition-opacity group-hover:opacity-90"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-slate-900/70 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-400">
              Click to reveal answer
            </div>
          </CardContent>
        </Card>

        {/* Back of card (Answer) */}
        <Card
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <CardContent className="flex flex-col h-full p-4 sm:p-6 md:p-8">
            <div className="flex-shrink-0 flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex-1 text-center">
                <div className="text-xs sm:text-sm font-semibold text-purple-200">
                  ANSWER
                </div>
              </div>
              {/* Action Buttons - Top Right Corner */}
              <div className="flex items-center gap-2">
                {/* Bookmark Button */}
                {flashcardId && onBookmarkToggle && (
                  <Button
                    onClick={handleBookmarkClick}
                    variant="ghost"
                    size="sm"
                    className="text-purple-200 hover:text-white hover:bg-purple-800/50 transition-colors"
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
                    className="text-purple-200 hover:text-white hover:bg-purple-800/50 transition-colors"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test
                  </Button>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2" style={{ maxHeight: 'calc(600px - 120px)' }}>
              <div className="flex flex-col items-center">
                <div
                  className="text-sm sm:text-base text-white text-left leading-relaxed mb-6 max-w-5xl prose prose-invert prose-sm sm:prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedAnswer }}
                />

                {/* Answer Images - Grid layout for multiple images */}
                {answerImages.length > 0 && (
                  <div className={`w-full ${
                    answerImages.length === 1
                      ? 'max-w-xl'
                      : answerImages.length === 2
                      ? 'grid grid-cols-2 gap-4'
                      : 'grid grid-cols-2 gap-4'
                  }`}>
                    {answerImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-full group cursor-zoom-in"
                        onClick={(e) => handleImageClick(e, img)}
                      >
                        <Image
                          src={img.url}
                          alt={img.altText || 'Answer image'}
                          width={500}
                          height={300}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 500px"
                          className="rounded-lg border border-purple-400 object-contain w-full h-auto max-h-64 transition-opacity group-hover:opacity-90"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-purple-900/70 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 mt-3 sm:mt-4 text-center text-xs sm:text-sm text-purple-200">
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

        /* Rich text content styling for flashcards */
        .prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .prose ul,
        .prose ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .prose li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .prose strong {
          font-weight: 600;
          color: #f1f5f9;
        }

        .prose em {
          font-style: italic;
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
          display: block;
          overflow-x: auto;
          white-space: nowrap;
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
