import React from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { FlashcardMedia } from './types';

interface ZoomState {
    zoomScale: number;
    position: { x: number; y: number };
    isDragging: boolean;
}

interface ZoomControls {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
}

interface ZoomEvents {
    onClose: (e?: React.MouseEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
}

interface ImageZoomModalProps {
    zoomedImage: FlashcardMedia;
    zoomState: ZoomState;
    controls: ZoomControls;
    events: ZoomEvents;
}

export function ImageZoomModal({
    zoomedImage,
    zoomState,
    controls,
    events,
}: ImageZoomModalProps) {
    const { zoomScale, position, isDragging } = zoomState;
    const { onZoomIn, onZoomOut, onResetZoom } = controls;
    const { onClose, onWheel, onMouseDown, onMouseMove, onMouseUp } = events;
    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose(e);
            }}
            onWheel={onWheel}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose(e);
                }}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-10 hover:shadow-cyber-glow"
                aria-label="Close zoom"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <button
                    onClick={onZoomIn}
                    className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all hover:shadow-cyber-glow"
                    aria-label="Zoom in"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={onZoomOut}
                    className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all hover:shadow-cyber-glow"
                    aria-label="Zoom out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={onResetZoom}
                    className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all hover:shadow-cyber-glow"
                    aria-label="Reset zoom"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>

            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-cyber-cyan/20 border border-cyber-cyan/40 text-white px-4 py-2 rounded-lg text-sm font-semibold z-10">
                {Math.round(zoomScale * 100)}%
            </div>

            <div
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
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
                        ? 'Drag to pan • Scroll to zoom • ESC to close'
                        : 'Scroll to zoom • ESC to close'
                    }
                </p>
            </div>
        </div>
    );
}
