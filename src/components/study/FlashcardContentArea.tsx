import React, { useMemo } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { FlashcardMedia } from './types';

export interface FlashcardContentAreaProps {
    html: string;
    images: FlashcardMedia[];
    onImageClick: (e: React.MouseEvent, img: FlashcardMedia) => void;
    borderColor: string;
}

export function FlashcardContentArea({
    html,
    images,
    onImageClick,
    borderColor,
}: FlashcardContentAreaProps) {
    const sanitizedHtml = useMemo(() => {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'blockquote', 'a'
            ],
            ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
            ALLOW_UNKNOWN_PROTOCOLS: false,
            SAFE_FOR_TEMPLATES: true,
            RETURN_TRUSTED_TYPE: false
        });
    }, [html]);

    const getGridLayoutClass = () => {
        if (images.length === 0) return '';
        if (images.length === 1) return 'w-full max-w-xl';
        return 'w-full grid grid-cols-2 gap-4';
    };

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2" style={{ maxHeight: 'calc(700px - 180px)' }}>
            <div className="flex flex-col items-center">
                {/* HTML is sanitized with DOMPurify using a strict tag/attribute allowlist before rendering.
                    This usage of dangerouslySetInnerHTML is intentional to support rich flashcard content. */}
                <div
                    className="text-base md:text-lg text-slate-100 text-left leading-relaxed mb-6 max-w-5xl prose prose-invert prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />

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
                                    className={`rounded-lg border-2 ${borderColor} object-contain w-full h-auto max-h-64 transition-all duration-300 group-hover:border-cyber-cyan group-hover:shadow-cyber-glow`}
                                    loading="lazy"
                                />
                                <div className="absolute top-2 right-2 bg-cyber-bg/90 backdrop-blur-sm text-cyber-cyan-light p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
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
