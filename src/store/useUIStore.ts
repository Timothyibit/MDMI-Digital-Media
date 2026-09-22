import { create } from 'zustand';
import { ThemeMode, Devotional } from '../types';

interface UIState {
  activeTab: 'home' | 'devotionals' | 'journal' | 'profile' | 'admin' | 'reader';
  theme: ThemeMode;
  reducedMotion: boolean;
  isOffline: boolean;

  // Modals & Sheets
  authGateOpen: boolean;
  authGateReason: string;
  commentsSheetOpen: boolean;
  commentsDevotionalId: string | null;
  verseShareModalOpen: boolean;
  shareVerseData: { scripture: string; scriptureText: string; title: string; author: string } | null;

  // Audio Narration Mini-Player
  audioState: {
    devotionalId: string | null;
    title: string;
    scripture: string;
    audioUrl: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
  };

  // Celebration
  confettiMilestone: number | null;

  // Actions
  setActiveTab: (tab: 'home' | 'devotionals' | 'journal' | 'profile' | 'admin' | 'reader') => void;
  setTheme: (theme: ThemeMode) => void;
  setReducedMotion: (val: boolean) => void;
  setIsOffline: (val: boolean) => void;

  openAuthGate: (reason?: string) => void;
  closeAuthGate: () => void;

  openCommentsSheet: (devotionalId: string) => void;
  closeCommentsSheet: () => void;

  openVerseShare: (data: { scripture: string; scriptureText: string; title: string; author: string }) => void;
  closeVerseShare: () => void;

  playDevotionalAudio: (devotional: Devotional) => void;
  toggleAudioPlayback: () => void;
  seekAudioTime: (timeSeconds: number) => void;
  setAudioDuration: (duration: number) => void;
  setAudioCurrentTime: (time: number) => void;
  setAudioPlaybackRate: (rate: number) => void;
  closeAudioPlayer: () => void;

  triggerConfetti: (milestone: number) => void;
  dismissConfetti: () => void;
}

const STORAGE_KEY_THEME = 'mdmi_user_theme';
const STORAGE_KEY_MOTION = 'mdmi_reduced_motion';

export const useUIStore = create<UIState>((set, get) => {
  let savedTheme: ThemeMode = 'system';
  let savedMotion = false;

  try {
    const t = localStorage.getItem(STORAGE_KEY_THEME);
    if (t === 'light' || t === 'dark' || t === 'sepia' || t === 'system') {
      savedTheme = t;
    }
    const m = localStorage.getItem(STORAGE_KEY_MOTION);
    if (m) savedMotion = JSON.parse(m);
  } catch {
    // fallback
  }

  return {
    activeTab: 'home',
    theme: savedTheme,
    reducedMotion: savedMotion,
    isOffline: !navigator.onLine,

    authGateOpen: false,
    authGateReason: 'Sign in to share reflections with the MDMI community and sync across devices.',
    commentsSheetOpen: false,
    commentsDevotionalId: null,
    verseShareModalOpen: false,
    shareVerseData: null,

    audioState: {
      devotionalId: null,
      title: '',
      scripture: '',
      audioUrl: null,
      isPlaying: false,
      currentTime: 0,
      duration: 180,
      playbackRate: 1.0,
    },

    confettiMilestone: null,

    setActiveTab: (activeTab) => set({ activeTab }),

    setTheme: (theme) => {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      set({ theme });
    },

    setReducedMotion: (reducedMotion) => {
      localStorage.setItem(STORAGE_KEY_MOTION, JSON.stringify(reducedMotion));
      set({ reducedMotion });
    },

    setIsOffline: (isOffline) => set({ isOffline }),

    openAuthGate: (reason) =>
      set({
        authGateOpen: true,
        authGateReason:
          reason || 'Connect your account to write journal notes and share spiritual reflections.',
      }),

    closeAuthGate: () => set({ authGateOpen: false }),

    openCommentsSheet: (commentsDevotionalId) =>
      set({ commentsSheetOpen: true, commentsDevotionalId }),

    closeCommentsSheet: () => set({ commentsSheetOpen: false, commentsDevotionalId: null }),

    openVerseShare: (shareVerseData) =>
      set({ verseShareModalOpen: true, shareVerseData }),

    closeVerseShare: () => set({ verseShareModalOpen: false, shareVerseData: null }),

    playDevotionalAudio: (devotional) => {
      set({
        audioState: {
          devotionalId: devotional.id,
          title: devotional.title,
          scripture: devotional.scripture,
          audioUrl: devotional.audioUrl,
          isPlaying: true,
          currentTime: 0,
          duration: devotional.audioDurationSeconds || 180,
          playbackRate: 1.0,
        },
      });
    },

    toggleAudioPlayback: () => {
      const current = get().audioState;
      set({
        audioState: {
          ...current,
          isPlaying: !current.isPlaying,
        },
      });
    },

    seekAudioTime: (timeSeconds) => {
      const current = get().audioState;
      set({
        audioState: {
          ...current,
          currentTime: Math.min(current.duration, Math.max(0, timeSeconds)),
        },
      });
    },

    setAudioDuration: (duration) => {
      const current = get().audioState;
      set({ audioState: { ...current, duration } });
    },

    setAudioCurrentTime: (currentTime) => {
      const current = get().audioState;
      set({ audioState: { ...current, currentTime } });
    },

    setAudioPlaybackRate: (playbackRate) => {
      const current = get().audioState;
      set({ audioState: { ...current, playbackRate } });
    },

    closeAudioPlayer: () => {
      set({
        audioState: {
          devotionalId: null,
          title: '',
          scripture: '',
          audioUrl: null,
          isPlaying: false,
          currentTime: 0,
          duration: 180,
          playbackRate: 1.0,
        },
      });
    },

    triggerConfetti: (confettiMilestone) => set({ confettiMilestone }),
    dismissConfetti: () => set({ confettiMilestone: null }),
  };
});
