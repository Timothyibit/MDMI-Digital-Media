import { create } from 'zustand';
import { ThemeMode, Devotional, TabType } from '../types';
import { generateDevotionalSpeech } from '../services/aiAudioService';

interface UIState {
  activeTab: TabType;
  theme: ThemeMode;
  reducedMotion: boolean;
  isOffline: boolean;

  // Modals & Sheets
  authGateOpen: boolean;
  authGateReason: string;
  authModalMode: 'signin' | 'register' | 'forgot' | 'verify';
  onboardingOpen: boolean;
  introSplashOpen: boolean;
  commentsSheetOpen: boolean;
  commentsDevotionalId: string | null;
  verseShareModalOpen: boolean;
  shareVerseData: { scripture: string; scriptureText: string; title: string; author: string } | null;
  voiceSelectorOpen: boolean;

  // Audio Narration Mini-Player (AI Auto Text-to-Speech & Native Voice Engine)
  audioState: {
    devotionalId: string | null;
    title: string;
    scripture: string;
    audioUrl: string | null;
    isPlaying: boolean;
    isLoadingAudio: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    useNativeSpeech?: boolean;
    speechText?: string;
    selectedVoiceURI?: string | null;
    selectedVoiceName?: string | null;
    pitch?: number;
  };

  // Celebration
  confettiMilestone: number | null;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setTheme: (theme: ThemeMode) => void;
  setReducedMotion: (val: boolean) => void;
  setIsOffline: (val: boolean) => void;

  openAuthGate: (reason?: string, initialMode?: 'signin' | 'register' | 'forgot' | 'verify') => void;
  closeAuthGate: () => void;
  setAuthModalMode: (mode: 'signin' | 'register' | 'forgot' | 'verify') => void;

  openOnboarding: () => void;
  closeOnboarding: () => void;
  openIntroSplash: () => void;
  closeIntroSplash: () => void;

  openCommentsSheet: (devotionalId: string) => void;
  closeCommentsSheet: () => void;

  openVerseShare: (data: { scripture: string; scriptureText: string; title: string; author: string }) => void;
  closeVerseShare: () => void;

  openVoiceSelector: () => void;
  closeVoiceSelector: () => void;

  playDevotionalAudio: (devotional: Devotional) => void;
  toggleAudioPlayback: () => void;
  seekAudioTime: (timeSeconds: number) => void;
  setAudioDuration: (duration: number) => void;
  setAudioCurrentTime: (time: number) => void;
  setAudioPlaybackRate: (rate: number) => void;
  setAudioUseNativeSpeech: (useNativeSpeech: boolean) => void;
  setAudioVoice: (voiceURI: string | null, voiceName?: string | null) => void;
  setAudioPitch: (pitch: number) => void;
  closeAudioPlayer: () => void;

  triggerConfetti: (milestone: number) => void;
  dismissConfetti: () => void;
}

const STORAGE_KEY_THEME = 'mdmi_user_theme';
const STORAGE_KEY_MOTION = 'mdmi_reduced_motion';

export const useUIStore = create<UIState>((set, get) => {
  let savedTheme: ThemeMode = 'light';
  let savedMotion = false;

  try {
    const t = localStorage.getItem(STORAGE_KEY_THEME);
    if (t === 'light' || t === 'dark') {
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
    authModalMode: 'signin',
    onboardingOpen: false,
    introSplashOpen: false,
    commentsSheetOpen: false,
    commentsDevotionalId: null,
    verseShareModalOpen: false,
    shareVerseData: null,
    voiceSelectorOpen: false,

    audioState: {
      devotionalId: null,
      title: '',
      scripture: '',
      audioUrl: null,
      isPlaying: false,
      isLoadingAudio: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      selectedVoiceURI: typeof localStorage !== 'undefined' ? localStorage.getItem('mdmi_voice_uri') : null,
      selectedVoiceName: typeof localStorage !== 'undefined' ? localStorage.getItem('mdmi_voice_name') : null,
      pitch: 1.0,
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

    openAuthGate: (reason, initialMode = 'signin') =>
      set({
        authGateOpen: true,
        authGateReason:
          reason || 'Connect your account to write journal notes and share spiritual reflections.',
        authModalMode: initialMode,
      }),

    closeAuthGate: () => set({ authGateOpen: false }),

    setAuthModalMode: (authModalMode) => set({ authModalMode }),

    openOnboarding: () => set({ onboardingOpen: true }),
    closeOnboarding: () => set({ onboardingOpen: false }),

    openIntroSplash: () => set({ introSplashOpen: true }),
    closeIntroSplash: () => set({ introSplashOpen: false }),

    openCommentsSheet: (commentsDevotionalId) =>
      set({ commentsSheetOpen: true, commentsDevotionalId }),

    closeCommentsSheet: () => set({ commentsSheetOpen: false, commentsDevotionalId: null }),

    openVerseShare: (shareVerseData) =>
      set({ verseShareModalOpen: true, shareVerseData }),

    closeVerseShare: () => set({ verseShareModalOpen: false, shareVerseData: null }),

    openVoiceSelector: () => set({ voiceSelectorOpen: true }),
    closeVoiceSelector: () => set({ voiceSelectorOpen: false }),

    playDevotionalAudio: async (devotional) => {
      const { buildDevotionalScript, calculateAudioDuration } = await import('../services/aiAudioService');
      const currentRate = get().audioState.playbackRate || 1.0;
      const script = buildDevotionalScript(devotional);
      const estDuration = calculateAudioDuration(devotional, currentRate);

      // Immediately start playing with zero waiting latency using Speech Engine
      set({
        audioState: {
          ...get().audioState,
          devotionalId: devotional.id,
          title: devotional.title,
          scripture: devotional.scripture,
          audioUrl: devotional.audioUrl || null,
          isPlaying: true,
          isLoadingAudio: false,
          currentTime: 0,
          duration: estDuration,
          playbackRate: currentRate,
          useNativeSpeech: true, // Always prioritize voice reading the devotional aloud
          speechText: script,
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
      const oldRate = current.playbackRate || 1.0;
      const newDuration =
        current.duration > 0 && oldRate > 0 && playbackRate > 0
          ? Math.round(current.duration * (oldRate / playbackRate))
          : current.duration;

      set({
        audioState: {
          ...current,
          playbackRate,
          duration: newDuration,
        },
      });
    },

    setAudioUseNativeSpeech: (useNativeSpeech) => {
      const current = get().audioState;
      set({ audioState: { ...current, useNativeSpeech } });
    },

    setAudioVoice: (voiceURI, voiceName) => {
      const current = get().audioState;
      try {
        if (voiceURI) {
          localStorage.setItem('mdmi_voice_uri', voiceURI);
          if (voiceName) localStorage.setItem('mdmi_voice_name', voiceName);
        } else {
          localStorage.removeItem('mdmi_voice_uri');
          localStorage.removeItem('mdmi_voice_name');
        }
      } catch {
        // LocalStorage notice
      }
      set({
        audioState: {
          ...current,
          selectedVoiceURI: voiceURI,
          selectedVoiceName: voiceName || null,
        },
      });
      import('../services/nativeSpeechService').then(({ nativeSpeech }) => {
        nativeSpeech.setSelectedVoiceURI(voiceURI);
      });
    },

    setAudioPitch: (pitch) => {
      const current = get().audioState;
      set({
        audioState: {
          ...current,
          pitch,
        },
      });
      import('../services/nativeSpeechService').then(({ nativeSpeech }) => {
        nativeSpeech.setPitch(pitch);
      });
    },

    closeAudioPlayer: () => {
      set({
        audioState: {
          ...get().audioState,
          devotionalId: null,
          title: '',
          scripture: '',
          audioUrl: null,
          isPlaying: false,
          isLoadingAudio: false,
          currentTime: 0,
          duration: 0,
        },
      });
    },

    triggerConfetti: (confettiMilestone) => set({ confettiMilestone }),
    dismissConfetti: () => set({ confettiMilestone: null }),
  };
});
