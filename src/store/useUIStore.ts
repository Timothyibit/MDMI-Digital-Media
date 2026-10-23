import { create } from 'zustand';
import { ThemeMode, Devotional, TabType } from '../types';
import {
  generateDevotionalSpeech,
  buildDevotionalScript,
  calculateAudioDuration,
  calculateTextToSpeechDuration,
  probeAudioFileDuration,
  normalizeAudioUrl,
} from '../services/aiAudioService';
import { useDevotionalStore } from './useDevotionalStore';
import { nativeSpeech } from '../services/nativeSpeechService';

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
  diagnosticLogsOpen: boolean;

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

  openCommentsSheet: (devotionalId?: string | null) => void;
  closeCommentsSheet: () => void;

  openVerseShare: (data: { scripture: string; scriptureText: string; title: string; author: string }) => void;
  closeVerseShare: () => void;

  openVoiceSelector: () => void;
  closeVoiceSelector: () => void;

  openDiagnosticLogs: () => void;
  closeDiagnosticLogs: () => void;

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
    diagnosticLogsOpen: false,

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

    openCommentsSheet: (commentsDevotionalId) => {
      const activeId =
        commentsDevotionalId ||
        useDevotionalStore.getState().activeDevotionalId ||
        useDevotionalStore.getState().devotionals[0]?.id ||
        null;
      set({ commentsSheetOpen: true, commentsDevotionalId: activeId });
    },

    closeCommentsSheet: () => set({ commentsSheetOpen: false, commentsDevotionalId: null }),

    openVerseShare: (shareVerseData) =>
      set({ verseShareModalOpen: true, shareVerseData }),

    closeVerseShare: () => set({ verseShareModalOpen: false, shareVerseData: null }),

    openVoiceSelector: () => set({ voiceSelectorOpen: true }),
    closeVoiceSelector: () => set({ voiceSelectorOpen: false }),

    openDiagnosticLogs: () => set({ diagnosticLogsOpen: true }),
    closeDiagnosticLogs: () => set({ diagnosticLogsOpen: false }),

    playDevotionalAudio: (devotional) => {
      const currentRate = get().audioState.playbackRate || 1.0;
      const script = buildDevotionalScript(devotional);
      const rawAudio = devotional.audioUrl ? devotional.audioUrl.trim() : null;
      const normalizedUrl = rawAudio ? normalizeAudioUrl(rawAudio) : null;
      const hasAudioUrl = Boolean(normalizedUrl);

      // Warm up audio context synchronously inside the user gesture
      try {
        nativeSpeech.playOpeningChime();
      } catch {
        // ignore
      }

      let exactDuration = 0;
      if (hasAudioUrl) {
        if (devotional.audioDurationSeconds && devotional.audioDurationSeconds > 0) {
          exactDuration = devotional.audioDurationSeconds;
        } else {
          exactDuration = calculateAudioDuration(devotional, currentRate);
        }
        probeAudioFileDuration(normalizedUrl!).then((probed) => {
          if (probed > 0) {
            get().setAudioDuration(probed);
          }
        });
      } else {
        // Accurately calculated text-to-speech duration for spoken narration
        exactDuration = calculateTextToSpeechDuration(script, currentRate);
      }

      set({
        audioState: {
          ...get().audioState,
          devotionalId: devotional.id,
          title: devotional.title,
          scripture: devotional.scripture,
          audioUrl: normalizedUrl,
          isPlaying: true,
          isLoadingAudio: false,
          currentTime: 0,
          duration: exactDuration,
          playbackRate: currentRate,
          useNativeSpeech: !hasAudioUrl, // If audioUrl is uploaded, play audio file; otherwise use voice narration
          speechText: script,
        },
      });
    },

    toggleAudioPlayback: () => {
      const current = get().audioState;
      const nextPlaying = !current.isPlaying;
      if (nextPlaying) {
        try {
          nativeSpeech.playOpeningChime();
        } catch {
          // ignore
        }
      }
      set({
        audioState: {
          ...current,
          isPlaying: nextPlaying,
        },
      });
    },

    seekAudioTime: (timeSeconds) => {
      const current = get().audioState;
      const targetTime = Math.min(current.duration || 9999, Math.max(0, timeSeconds));
      set({
        audioState: {
          ...current,
          currentTime: targetTime,
        },
      });
      if (current.useNativeSpeech) {
        import('../services/nativeSpeechService').then(({ nativeSpeech }) => {
          nativeSpeech.seek(targetTime);
        });
      }
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

      if (current.useNativeSpeech && current.speechText) {
        import('../services/aiAudioService').then(({ calculateTextToSpeechDuration }) => {
          const updatedDur = calculateTextToSpeechDuration(current.speechText!, playbackRate);
          set({
            audioState: {
              ...get().audioState,
              playbackRate,
              duration: updatedDur,
            },
          });
        });
        return;
      }

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
      if (useNativeSpeech && current.speechText) {
        import('../services/aiAudioService').then(({ calculateTextToSpeechDuration }) => {
          const ttsDur = calculateTextToSpeechDuration(current.speechText!, current.playbackRate);
          set({
            audioState: {
              ...current,
              useNativeSpeech,
              duration: ttsDur,
            },
          });
        });
        return;
      }
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
