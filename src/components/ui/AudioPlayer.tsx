import React, { useRef, useEffect } from 'react';
import { Play, Pause, X, Volume2, RotateCcw, FastForward } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../../store/useUIStore';

export const AudioPlayer: React.FC = () => {
  const {
    audioState,
    toggleAudioPlayback,
    seekAudioTime,
    setAudioCurrentTime,
    setAudioDuration,
    setAudioPlaybackRate,
    closeAudioPlayer,
    theme,
  } = useUIStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state with HTML Audio element
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioState.isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented by browser policy, pause state gracefully
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [audioState.isPlaying, audioState.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = audioState.playbackRate;
    }
  }, [audioState.playbackRate]);

  if (!audioState.devotionalId) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekAudioTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const cycleSpeed = () => {
    const rates = [1.0, 1.25, 1.5, 0.85];
    const nextIndex = (rates.indexOf(audioState.playbackRate) + 1) % rates.length;
    setAudioPlaybackRate(rates[nextIndex]);
  };

  const skipSeconds = (delta: number) => {
    const nextTime = Math.max(0, Math.min(audioState.duration, audioState.currentTime + delta));
    seekAudioTime(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const isSepia = theme === 'sepia';

  return (
    <AnimatePresence>
      <motion.div
        id="persistent-audio-player"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className={`fixed bottom-16 md:bottom-20 inset-x-2 md:inset-x-auto md:right-8 md:w-96 z-40 rounded-2xl shadow-xl border backdrop-blur-md p-3 transition-colors ${
          isSepia
            ? 'bg-[#EFE6D0]/95 border-[#D8C7A4] text-[#5B4636]'
            : 'bg-neutral-900/95 border-neutral-800 text-white'
        }`}
      >
        {/* Hidden Native Audio Element */}
        <audio
          ref={audioRef}
          src={audioState.audioUrl || undefined}
          onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 180)}
          onEnded={() => toggleAudioPlayback()}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSepia ? 'bg-[#966F33]/15 text-[#966F33]' : 'bg-blue-600/20 text-blue-400'
              }`}
            >
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate leading-tight">{audioState.title}</p>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  isSepia ? 'text-[#82664D]' : 'text-neutral-400'
                }`}
              >
                {audioState.scripture} • Audio Narration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => skipSeconds(-15)}
              aria-label="Rewind 15 seconds"
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-xs"
              title="Back 15s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              id="audio-play-toggle-btn"
              onClick={toggleAudioPlayback}
              aria-label={audioState.isPlaying ? 'Pause narration' : 'Play narration'}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform ${
                isSepia
                  ? 'bg-[#966F33] text-[#F4ECD8] hover:bg-[#7D5A25]'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {audioState.isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={cycleSpeed}
              aria-label="Change playback speed"
              className="px-1.5 py-1 rounded-md text-[10px] font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              {audioState.playbackRate}x
            </button>

            <button
              id="close-audio-btn"
              onClick={closeAudioPlayer}
              aria-label="Close audio player"
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrubber & Time */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-neutral-400 w-7 text-right">
            {formatTime(audioState.currentTime)}
          </span>
          <input
            id="audio-scrubber"
            type="range"
            min="0"
            max={audioState.duration || 180}
            step="0.5"
            value={audioState.currentTime}
            onChange={handleSeek}
            aria-label="Audio scrubber"
            className="w-full h-1 bg-neutral-700/40 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
          />
          <span className="text-[10px] tabular-nums text-neutral-400 w-7">
            {formatTime(audioState.duration)}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
