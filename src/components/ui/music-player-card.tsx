import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { X, Volume2, VolumeX, Mic, Music, RotateCcw, RotateCw, Loader2, Sparkles, ChevronDown, Play, Pause } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { nativeSpeech } from '../../services/nativeSpeechService';
import { webAudioApi } from '../../services/webAudioApiService';
import { calculateAudioDuration, getApiBaseUrl } from '../../services/aiAudioService';
import { PlayPauseIcon } from '@/components/ui/animated-state-icons';
import { Devotional } from '../../types';

export interface MusicPlayerCardProps {
  devotional?: Devotional;
  title?: string;
  artist?: string;
  albumArt?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onPlayPause?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSeek?: (seconds: number) => void;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

const DEFAULT_ART =
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=400&q=80';

export const Card: React.FC<MusicPlayerCardProps> = ({
  devotional: propDevotional,
  title: propTitle,
  artist: propArtist,
  albumArt: propAlbumArt,
  isPlaying: propIsPlaying,
  currentTime: propCurrentTime,
  duration: propDuration,
  onPlayPause: propOnPlayPause,
  onPrev: propOnPrev,
  onNext: propOnNext,
  onSeek: propOnSeek,
  onClose: propOnClose,
  className = '',
  showCloseButton = true,
}) => {
  const {
    audioState,
    toggleAudioPlayback,
    seekAudioTime,
    setAudioCurrentTime,
    setAudioDuration,
    setAudioPlaybackRate,
    setAudioUseNativeSpeech,
    openVoiceSelector,
    playDevotionalAudio,
    closeAudioPlayer,
    setActiveTab,
  } = useUIStore();

  const { devotionals, setActiveDevotionalId } = useDevotionalStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const speechStartedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  const [isMuted, setIsMuted] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [radarTooltip, setRadarTooltip] = useState<string | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>([6, 6, 6, 6, 6, 6, 6, 6]);

  // Determine active devotional data
  const activeDevotional =
    propDevotional ||
    devotionals.find((d) => d.id === audioState.devotionalId) ||
    devotionals[0] ||
    null;

  const title =
    propTitle ||
    audioState.title ||
    activeDevotional?.title ||
    'The Secret Place of Grace';

  const artist =
    propArtist ||
    audioState.scripture ||
    activeDevotional?.scripture ||
    'Daily MDMI Devotional';

  const albumArt =
    propAlbumArt ||
    activeDevotional?.imageUrl ||
    DEFAULT_ART;

  const isPlaying =
    propIsPlaying !== undefined ? propIsPlaying : audioState.isPlaying;

  // Actual calculated duration from devotional script & speed (never hardcoded)
  const calculatedActualDuration = useMemo(() => {
    if (activeDevotional) {
      return calculateAudioDuration(activeDevotional, audioState.playbackRate);
    }
    return 0;
  }, [activeDevotional, audioState.playbackRate]);

  const duration =
    propDuration !== undefined
      ? propDuration
      : audioState.duration > 0
      ? audioState.duration
      : calculatedActualDuration;

  // Sync actual calculated duration to store when uninitialized
  useEffect(() => {
    if (audioState.duration === 0 && calculatedActualDuration > 0) {
      setAudioDuration(calculatedActualDuration);
    }
  }, [audioState.duration, calculatedActualDuration, setAudioDuration]);

  const currentTime =
    propCurrentTime !== undefined
      ? propCurrentTime
      : audioState.currentTime;

  // Audio Engine Lifecycle: Native Speech & HTML Audio Element
  useEffect(() => {
    if (propIsPlaying !== undefined) return; // Controlled externally

    if (audioState.useNativeSpeech) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (audioState.isPlaying && !audioState.isLoadingAudio && audioState.speechText) {
        if (!speechStartedRef.current) {
          speechStartedRef.current = true;
          nativeSpeech.speak(audioState.speechText, {
            rate: audioState.playbackRate,
            estimatedDuration: audioState.duration,
            onProgress: (time) => setAudioCurrentTime(time),
            onEnd: () => {
              speechStartedRef.current = false;
              toggleAudioPlayback();
            },
          });
        } else {
          nativeSpeech.resume();
        }
      } else if (!audioState.isPlaying) {
        nativeSpeech.pause();
      }
      return;
    }

    // HTML Audio Element path
    if (!audioRef.current) return;

    if (audioState.isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err && (err.name === 'AbortError' || err.code === 20)) {
            // User paused or scrubbed before play finished loading - normal browser event
            return;
          }
          console.warn('Audio URL playback notice:', err);
          // If direct link failed and not already proxied, seamlessly try proxy stream
          if (
            audioState.audioUrl &&
            !audioState.audioUrl.startsWith('/api/proxy-audio') &&
            audioRef.current
          ) {
            const proxyUrl = `${getApiBaseUrl()}/api/proxy-audio?url=${encodeURIComponent(audioState.audioUrl)}`;
            audioRef.current.src = proxyUrl;
            audioRef.current.play().catch((proxyErr) => {
              console.warn('Proxy audio playback also failed, auto-fallback to voice reader:', proxyErr);
              setAudioUseNativeSpeech(true);
            });
          } else {
            setAudioUseNativeSpeech(true);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [
    audioState.isPlaying,
    audioState.audioUrl,
    audioState.useNativeSpeech,
    audioState.speechText,
    audioState.isLoadingAudio,
    audioState.playbackRate,
    audioState.duration,
    propIsPlaying,
    setAudioCurrentTime,
    toggleAudioPlayback,
    setAudioUseNativeSpeech,
  ]);

  // Adjust playback speed on engines
  useEffect(() => {
    if (audioState.useNativeSpeech) {
      nativeSpeech.setRate(audioState.playbackRate);
    } else if (audioRef.current) {
      audioRef.current.playbackRate = audioState.playbackRate;
    }
  }, [audioState.playbackRate, audioState.useNativeSpeech]);

  // Real-time visualizer spectrum subscription (uses safe acoustic simulation)
  useEffect(() => {
    webAudioApi.setSpeechActive(isPlaying && !isMuted);

    if (!isPlaying || isMuted) {
      setBarHeights([6, 6, 6, 6, 6, 6, 6, 6]);
      return;
    }

    const unsubscribe = webAudioApi.subscribeVisualizer((bars) => {
      // Map normalized 0..1 to height 6px..26px
      setBarHeights(bars.map((b) => Math.round(6 + b * 20)));
    });

    return () => {
      unsubscribe();
    };
  }, [isPlaying, isMuted]);

  // Reset speechStartedRef when devotional changes
  useEffect(() => {
    speechStartedRef.current = false;
  }, [audioState.devotionalId]);

  // Format real duration and timestamps
  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs));
    const mins = Math.floor(safeSecs / 60);
    const rem = safeSecs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Play / Pause Action
  const handlePlayToggle = () => {
    if (propOnPlayPause) {
      propOnPlayPause();
      return;
    }

    if (!audioState.devotionalId && activeDevotional) {
      playDevotionalAudio(activeDevotional);
    } else {
      toggleAudioPlayback();
    }
  };

  // Back (Rewind 15s or Previous Devotional)
  const handleBack = () => {
    if (propOnPrev) {
      propOnPrev();
      return;
    }

    if (currentTime > 3) {
      // Rewind 15 seconds
      const nextTime = Math.max(0, currentTime - 15);
      seekAudioTime(nextTime);
      if (!audioState.useNativeSpeech && audioRef.current) {
        audioRef.current.currentTime = nextTime;
      } else if (audioState.useNativeSpeech) {
        nativeSpeech.seek(nextTime);
      }
    } else {
      // Skip to previous devotional in library
      const idx = devotionals.findIndex((d) => d.id === (audioState.devotionalId || activeDevotional?.id));
      if (idx > 0) {
        const prevDevo = devotionals[idx - 1];
        setActiveDevotionalId(prevDevo.id);
        playDevotionalAudio(prevDevo);
      } else {
        seekAudioTime(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        if (audioState.useNativeSpeech) nativeSpeech.seek(0);
      }
    }
  };

  // Next (Forward 15s or Next Devotional)
  const handleNext = () => {
    if (propOnNext) {
      propOnNext();
      return;
    }

    if (duration - currentTime > 10) {
      // Skip 15 seconds forward
      const nextTime = Math.min(duration, currentTime + 15);
      seekAudioTime(nextTime);
      if (!audioState.useNativeSpeech && audioRef.current) {
        audioRef.current.currentTime = nextTime;
      } else if (audioState.useNativeSpeech) {
        nativeSpeech.seek(nextTime);
      }
    } else {
      // Skip to next devotional in library
      const idx = devotionals.findIndex((d) => d.id === (audioState.devotionalId || activeDevotional?.id));
      if (idx >= 0 && idx < devotionals.length - 1) {
        const nextDevo = devotionals[idx + 1];
        setActiveDevotionalId(nextDevo.id);
        playDevotionalAudio(nextDevo);
      } else {
        const nextTime = duration;
        seekAudioTime(nextTime);
        if (audioRef.current) audioRef.current.currentTime = nextTime;
        if (audioState.useNativeSpeech) nativeSpeech.seek(nextTime);
      }
    }
  };

  // Effective Duration for scrubbing and metric display
  const effectiveDuration = duration && duration > 0 ? duration : (activeDevotional?.audioDurationSeconds || 195);

  // Scrubber calculation
  const seekToPosition = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = rect.width > 0 ? clickX / rect.width : 0;
      const targetSecs = Math.max(0, Math.min(effectiveDuration, Math.round(ratio * effectiveDuration)));

      if (propOnSeek) {
        propOnSeek(targetSecs);
      } else {
        setAudioCurrentTime(targetSecs);
        seekAudioTime(targetSecs);
        if (!audioState.useNativeSpeech && audioRef.current) {
          audioRef.current.currentTime = targetSecs;
        } else if (audioState.useNativeSpeech) {
          nativeSpeech.seek(targetSecs);
        }
      }
    },
    [effectiveDuration, propOnSeek, seekAudioTime, setAudioCurrentTime, audioState.useNativeSpeech]
  );

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    seekToPosition(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        seekToPosition(moveEvent.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleProgressBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    if (e.touches.length > 0) {
      seekToPosition(e.touches[0].clientX);
    }

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (isDraggingRef.current && moveEvent.touches.length > 0) {
        seekToPosition(moveEvent.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Radar Button action: Cycles speed & toggles mode with feedback
  const handleRadarClick = () => {
    const rates = [1.0, 1.25, 1.5, 0.85];
    const nextIndex = (rates.indexOf(audioState.playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setAudioPlaybackRate(nextRate);

    const msg = `Speed: ${nextRate}x`;
    setRadarTooltip(msg);
    setTimeout(() => setRadarTooltip(null), 1800);
  };

  // Toggle Voice Narration vs Track Audio
  const handleToggleEngine = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioState.useNativeSpeech) {
      if (audioState.audioUrl) {
        nativeSpeech.pause();
        speechStartedRef.current = false;
        setAudioUseNativeSpeech(false);
        setRadarTooltip('Switched to Audio Track');
      } else {
        setRadarTooltip('Voice Reader Active');
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
      speechStartedRef.current = false;
      setAudioUseNativeSpeech(true);
      setRadarTooltip('Switched to Voice Reader');
    }
    setTimeout(() => setRadarTooltip(null), 1800);
  };

  // Toggle Mute on Volume Bars
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    setRadarTooltip(nextMuted ? 'Audio Muted' : 'Audio Unmuted');
    setTimeout(() => setRadarTooltip(null), 1800);
  };

  // Close Player
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechStartedRef.current = false;
    nativeSpeech.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (propOnClose) {
      propOnClose();
    } else {
      closeAudioPlayer();
    }
  };

  // Open Devotional in Reader
  const handleOpenDevotional = () => {
    if (activeDevotional) {
      setActiveDevotionalId(activeDevotional.id);
      setActiveTab('reader');
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (effectiveDuration || 1)) * 100));

  return (
    <div className={`music-player-container ${className}`}>
      <div className="main-music-card relative select-none">
        {/* Hidden Audio Element for Streaming Tracks */}
        {!audioState.useNativeSpeech && audioState.audioUrl && (
          <audio
            ref={audioRef}
            src={audioState.audioUrl}
            preload="auto"
            playsInline
            onTimeUpdate={(e) => {
              if (!isDraggingRef.current) {
                setAudioCurrentTime(e.currentTarget.currentTime);
              }
            }}
            onDurationChange={(e) => {
              const d = e.currentTarget.duration;
              if (d && isFinite(d) && d > 0) {
                setAudioDuration(Math.round(d));
              }
            }}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (d && isFinite(d) && d > 0) {
                setAudioDuration(Math.round(d));
              }
            }}
            onEnded={() => {
              speechStartedRef.current = false;
              toggleAudioPlayback();
            }}
            onError={() => {
              if (
                audioState.audioUrl &&
                !audioState.audioUrl.startsWith('/api/proxy-audio') &&
                audioRef.current
              ) {
                const proxyUrl = `${getApiBaseUrl()}/api/proxy-audio?url=${encodeURIComponent(audioState.audioUrl)}`;
                audioRef.current.src = proxyUrl;
                audioRef.current.play().catch(() => {
                  setAudioUseNativeSpeech(true);
                });
              } else {
                setAudioUseNativeSpeech(true);
              }
            }}
          />
        )}

        {/* Top Floating Controls: Voice Selector & Close Button */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={openVoiceSelector}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition-all shadow-xs border border-white/10 active:scale-95 group"
            title="Click to choose narrator voice, pitch, and speed"
          >
            <Mic className="w-3.5 h-3.5 text-[#84CC16] group-hover:scale-110 transition-transform" />
            <span className="text-[#84CC16]">Voice:</span>
            <span className="text-white/90 max-w-[125px] truncate">
              {audioState.selectedVoiceName || 'Spiritual Reader'}
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/80">{audioState.playbackRate}x</span>
            <ChevronDown className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
          </button>

          {showCloseButton && (
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              aria-label="Close audio player"
              title="Close Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Radar Feedback Toast */}
        {radarTooltip && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900/95 border border-neutral-700 text-white text-[11px] font-bold rounded-full shadow-lg z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            {radarTooltip}
          </div>
        )}

        {/* Track Info Row */}
        <div className="track-info">
          <div
            onClick={handleOpenDevotional}
            className="album-art cursor-pointer hover:scale-105 transition-transform"
            style={{
              backgroundImage: `url("${albumArt}")`,
            }}
            title="Click to read devotional"
            role="button"
            tabIndex={0}
          />

          <div
            onClick={handleOpenDevotional}
            className="track-details cursor-pointer group"
            title="Click to read devotional"
            role="button"
            tabIndex={0}
          >
            <div className="track-title group-hover:text-[#65A30D] dark:group-hover:text-[#84CC16] transition-colors">
              {title}
            </div>
            <div className="artist-name">
              {artist}
            </div>
          </div>

          {/* 8 Live Equalizer Volume Bars */}
          <div
            className="volume-bars cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            role="button"
            tabIndex={0}
            aria-label="Volume Bars visualizer"
          >
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`bar ${isPlaying && !isMuted ? 'animate-bounce-bar' : ''}`}
                style={{ height: `${isMuted ? 4 : h}px`, opacity: isMuted ? 0.35 : 1 }}
              />
            ))}
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="playback-controls">
          <div className="time-info">
            <span className="current-time">{formatTime(currentTime)}</span>
            <button
              type="button"
              onClick={() => setShowRemaining((prev) => !prev)}
              className="remaining-time font-mono hover:text-white transition-colors cursor-pointer"
              title={showRemaining ? 'Click to show total audio duration' : 'Click to show remaining time'}
            >
              {showRemaining
                ? `-${formatTime(Math.max(0, effectiveDuration - currentTime))}`
                : formatTime(effectiveDuration)}
            </button>
          </div>

          {/* Interactive Progress Bar */}
          <div
            ref={progressBarRef}
            className="progress-bar group py-1.5 -my-1 cursor-pointer"
            onClick={(e) => seekToPosition(e.clientX)}
            onMouseDown={handleProgressBarMouseDown}
            onTouchStart={handleProgressBarTouchStart}
            role="slider"
            aria-label="Seek track position"
            aria-valuemin={0}
            aria-valuemax={effectiveDuration}
            aria-valuenow={currentTime}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                seekAudioTime(Math.max(0, currentTime - 5));
              } else if (e.key === 'ArrowRight') {
                seekAudioTime(Math.min(effectiveDuration, currentTime + 5));
              }
            }}
          >
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="progress-handle group-hover:scale-125 transition-transform"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <div className="button-row">
            <div className="main-control-btns">
              {/* Back Button (Rewind 15s) */}
              <button
                type="button"
                className="control-button back"
                onClick={handleBack}
                aria-label="Rewind 15 seconds"
                title="Rewind 15s"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={22}
                  height={22}
                  fill="currentColor"
                  className="bi bi-skip-backward-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" />
                </svg>
              </button>

              {/* Play / Pause Signature Button */}
              <div className="play-pause-btns">
                <button
                  type="button"
                  onClick={handlePlayToggle}
                  className="control-button play-pause-button cursor-pointer flex items-center justify-center transition-transform active:scale-95"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {audioState.isLoadingAudio ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  )}
                </button>
              </div>

              {/* Next Button (Forward 15s) */}
              <button
                type="button"
                className="control-button next"
                onClick={handleNext}
                aria-label="Skip forward 15 seconds"
                title="Forward 15s"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={22}
                  height={22}
                  fill="currentColor"
                  className="bi bi-skip-forward-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
                </svg>
              </button>
            </div>

            {/* Radar Button (Speed & Audio Settings) */}
            <button
              type="button"
              className="control-button d"
              onClick={handleRadarClick}
              aria-label={`Playback speed: ${audioState.playbackRate}x`}
              title={`Speed: ${audioState.playbackRate}x (Click to cycle speed)`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                fill="currentColor"
                className="bi bi-radar"
                viewBox="0 0 16 16"
              >
                <path d="M6.634 1.135A7 7 0 0 1 15 8a.5.5 0 0 1-1 0 6 6 0 1 0-6.5 5.98v-1.005A5 5 0 1 1 13 8a.5.5 0 0 1-1 0 4 4 0 1 0-4.5 3.969v-1.011A2.999 2.999 0 1 1 11 8a.5.5 0 0 1-1 0 2 2 0 1 0-2.5 1.936v-1.07a1 1 0 1 1 1 0V15.5a.5.5 0 0 1-1 0v-.518a7 7 0 0 1-.866-13.847" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
