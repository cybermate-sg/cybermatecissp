import React from 'react';
import { FlashcardFace } from "./FlashcardFace";
import { ImageZoomModal } from "./ImageZoomModal";
import { FlashcardStyles } from "./FlashcardStyles";
import { CardData, MediaData } from './types';
import { FlashcardState } from './useFlashcardState';

interface FlashcardContainerProps {
    cardData: CardData;
    mediaData: MediaData;
    state: FlashcardState;
    // Optional ref for swipe
    swipeRef?: React.Ref<HTMLDivElement>;
    children?: React.ReactNode; // For swipe hints etc
}

export function FlashcardContainer({
    cardData,
    mediaData,
    state,
    swipeRef,
    children
}: FlashcardContainerProps) {
    const {
        isFlipped,
        handleFlip,
        zoomedImage,
        bookmarked,
        zoomScale,
        position,
        isDragging,
        handleImageClick,
        closeZoom,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handleWheel,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleBookmarkClick
    } = state;

    return (
        <div className="perspective-1000 w-full max-w-7xl mx-auto relative">
            {children}

            <div
                ref={swipeRef}
                className={`relative w-full min-h-[600px] md:min-h-[700px] transition-transform duration-700 preserve-3d cursor-pointer`}
                onClick={handleFlip}
                style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
            >
                {/* Front of card (Question) */}
                <FlashcardFace
                    type="question"
                    cardData={cardData}
                    content={cardData.question}
                    images={mediaData.questionImages || []}
                    onImageClick={handleImageClick}
                    isBookmarked={bookmarked}
                />

                {/* Back of card (Answer) */}
                <FlashcardFace
                    type="answer"
                    cardData={cardData}
                    content={cardData.answer}
                    images={mediaData.answerImages || []}
                    onImageClick={handleImageClick}
                    isBookmarked={bookmarked}
                    onBookmarkClick={handleBookmarkClick}
                />
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <ImageZoomModal
                    zoomedImage={zoomedImage}
                    zoomState={{
                        zoomScale,
                        position,
                        isDragging,
                    }}
                    controls={{
                        onZoomIn: handleZoomIn,
                        onZoomOut: handleZoomOut,
                        onResetZoom: handleResetZoom,
                    }}
                    events={{
                        onClose: closeZoom,
                        onWheel: handleWheel,
                        onMouseDown: handleMouseDown,
                        onMouseMove: handleMouseMove,
                        onMouseUp: handleMouseUp,
                    }}
                />
            )}

            <FlashcardStyles />
        </div>
    );
}
