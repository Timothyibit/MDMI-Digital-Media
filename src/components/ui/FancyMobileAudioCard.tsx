import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  RotateCcw,
  RotateCw,
  Sparkles,
  Headphones,
  Sliders,
  Check,
  Play,
  Pause,
} from 'lucide-react';
import { Devotional } from '../../types';
import { PlayPauseIcon } from '@/components/ui/animated-state-icons';
import { formatAudioDuration } from '../../services/aiAudioService';

export interface FancyMobileAudioCardProps {
  devotional: Devotional;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onSpeedChange: (rate: number) => void;
  onOpenVoiceSelector: () => void;
  className?: string;
}

export const FancyMobileAudioCard: React.FC<FancyMobileAudioCardProps> = ({
  devotional,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onOpenVoiceSelector,
  className = '',
}) => {
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>([10, 16, 24, 18, 30, 22, 14, 26]);
  const [speedTooltip, setSpeedTooltip] = useState<string | null>(null);

  // Equalizer animation when playing
  useEffect(() => {
    if (!isPlaying) {
      setBarHeights([8, 8, 8, 8, 8, 8, 8, 8]);
      return;
    }
    const interval = setInterval(() => {
      setBarHeights([
        Math.floor(Math.random() * 22) + 6,
        Math.floor(Math.random() * 26) + 8,
        Math.floor(Math.random() * 30) + 10,
        Math.floor(Math.random() * 24) + 8,
        Math.floor(Math.random() * 32) + 10,
        Math.floor(Math.random() * 22) + 6,
        Math.floor(Math.random() * 28) + 8,
        Math.floor(Math.random() * 18) + 6,
      ]);
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const effectiveDuration = Math.max(1, duration);
  const displayTime =
    localProgress !== null
      ? localProgress
      : Math.min(effectiveDuration, Math.max(0, currentTime));
  const progressPercent = Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100));

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = rect.width > 0 ? clickX / rect.width : 0;
      const targetSecs = Math.round(ratio * effectiveDuration);
      setLocalProgress(targetSecs);
      onSeek(targetSecs);
    },
    [effectiveDuration, onSeek]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    seekFromClientX(e.clientX);

    const handleMouseMove = (mv: MouseEvent) => {
      if (isDraggingRef.current) {
        seekFromClientX(mv.clientX);
      }
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setLocalProgress(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    if (e.touches.length > 0) {
      seekFromClientX(e.touches[0].clientX);
    }

    const handleTouchMove = (mv: TouchEvent) => {
      if (isDraggingRef.current && mv.touches.length > 0) {
        seekFromClientX(mv.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      setLocalProgress(null);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleRewind15 = () => {
    const target = Math.max(0, currentTime - 15);
    onSeek(target);
  };

  const handleForward15 = () => {
    const target = Math.min(effectiveDuration, currentTime + 15);
    onSeek(target);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    onSpeedChange(nextSpeed);
    setSpeedTooltip(`${nextSpeed}x Speed`);
    setTimeout(() => setSpeedTooltip(null), 1500);
  };

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 overflow-hidden transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.35)] border border-slate-700/60 bg-gradient-to-br from-[#080E1B] via-[#0F1E38] to-[#04070D] text-white ${className}`}
    >
      {/* Background ambient lighting/glow */}
      <div
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isPlaying ? 'opacity-30 bg-emerald-500' : 'opacity-15 bg-[#5E72E4]'
        }`}
      />
      <div
        className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isPlaying ? 'opacity-25 bg-[#5E72E4]' : 'opacity-10 bg-amber-500'
        }`}
      />

      {/* Top Header Pill Row */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Audio Narration
            </span>
            <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[170px] sm:max-w-none">
              {devotional.scripture}
            </span>
          </div>
        </div>

        {/* Narrator Voice Button */}
        <button
          type="button"
          onClick={onOpenVoiceSelector}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 active:scale-95 transition-all text-xs font-semibold cursor-pointer shadow-xs"
          title="Change Narrator Voice"
        >
          <Mic className="w-3 h-3 text-[#84CC16]" />
          <span className="text-[11px] text-white/90">Voice</span>
        </button>
      </div>

      {/* Devotional Teaching Title & Live Equalizer Waveform */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-white truncate font-display-scripture">
            {devotional.title}
          </h4>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            Narrated by ministry leadership • Holy Spirit reflection
          </p>
        </div>

        {/* 8-bar Equalizer Visualizer */}
        <div
          className="flex items-end gap-[3px] h-8 px-2 py-1 rounded-lg bg-black/40 border border-white/10 shrink-0"
          title={isPlaying ? 'Audio playing' : 'Audio paused'}
        >
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? 'bg-gradient-to-t from-emerald-500 to-[#84CC16]'
                  : 'bg-slate-600'
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* Scrubber Progress Slider */}
      <div className="relative z-10 mb-3">
        <div
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="slider"
          aria-label="Audio scrubber"
          aria-valuemin={0}
          aria-valuemax={effectiveDuration}
          aria-valuenow={displayTime}
          tabIndex={0}
          className="w-full py-2 cursor-pointer group select-none"
        >
          <div className="w-full h-2 rounded-full bg-slate-800/90 border border-slate-700/60 overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-[#84CC16] to-[#5E72E4] rounded-full will-change-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Thumb marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] border-2 border-emerald-500 pointer-events-none opacity-90 group-hover:scale-125 will-change-[left]"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        {/* Time stamps */}
        <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-400 px-0.5">
          <span className="text-emerald-400">{formatAudioDuration(displayTime)}</span>
          <span className="text-slate-400">
            -{formatAudioDuration(Math.max(0, effectiveDuration - displayTime))} / {formatAudioDuration(effectiveDuration)}
          </span>
        </div>
      </div>

      {/* Speed Toast Feedback */}
      {speedTooltip && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-neutral-900 border border-emerald-500/50 text-emerald-400 text-xs font-bold rounded-full shadow-xl animate-in fade-in duration-150">
          {speedTooltip}
        </div>
      )}

      {/* Mobile Thumb Controls Row */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        {/* Playback speed button */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-95 transition-all text-xs font-bold text-slate-200 cursor-pointer"
          title="Cycle playback speed (1x, 1.25x, 1.5x, 2x)"
        >
          <Sliders className="w-3 h-3 text-slate-400" />
          <span>{playbackRate}x</span>
        </button>

        {/* Center Control Cluster: Rewind 15s, Hero Play/Pause, Forward 15s */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Rewind 15s */}
          <button
            type="button"
            onClick={handleRewind15}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer relative group"
            title="Rewind 15 seconds"
            aria-label="Rewind 15 seconds"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="absolute -bottom-1 text-[8px] font-mono font-black text-slate-300">15</span>
          </button>

          {/* Large Hero Play/Pause Button */}
          <button
            type="button"
            onClick={onPlayPause}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/40 text-white ring-4 ring-emerald-500/20'
                : 'bg-gradient-to-tr from-[#5E72E4] to-[#7B8DF0] shadow-[#5E72E4]/40 text-white ring-4 ring-[#5E72E4]/20 hover:scale-105'
            }`}
            title={isPlaying ? 'Pause narration' : 'Play narration'}
            aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white fill-white" />
            ) : (
              <Play className="w-7 h-7 text-white fill-white ml-0.5" />
            )}
          </button>

          {/* Forward 15s */}
          <button
            type="button"
            onClick={handleForward15}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer relative group"
            title="Forward 15 seconds"
            aria-label="Forward 15 seconds"
          >
            <RotateCw className="w-4 h-4" />
            <span className="absolute -bottom-1 text-[8px] font-mono font-black text-slate-300">15</span>
          </button>
        </div>

        {/* Narration indicator status */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
            }`}
          />
          <span className="hidden sm:inline">{isPlaying ? 'Playing' : 'Ready'}</span>
        </div>
      </div>
    </div>
  );
};

export default FancyMobileAudioCard;
