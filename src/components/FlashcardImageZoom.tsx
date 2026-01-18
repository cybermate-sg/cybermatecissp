import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { type FlashcardMedia } from "./FlashcardContentArea";

interface FlashcardImageZoomProps {
    image: FlashcardMedia;
    onClose: () => void;
}

export function FlashcardImageZoom({ image, onClose }: FlashcardImageZoomProps) {
    const [zoomScale, setZoomScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

    // Handle ESC key to close zoom
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            onWheel={handleWheel}
            style={{ isolation: 'isolate' }}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
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

            {/* Image Container */}
            <div
                className="relative w-full h-full flex items-center justify-center"
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
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        transformOrigin: 'center center',
                        maxWidth: '100vw',
                        maxHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Image
                        src={image.url}
                        alt={image.altText || 'Zoomed image'}
                        width={3000}
                        height={3000}
                        sizes="100vw"
                        className="object-contain"
                        style={{
                            maxWidth: '95vw',
                            maxHeight: '90vh',
                            width: 'auto',
                            height: 'auto'
                        }}
                        priority
                        unoptimized
                    />
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/70 text-sm">
                    {zoomScale > 1
                        ? 'Drag to pan • Scroll to zoom • Click anywhere or press ESC to close'
                        : 'Scroll to zoom • Click anywhere or press ESC to close'
                    }
                </p>
            </div>
        </div>
    );
}
