/**
 * Native Speech Synthesis Service with chunked stream-first queueing
 * and resilient Chrome/Safari audio keep-alive.
 * Starts playing the initial chunk immediately (< 20ms) for high speed,
 * while subsequent devotional text chunks queue seamlessly in the background.
 */

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
  private keepAliveTimer: any = null;
  private onProgressCallback: ((currentTime: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private currentRate = 1.0;
  private currentPitch = 1.0;
  private selectedVoiceURI: string | null = null;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private audioCtx: AudioContext | null = null;
  private voiceListeners: Array<(voices: SpeechSynthesisVoice[]) => void> = [];

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

  public isAvailable(): boolean {
    return this.synth !== null;
  }

  public estimateDuration(text: string, rate: number = 1.0): number {
    const clean = text.replace(/[#*_`]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean).length;
    const commas = (clean.match(/,/g) || []).length;
    const sentenceEnds = (clean.match(/[.!?]/g) || []).length;
    const paragraphs = Math.max(0, clean.split(/\n\n+/).length - 1);

    const baseSecs = (words / 2.45) + (commas * 0.12) + (sentenceEnds * 0.28) + (paragraphs * 0.45);
    const effectiveRate = Math.max(0.5, Math.min(2.5, rate || this.currentRate));
    return Math.max(5, Math.round(baseSecs / effectiveRate));
  }

  /**
   * Plays a subtle, gentle spiritual chime (440Hz -> 554Hz) using Web Audio API
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
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio context notice
    }
  }

  /**
   * Split a long devotional text into clean, spoken chunks (sentences or paragraph blocks)
   */
  public chunkText(fullText: string): string[] {
    const clean = fullText.replace(/[#*_`]/g, '').trim();
    if (!clean) return [];

    // Split by paragraph or sentence boundaries
    const rawBlocks = clean.split(/(?:\r?\n)+/);
    const chunks: string[] = [];

    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 160) {
        chunks.push(trimmed);
      } else {
        // Split sentence by sentence
        const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmed];
        let currentChunk = '';

        for (const s of sentences) {
          if ((currentChunk + ' ' + s).trim().length > 180) {
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
    if (!this.synth) return;

    this.stop();
    this.playOpeningChime();

    this.queue = [...initialChunks];
    this.currentChunkIndex = 0;
    this.currentRate = options?.rate || 1.0;
    this.totalEstimatedDuration =
      options?.estimatedDuration ||
      this.estimateDuration(initialChunks.join(' '), this.currentRate);
    this.onProgressCallback = options?.onProgress || null;
    this.onEndCallback = options?.onEnd || null;

    this.startTime = Date.now();
    this.pausedTime = 0;
    this.isPaused = false;
    this.isSpeaking = true;

    // Reset synthesis engine if stuck
    if (this.synth.paused) {
      this.synth.resume();
    }

    this.startProgressTracker();
    this.startKeepAlive();
    this.playNextChunk();
  }

  /**
   * Dynamically append chunks to the active playback stream
   */
  public appendChunks(newChunks: string[]): void {
    this.queue.push(...newChunks);
    if (!this.isSpeaking && this.queue.length > 0) {
      this.playNextChunk();
    }
  }

  private playNextChunk(): void {
    if (!this.synth || this.isPaused || !this.isSpeaking) return;

    if (this.currentChunkIndex >= this.queue.length) {
      this.isSpeaking = false;
      this.clearProgressTracker();
      this.clearKeepAlive();
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

    if (activeVoice) {
      utterance.voice = activeVoice;
      utterance.lang = activeVoice.lang;
    }

    // Retain reference in set to prevent GC collection during speech
    this.activeUtterances.add(utterance);

    utterance.onend = () => {
      this.activeUtterances.delete(utterance);
      this.currentChunkIndex++;
      this.playNextChunk();
    };

    utterance.onerror = (e) => {
      this.activeUtterances.delete(utterance);
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech chunk notice:', e.error);
        this.currentChunkIndex++;
        this.playNextChunk();
      }
    };

    try {
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
      onProgress?: (currentTime: number) => void;
      onEnd?: () => void;
    }
  ): void {
    const chunks = this.chunkText(text);
    this.speakStream(chunks, options);
  }

  public pause(): void {
    if (!this.synth || this.isPaused) return;
    this.synth.pause();
    this.isPaused = true;
    this.pausedTime = (Date.now() - this.startTime) / 1000;
    this.clearProgressTracker();
    this.clearKeepAlive();
  }

  public resume(): void {
    if (!this.synth || !this.isPaused) return;
    this.synth.resume();
    this.isPaused = false;
    this.startTime = Date.now() - this.pausedTime * 1000;
    this.startProgressTracker();
    this.startKeepAlive();
  }

  public stop(): void {
    this.clearProgressTracker();
    this.clearKeepAlive();
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
    if (!this.synth || this.queue.length === 0) return;
    const clampedTarget = Math.max(0, Math.min(this.totalEstimatedDuration, targetTimeSeconds));
    const ratio = clampedTarget / (this.totalEstimatedDuration || 1);
    const targetIndex = Math.min(this.queue.length - 1, Math.floor(ratio * this.queue.length));

    this.synth.cancel();
    this.activeUtterances.clear();
    this.currentChunkIndex = targetIndex;
    this.startTime = Date.now() - clampedTarget * 1000;
    this.pausedTime = clampedTarget;

    if (!this.isPaused && this.isSpeaking) {
      this.playNextChunk();
    }
  }

  private startProgressTracker(): void {
    this.clearProgressTracker();
    this.progressInterval = setInterval(() => {
      if (this.isPaused || !this.isSpeaking) return;
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (this.onProgressCallback) {
        this.onProgressCallback(Math.min(this.totalEstimatedDuration, elapsed));
      }
    }, 250);
  }

  private clearProgressTracker(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Chrome 15-second speech keepalive
   */
  private startKeepAlive(): void {
    this.clearKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.synth && this.isSpeaking && !this.isPaused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}

export const nativeSpeech = new NativeSpeechService();
