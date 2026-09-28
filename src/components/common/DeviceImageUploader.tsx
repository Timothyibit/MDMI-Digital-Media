"use client";

import React, { useRef, useState } from 'react';
import { ImagePlus, X, Upload, Check, Sparkles, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { processImageFile } from '../../lib/imageUtils';

export interface DeviceImageUploaderProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  helperText?: string;
  presets?: string[];
  aspectRatio?: 'video' | 'banner' | 'square' | 'wide';
  maxDimension?: number;
  className?: string;
}

export const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  value,
  onChange,
  label = 'Header / Cover Image',
  helperText = 'Upload from your phone or computer, choose a preset, or enter an image URL',
  presets = [],
  aspectRatio = 'video',
  maxDimension = 1400,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');

  const aspectClass =
    aspectRatio === 'banner'
      ? 'h-32 sm:h-40 w-full'
      : aspectRatio === 'square'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : aspectRatio === 'wide'
      ? 'h-44 sm:h-52 w-full'
      : 'h-32 sm:h-36 w-full sm:w-48'; // video default

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const dataUrl = await processImageFile(file, { maxDimension, quality: 0.85 });
      onChange(dataUrl);
      setUrlInput('');
    } catch (err) {
      console.warn('Error processing device image:', err);
      // Fallback to standard reader
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUrlInput('');
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
    }
  };

  return (
    <div className={`p-4 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
            {label}
          </label>
          {helperText && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {helperText}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-[#5E72E4] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL field' : 'Enter image URL'}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Preview Area */}
        <div
          className={`relative rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 border-2 border-dashed ${
            value
              ? 'border-neutral-300 dark:border-neutral-700'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-[#5E72E4] dark:hover:border-[#5E72E4]'
          } shrink-0 group flex items-center justify-center transition-colors ${aspectClass}`}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full bg-white text-neutral-900 shadow hover:bg-neutral-100 transition-all cursor-pointer"
                  title="Replace photo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700 transition-all cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center p-3 text-neutral-400 hover:text-[#5E72E4] transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 mb-1 opacity-70" />
              <span className="text-[10px] font-bold">Upload Device Photo</span>
              <span className="text-[9px] text-neutral-400">JPG, PNG, WebP</span>
            </button>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#5E72E4]" />
              <span>Optimizing...</span>
            </div>
          )}
        </div>

        {/* Action Controls & Presets */}
        <div className="flex-1 space-y-2.5 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl bg-[#5E72E4] hover:bg-[#4d61ce] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Choose from Device</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
              >
                Remove Photo
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            aria-label="Upload device photo"
          />

          {/* Optional Direct URL input */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {/* Preset Photos Selection */}
          {presets.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Or select spiritual preset:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {presets.map((presetUrl, idx) => {
                  const isSelected = value === presetUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChange(presetUrl)}
                      className={`relative w-11 h-8 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-[#5E72E4] ring-2 ring-[#5E72E4]/30 scale-105'
                          : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 hover:scale-105'
                      }`}
                      title={`Select preset ${idx + 1}`}
                    >
                      <img
                        src={presetUrl}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#5E72E4]/40 flex items-center justify-center text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceImageUploader;
