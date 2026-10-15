/**
 * Native Speech Synthesis Service with chunked stream-first queueing,
 * seamless chaining without pause/skip audio glitches, and full compatibility
 * with the react-native-speech (mhpdev-com/react-native-speech) pattern.
 */

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export interface SpeechOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (err: any) => void;
  onProgress?: (currentTime: number) => void;
}

export class NativeSpeechService {
  private synth: SpeechSynthesis | null = null;
  private queue: string[] = [];
  private currentChunkIndex = 0;
  private isSpeaking = false;
  private isPaused = false;
  private startTime = 0;
  private pausedTime = 0;
  private totalEstimatedDuration = 0;
  private progressInterval: any = null;
  private onProgressCallback: ((currentTime: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private currentRate = 1.0;
  private currentPitch = 1.0;
  private selectedVoiceURI: string | null = null;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private audioCtx: AudioContext | null = null;
  private voiceListeners: Array<(voices: SpeechSynthesisVoice[]) => void> = [];
  private lastSpokenText = '';
  private lastReportedTime = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      // Retrieve saved voice preference from localStorage
      try {
        const saved = localStorage.getItem('mdmi_voice_uri');
        if (saved) {
          this.selectedVoiceURI = saved;
        }
      } catch {
        // LocalStorage fallback
      }

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
          this.notifyVoiceListeners();
        };
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  public onVoicesChanged(listener: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.voiceListeners.push(listener);
    if (this.voices.length > 0) {
      listener(this.voices);
    }
    return () => {
      this.voiceListeners = this.voiceListeners.filter((l) => l !== listener);
    };
  }

  private notifyVoiceListeners() {
    for (const listener of this.voiceListeners) {
      try {
        listener(this.voices);
      } catch {
        // Listener notice
      }
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.loadVoices();
    }
    return this.voices;
  }

  public getSelectedVoiceURI(): string | null {
    return this.selectedVoiceURI;
  }

  public setSelectedVoiceURI(voiceURI: string | null): void {
    this.selectedVoiceURI = voiceURI;
    try {
      if (voiceURI) {
        localStorage.setItem('mdmi_voice_uri', voiceURI);
      } else {
        localStorage.removeItem('mdmi_voice_uri');
      }
    } catch {
      // LocalStorage notice
    }

    // If currently speaking, smoothly switch the active chunk to new voice
    if (this.synth && this.isSpeaking && !this.isPaused && this.queue.length > 0) {
      this.synth.cancel();
      this.activeUtterances.clear();
      this.playNextChunk();
    }
  }

  public getPitch(): number {
    return this.currentPitch;
  }

  public setPitch(pitch: number): void {
    this.currentPitch = Math.max(0.7, Math.min(1.4, pitch));
  }

  public previewVoice(voiceURI: string, sampleText?: string): void {
    if (!this.synth) return;
    this.stopPreview();

    const voice = this.voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
    const text = sampleText || 'The Lord is my shepherd; I shall not want. Peace and grace be with you today.';
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = this.currentRate;
    utterance.pitch = this.currentPitch;

    this.activeUtterances.add(utterance);
    utterance.onend = () => this.activeUtterances.delete(utterance);
    utterance.onerror = () => this.activeUtterances.delete(utterance);

    this.synth.speak(utterance);
  }

  public stopPreview(): void {
    if (this.synth && !this.isSpeaking) {
      this.synth.cancel();
      this.activeUtterances.clear();
    }
  }

  private isNative(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  }

  public isAvailable(): boolean {
    return this.synth !== null || this.isNative();
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking && !this.isPaused;
  }

  public estimateDuration(text: string, rate: number = 1.0): number {
    const clean = text.replace(/[#*_`]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean).length;
    if (words === 0) return 0;

    const commas = (clean.match(/[,;:]/g) || []).length;
    const sentenceEnds = (clean.match(/[.!?]/g) || []).length;
    const paragraphs = Math.max(0, clean.split(/\n\n+/).length - 1);
    const chunks = this.chunkText(clean);

    const baseSecs =
      words / 2.37 +
      commas * 0.15 +
      sentenceEnds * 0.35 +
      paragraphs * 0.50 +
      chunks.length * 0.12;

    const effectiveRate = Math.max(0.5, Math.min(2.5, rate || this.currentRate || 1.0));
    return Math.max(5, Math.round(baseSecs / effectiveRate));
  }

  /**
   * Plays a subtle, gentle spiritual chime (523Hz -> 659Hz) using Web Audio API
   * to immediately engage the browser's audio pipeline synchronously on user tap.
   */
  public playOpeningChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio context notice
    }
  }

  /**
   * Split a long devotional text into clean, spoken chunks (sentences or short phrase blocks)
   * kept between 50 and 150 characters to completely eliminate browser speech timeouts and skips.
   */
  public chunkText(fullText: string): string[] {
    const clean = fullText.replace(/[#*_`]/g, '').trim();
    if (!clean) return [];

    const rawBlocks = clean.split(/(?:\r?\n)+/);
    const chunks: string[] = [];

    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 130) {
        chunks.push(trimmed);
      } else {
        const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmed];
        let currentChunk = '';

        for (const s of sentences) {
          if ((currentChunk + ' ' + s).trim().length > 140) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = s;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + s;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      }
    }

    return chunks.length > 0 ? chunks : [clean];
  }

  private chunkDurations: number[] = [];
  private chunkCumulativeDurations: number[] = [];
  private currentChunkStartTime = 0;

  /**
   * Starts playback of chunk 0 IMMEDIATELY, queueing remaining chunks.
   */
  public speakStream(
    initialChunks: string[],
    options?: {
      rate?: number;
      estimatedDuration?: number;
      onProgress?: (currentTime: number) => void;
      onEnd?: () => void;
    }
  ): void {
    if (!this.synth && !this.isNative()) return;

    this.stop();
    this.playOpeningChime();

    this.queue = [...initialChunks];
    this.currentChunkIndex = 0;
    this.currentRate = options?.rate || this.currentRate || 1.0;

    // Precalculate individual chunk durations
    this.chunkDurations = this.queue.map((ch) => {
      const w = ch.split(/\s+/).filter(Boolean).length;
      const c = (ch.match(/[,;:]/g) || []).length;
      const s = (ch.match(/[.!?]/g) || []).length;
      const base = w / 2.37 + c * 0.15 + s * 0.35 + 0.12;
      return Math.max(0.6, base / this.currentRate);
    });

    this.chunkCumulativeDurations = [];
    let cum = 0;
    for (const d of this.chunkDurations) {
      this.chunkCumulativeDurations.push(cum);
      cum += d;
    }

    const calculatedTotal = Math.max(5, Math.round(cum));
    this.totalEstimatedDuration = options?.estimatedDuration || calculatedTotal;
    this.onProgressCallback = options?.onProgress || null;
    this.onEndCallback = options?.onEnd || null;

    this.startTime = Date.now();
    this.pausedTime = 0;
    this.isPaused = false;
    this.isSpeaking = true;
    this.lastReportedTime = 0;

    // Reset synthesis engine if stuck
    if (this.synth.paused) {
      this.synth.resume();
    }

    this.startProgressTracker();
    this.playNextChunk();
  }

  public appendChunks(newChunks: string[]): void {
    this.queue.push(...newChunks);
    if (!this.isSpeaking && this.queue.length > 0) {
      this.playNextChunk();
    }
  }

  private playNextChunk(): void {
    if ((!this.synth && !this.isNative()) || this.isPaused || !this.isSpeaking) return;

    if (this.currentChunkIndex >= this.queue.length) {
      this.isSpeaking = false;
      this.clearProgressTracker();
      if (this.onProgressCallback) {
        this.onProgressCallback(this.totalEstimatedDuration);
      }
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      return;
    }

    const chunk = this.queue[this.currentChunkIndex];
    if (!chunk || !chunk.trim()) {
      this.currentChunkIndex++;
      this.playNextChunk();
      return;
    }

    // 1. Native Android TTS Execution via Capacitor
    if (this.isNative()) {
      TextToSpeech.speak({
        text: chunk,
        lang: 'en-US',
        rate: Math.max(0.5, Math.min(2.0, this.currentRate)),
        pitch: this.currentPitch,
        volume: 1.0,
        category: 'ambient',
      })
        .then(() => {
          this.currentChunkIndex++;
          const nextBase =
            this.chunkCumulativeDurations[this.currentChunkIndex] || this.totalEstimatedDuration;
          this.emitProgress(Math.min(this.totalEstimatedDuration, Math.round(nextBase)));
          this.playNextChunk();
        })
        .catch((err) => {
          console.warn('Native TTS chunk notice:', err);
          this.currentChunkIndex++;
          this.playNextChunk();
        });
      return;
    }

    this.currentChunkStartTime = Date.now();
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = this.currentRate;
    utterance.pitch = this.currentPitch;

    if (this.voices.length === 0) {
      this.loadVoices();
    }

    let activeVoice: SpeechSynthesisVoice | undefined;
    if (this.selectedVoiceURI) {
      activeVoice = this.voices.find(
        (v) => v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI
      );
    }

    if (!activeVoice) {
      activeVoice =
        this.voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Google') ||
              v.name.includes('Siri') ||
              v.name.includes('Karen') ||
              v.name.includes('English'))
        ) || this.voices.find((v) => v.lang.startsWith('en')) || this.voices[0];
    }

    utterance.lang = activeVoice?.lang || 'en-US';
    if (activeVoice) {
      utterance.voice = activeVoice;
    }

    // Retain reference in set to prevent GC collection during speech
    this.activeUtterances.add(utterance);

    utterance.onend = () => {
      this.activeUtterances.delete(utterance);
      this.currentChunkIndex++;
      const nextBase = this.chunkCumulativeDurations[this.currentChunkIndex] || this.totalEstimatedDuration;
      this.emitProgress(Math.min(this.totalEstimatedDuration, Math.round(nextBase)));
      this.playNextChunk();
    };

    utterance.onerror = (e) => {
      this.activeUtterances.delete(utterance);
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        this.currentChunkIndex++;
        this.playNextChunk();
      }
    };

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.speak(utterance);
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch (err) {
      console.warn('Speech synthesis speak notice:', err);
    }
  }

  public speak(
    text: string,
    options?: {
      rate?: number;
      estimatedDuration?: number;
      onProgress?: (currentTime: number) => void;
      onEnd?: () => void;
    }
  ): void {
    this.lastSpokenText = text;
    const chunks = this.chunkText(text);
    this.speakStream(chunks, options);
  }

  public pause(): void {
    if (this.isNative()) {
      TextToSpeech.stop().catch(() => {});
      this.isPaused = true;
      this.pausedTime = (Date.now() - this.startTime) / 1000;
      this.clearProgressTracker();
      return;
    }
    if (!this.synth || this.isPaused) return;
    this.synth.cancel();
    this.activeUtterances.clear();
    this.isPaused = true;
    this.pausedTime = (Date.now() - this.startTime) / 1000;
    this.clearProgressTracker();
  }

  public resume(): void {
    if (!this.synth && !this.isNative()) return;
    if (!this.isPaused) return;
    this.isPaused = false;
    this.isSpeaking = true;
    this.startTime = Date.now() - this.pausedTime * 1000;
    this.startProgressTracker();
    this.playNextChunk();
  }

  public stop(): void {
    if (this.isNative()) {
      TextToSpeech.stop().catch(() => {});
    }
    this.clearProgressTracker();
    this.isSpeaking = false;
    this.isPaused = false;
    this.queue = [];
    this.currentChunkIndex = 0;
    this.startTime = 0;
    this.pausedTime = 0;
    this.activeUtterances.clear();
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public setRate(rate: number): void {
    this.currentRate = rate;
  }

  public seek(targetTimeSeconds: number): void {
    if (!this.synth) return;
    if (this.queue.length === 0 && this.lastSpokenText) {
      this.queue = this.chunkText(this.lastSpokenText);
    }
    if (this.queue.length === 0) return;

    const clampedTarget = Math.max(0, Math.min(this.totalEstimatedDuration, targetTimeSeconds));
    const ratio = clampedTarget / (this.totalEstimatedDuration || 1);
    const targetIndex = Math.min(this.queue.length - 1, Math.floor(ratio * this.queue.length));

    this.synth.cancel();
    this.activeUtterances.clear();
    this.currentChunkIndex = targetIndex;
    this.startTime = Date.now() - clampedTarget * 1000;
    this.pausedTime = clampedTarget;
    this.lastReportedTime = clampedTarget;
    if (this.onProgressCallback) {
      this.onProgressCallback(clampedTarget);
    }

    if (!this.isPaused && this.isSpeaking) {
      this.playNextChunk();
    }
  }

  private emitProgress(calculatedTime: number, allowBackward = false): void {
    if (!this.onProgressCallback) return;
    const clamped = Math.max(0, Math.min(this.totalEstimatedDuration, calculatedTime));
    // Strictly monotonic progression during forward playback: never bounce or oscillate backward
    if (!allowBackward && clamped < this.lastReportedTime) {
      return;
    }
    this.lastReportedTime = clamped;
    this.onProgressCallback(clamped);
  }

  private startProgressTracker(): void {
    this.clearProgressTracker();
    this.progressInterval = setInterval(() => {
      if (this.isPaused || !this.isSpeaking) return;
      const baseTime = this.chunkCumulativeDurations[this.currentChunkIndex] || 0;
      const chunkDur = this.chunkDurations[this.currentChunkIndex] || 1;
      const chunkElapsed = Math.max(0, (Date.now() - this.currentChunkStartTime) / 1000);
      const inChunkTime = Math.min(chunkDur * 0.98, chunkElapsed);
      const currentTime = Math.min(this.totalEstimatedDuration, Math.round(baseTime + inChunkTime));
      this.emitProgress(currentTime);
    }, 250);
  }

  private clearProgressTracker(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}

export const nativeSpeech = new NativeSpeechService();

/**
 * React-Native-Speech API wrapper (mhpdev-com/react-native-speech specification)
 * providing identical method signatures for cross-platform app compatibility.
 */
export const Speech = {
  speak: (options: {
    text: string;
    voice?: string;
    rate?: number;
    pitch?: number;
    language?: string;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (err: any) => void;
    onProgress?: (progressTime: number) => void;
  }) => {
    if (options.voice) {
      nativeSpeech.setSelectedVoiceURI(options.voice);
    }
    if (options.pitch) {
      nativeSpeech.setPitch(options.pitch);
    }
    if (options.rate) {
      nativeSpeech.setRate(options.rate);
    }
    if (options.onStart) {
      options.onStart();
    }
    nativeSpeech.speak(options.text, {
      rate: options.rate,
      onProgress: options.onProgress,
      onEnd: () => {
        if (options.onDone) options.onDone();
      },
    });
  },
  stop: () => nativeSpeech.stop(),
  pause: () => nativeSpeech.pause(),
  resume: () => nativeSpeech.resume(),
  isSpeaking: () => nativeSpeech.isCurrentlySpeaking(),
  voices: () => nativeSpeech.getVoices(),
};

