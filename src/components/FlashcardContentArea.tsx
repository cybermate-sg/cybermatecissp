import Image from "next/image";
import { ZoomIn } from "lucide-react";
// import DOMPurify from "isomorphic-dompurify";

export interface FlashcardMedia {
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
export interface FlashcardContentAreaProps {
    sanitizedHtml: string;
    images: FlashcardMedia[];
    onImageClick: (e: React.MouseEvent, img: FlashcardMedia) => void;
    borderColor: string;
    hoverBgColor: string;
    fontScale?: number;
}

export function FlashcardContentArea({
    sanitizedHtml,
    images,
    onImageClick,
    borderColor,
    hoverBgColor,
    fontScale = 0,
}: FlashcardContentAreaProps) {
    // Determine text size classes based on fontScale
    const getTextSizeClass = () => {
        // Default (0): text-sm sm:text-base prose-sm sm:prose-base
        switch (fontScale) {
            case -1:
                return 'text-xs sm:text-sm prose-sm';
            case 1:
                return 'text-base sm:text-lg prose-base sm:prose-lg';
            case 2:
                return 'text-lg sm:text-xl prose-lg sm:prose-xl';
            default:
                return 'text-sm sm:text-base prose-sm sm:prose-base';
        }
    };

    // Determine grid layout class based on image count
    const getGridLayoutClass = () => {
        if (images.length === 0) return '';
        if (images.length === 1) return 'w-full max-w-xl';
        return 'w-full grid grid-cols-2 gap-4';
    };

    return (
        <div
            className="h-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6 cursor-auto pointer-events-auto"
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => {
                // Check if user is selecting text - if so, don't flip
                const selection = window.getSelection();
                if (selection && selection.toString().length > 0) {
                    e.stopPropagation();
                    return;
                }

                // Check if user clicked on the scrollbar
                // clientWidth doesn't include scrollbar, offsetWidth does
                const isScrollbarClick = e.clientX > e.currentTarget.getBoundingClientRect().left + e.currentTarget.clientWidth;
                if (isScrollbarClick) {
                    e.stopPropagation();
                    return;
                }

                // Allow click to bubble to parent for flip
            }}
        >
            <div className="w-full">
                <div
                    className={`${getTextSizeClass()} text-white text-left leading-relaxed mb-6 prose prose-invert max-w-none w-full transition-all duration-200`}
                    // nosemgrep: react-dangerouslysetinnerhtml
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
