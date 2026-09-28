import { Devotional } from '../types';
import { nativeSpeech } from './nativeSpeechService';

export interface SpeechGenerationResult {
  audioUrl: string | null;
  duration: number;
  useNativeSpeech: boolean;
  script: string;
}

const audioCache = new Map<string, SpeechGenerationResult>();
const inFlightRequests = new Map<string, Promise<SpeechGenerationResult>>();
const probedAudioDurationCache = new Map<string, number>();

/**
 * Formats duration in seconds into human-readable label:
 * 195s -> "3m 15s"
 * 240s -> "4m 00s"
 * 45s  -> "45s"
 */
export function formatAudioDuration(seconds: number): string {
  const safeSecs = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safeSecs / 60);
  const rem = safeSecs % 60;
  if (mins === 0) {
    return `${rem}s`;
  }
  return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`;
}

/**
 * Calculates audio duration for a devotional based on:
 * 1. Probed metadata cache from audioUrl if a real audio file exists
 * 2. Exact word count, punctuation pacing, and playback rate of the spoken script
 */
export function calculateAudioDuration(
  devotional: Partial<Devotional>,
  playbackRate: number = 1.0
): number {
  if (devotional.audioUrl && probedAudioDurationCache.has(devotional.audioUrl)) {
    const probed = probedAudioDurationCache.get(devotional.audioUrl)!;
    if (probed > 0) return probed;
  }

  const script = buildDevotionalScript(devotional);
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;

  // Natural spoken pacing: ~145 words per minute (~2.42 words/second)
  // Commas: ~0.12s; Sentence terminals: ~0.28s; Paragraph pauses: ~0.45s
  const commas = (script.match(/,/g) || []).length;
  const sentenceEnds = (script.match(/[.!?:]/g) || []).length;
  const paragraphs = Math.max(0, script.split(/\n\n+/).length - 1);

  const baseSeconds =
    words / 2.42 + commas * 0.12 + sentenceEnds * 0.28 + paragraphs * 0.45;
  const safeRate = Math.max(0.5, Math.min(2.5, playbackRate || 1.0));
  return Math.max(10, Math.round(baseSeconds / safeRate));
}

/**
 * Probes the actual audio file metadata from an audioUrl to extract true duration in seconds.
 */
export async function probeAudioFileDuration(audioUrl: string): Promise<number> {
  if (!audioUrl || typeof window === 'undefined') return 0;
  if (probedAudioDurationCache.has(audioUrl)) {
    return probedAudioDurationCache.get(audioUrl)!;
  }

  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      audio.preload = 'metadata';
      let resolved = false;

      const finish = (dur: number) => {
        if (resolved) return;
        resolved = true;
        if (dur > 0) {
          probedAudioDurationCache.set(audioUrl, dur);
        }
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
        audio.src = '';
        resolve(dur);
      };

      const onLoaded = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
          finish(Math.round(audio.duration));
        } else {
          finish(0);
        }
      };

      const onError = () => finish(0);

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);

      // Timeout fallback after 3.5 seconds
      setTimeout(() => finish(0), 3500);

      audio.src = audioUrl;
    } catch {
      resolve(0);
    }
  });
}

/**
 * Builds a clean, focused spoken narration script for a devotional
 */
export function buildDevotionalScript(devotional: Partial<Devotional>): string {
  const parts: string[] = [];

  // Title
  if (devotional.title) {
    parts.push(`${devotional.title.trim()}.`);
  }

  // Scripture Reading
  if (devotional.scripture) {
    parts.push(`Scripture Reading: ${devotional.scripture.trim()}.`);
  }
  if (devotional.scriptureText) {
    const cleanScripture = devotional.scriptureText.trim();
    parts.push(`"${cleanScripture}"`);
  }

  // Core spiritual meditation (Full body)
  if (devotional.body) {
    const cleanBody = devotional.body
      .replace(/[#*_`]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (cleanBody) {
      parts.push(cleanBody);
    }
  }

  // Key thought
  if (devotional.keyThought) {
    parts.push(`Key spiritual thought: ${devotional.keyThought.trim()}`);
  }

  // Prayer prompt
  if (devotional.prayerPrompt) {
    parts.push(`Closing Prayer: ${devotional.prayerPrompt.trim()}`);
  }

  return parts.join('\n\n');
}

/**
 * Generates or retrieves devotional audio.
 * Dual-engine architecture:
 * 1. Cloud Gemini Flash TTS (when available and within quota)
 * 2. Seamless local device Web Speech synthesis (when quota is reached or offline)
 */
export async function generateDevotionalSpeech(
  devotional: Devotional
): Promise<SpeechGenerationResult> {
  // Check client-side memory cache first
  if (audioCache.has(devotional.id)) {
    return audioCache.get(devotional.id)!;
  }

  // Deduplicate concurrent requests
  if (inFlightRequests.has(devotional.id)) {
    return inFlightRequests.get(devotional.id)!;
  }

  const promise = (async (): Promise<SpeechGenerationResult> => {
    const script = buildDevotionalScript(devotional);

    // If static audioUrl exists on the devotional, prefer it
    if (devotional.audioUrl) {
      const fallbackResult: SpeechGenerationResult = {
        audioUrl: devotional.audioUrl,
        duration: calculateAudioDuration(devotional),
        useNativeSpeech: false,
        script,
      };
      audioCache.set(devotional.id, fallbackResult);
      return fallbackResult;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: devotional.id,
          text: script,
          voice: 'Kore',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const dataSize = Math.max(0, blob.size - 44);
        const duration = Math.max(15, Math.round(dataSize / 48000));

        const result: SpeechGenerationResult = {
          audioUrl,
          duration,
          useNativeSpeech: false,
          script,
        };
        audioCache.set(devotional.id, result);
        return result;
      }

      // If status is 429 (quota exceeded) or server error, smoothly fall back to native device speech
      console.info(`TTS API status: ${res.status}. Falling back to device speech engine.`);
      const nativeDuration = nativeSpeech.estimateDuration(script);
      const fallbackNative: SpeechGenerationResult = {
        audioUrl: null,
        duration: nativeDuration,
        useNativeSpeech: true,
        script,
      };
      audioCache.set(devotional.id, fallbackNative);
      return fallbackNative;
    } catch (err) {
      console.info('TTS network call failed. Using local device speech engine:', err);
      const nativeDuration = nativeSpeech.estimateDuration(script);
      const fallbackNative: SpeechGenerationResult = {
        audioUrl: null,
        duration: nativeDuration,
        useNativeSpeech: true,
        script,
      };
      audioCache.set(devotional.id, fallbackNative);
      return fallbackNative;
    } finally {
      inFlightRequests.delete(devotional.id);
    }
  })();

  inFlightRequests.set(devotional.id, promise);
  return promise;
}
