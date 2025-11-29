"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "./ImagePreview";
import { toast } from "sonner";

export interface MediaFile {
  id?: string;
  file?: File;
  url?: string;
  key?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  placement: "question" | "answer";
  order: number;
  altText?: string;
  uploading?: boolean;
  uploadProgress?: number;
}

interface MultiImageUploadProps {
  placement: "question" | "answer";
  maxImages?: number;
  existingImages?: MediaFile[];
  onImagesChange: (images: MediaFile[]) => void;
}

/**
 * File validation constants
 */
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate a file for upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Max size: 5MB (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Create a MediaFile object from a File
 */
function createMediaFile(
  file: File,
  currentCount: number,
  newImagesCount: number,
  placement: "question" | "answer"
): MediaFile {
  const url = URL.createObjectURL(file);

  return {
    file,
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    placement,
    order: currentCount + newImagesCount,
    uploading: false,
  };
}

/**
 * Process and validate files for upload
 */
function processFiles(
  files: File[],
  currentCount: number,
  placement: "question" | "answer"
): MediaFile[] {
  const newImages: MediaFile[] = [];

  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      continue;
    }

    const newImage = createMediaFile(file, currentCount, newImages.length, placement);
    newImages.push(newImage);
  }

  return newImages;
}

/**
 * Upload area component
 */
interface UploadAreaProps {
  isDragging: boolean;
  placement: string;
  maxImages: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onFileSelect: (files: FileList | null) => void;
}

function UploadArea({
  isDragging,
  placement,
  maxImages,
  fileInputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
}: UploadAreaProps) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`border-2 border-dashed rounded-lg p-6 transition-all ${
        isDragging
          ? "border-purple-500 bg-purple-500/10"
          : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {isDragging ? (
          <>
            <Upload className="w-12 h-12 text-purple-500 mb-3" />
            <p className="text-purple-400 font-medium mb-2">Drop images here</p>
          </>
        ) : (
          <>
            <ImagePlus className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-white font-medium mb-2">
              Upload {placement} images
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Drag & drop or click to browse
              <br />
              <span className="text-xs">
                Max {maxImages} images • JPEG, PNG, WebP, GIF • Max 5MB each
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select Images
            </Button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        onChange={(e) => onFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}

export function MultiImageUpload({
  placement,
  maxImages = 5,
  existingImages = [],
  onImagesChange,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<MediaFile[]>(existingImages);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when existingImages prop changes
  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  const handleImagesUpdate = (newImages: MediaFile[]) => {
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentCount = images.length;
    const availableSlots = maxImages - currentCount;

    if (availableSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed for ${placement}`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    const newImages = processFiles(filesToProcess, currentCount, placement);

    if (newImages.length > 0) {
      handleImagesUpdate([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) added`);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDelete = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    // Update order numbers
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      order: i,
    }));
    handleImagesUpdate(reorderedImages);
    toast.success("Image removed");
  };

  const handleAltTextChange = (index: number, altText: string) => {
    const updatedImages = [...images];
    updatedImages[index] = { ...updatedImages[index], altText };
    handleImagesUpdate(updatedImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <UploadArea
          isDragging={isDragging}
          placement={placement}
          maxImages={maxImages}
          fileInputRef={fileInputRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onFileSelect={handleFileSelect}
        />
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {images.length} of {maxImages} images
          </span>
          {canAddMore && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-400 hover:text-purple-300"
            >
              <ImagePlus className="w-4 h-4 mr-1" />
              Add More
            </Button>
          )}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <ImagePreview
              key={`${placement}-${index}`}
              image={image}
              onDelete={() => handleDelete(index)}
              onAltTextChange={(altText) => handleAltTextChange(index, altText)}
            />
          ))}
        </div>
      )}

      {images.length === 0 && !canAddMore && (
        <p className="text-center text-gray-500 py-4">
          No images added yet
        </p>
      )}
    </div>
  );
}
