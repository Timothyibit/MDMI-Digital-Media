"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { processImageFile } from "@/src/lib/imageUtils";

export interface UseImageUploadOptions {
  initialImage?: string | null;
  onImageSelected?: (dataUrl: string, file: File) => void;
  maxDimension?: number;
  quality?: number;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { initialImage = null, onImageSelected, maxDimension = 1200, quality = 0.85 } = options;
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const optimizedDataUrl = await processImageFile(file, { maxDimension, quality });
      setPreviewUrl(optimizedDataUrl);
      if (onImageSelected) {
        onImageSelected(optimizedDataUrl, file);
      }
    } catch (err) {
      console.warn("Failed to process image:", err);
      // Fallback to direct FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewUrl(result);
        if (onImageSelected) {
          onImageSelected(result, file);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    previewUrl,
    setPreviewUrl,
    isProcessing,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  };
}

export default useImageUpload;

