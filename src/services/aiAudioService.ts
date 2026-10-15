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

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalCapacitor =
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '3000');
    if (isLocalCapacitor) {
      return 'https://ais-dev-noshvwsdf4lvq2c2pvcajb-458537113715.europe-west3.run.app';
    }
  }
  return '';
}

/**
 * Normalizes user-provided audio URLs into direct streamable audio links:
 * - Google Drive share links -> direct streaming proxy URL
 * - Dropbox share links -> direct raw/dl stream
 * - OneDrive links -> direct stream
 * - Cleans whitespace, quotes, and protocol
 */
export function normalizeAudioUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Remove surrounding quotes if pasted with quotes
  url = url.replace(/^["']|["']$/g, '').trim();

  // If starts with //
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (
    !/^https?:\/\//i.test(url) &&
    !url.startsWith('data:') &&
    !url.startsWith('blob:') &&
    !url.startsWith('/api/')
  ) {
    url = 'https://' + url;
  }

  // Google Drive:
  // e.g. drive.google.com/file/d/FILE_ID/view?usp=sharing
  // e.g. drive.google.com/open?id=FILE_ID
  // e.g. drive.google.com/uc?id=FILE_ID
  const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return `${getApiBaseUrl()}/api/proxy-audio?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}`;
  }

  // Dropbox:
  // e.g. www.dropbox.com/s/xyz/audio.mp3?dl=0 -> replace with raw=1
  if (/dropbox\.com\//i.test(url)) {
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'raw=1');
    }
    if (!url.includes('raw=1') && !url.includes('dl=1')) {
      return url.includes('?') ? `${url}&raw=1` : `${url}?raw=1`;
    }
    return url;
  }

  // OneDrive:
  if (/1drv\.ms\/|onedrive\.live\.com\//i.test(url)) {
    if (!url.includes('download=1')) {
      return url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
    }
  }

  return url;
}

/**
 * Accurately calculates text-to-speech duration for spoken narration.
 * Uses exact spoken word count, punctuation pause pacing, chunk overhead, and playback rate.
 */
export function calculateTextToSpeechDuration(
  scriptOrDevotional: string | Partial<Devotional>,
  playbackRate: number = 1.0
): number {
  let script = '';
  if (typeof scriptOrDevotional === 'string') {
    script = scriptOrDevotional;
  } else {
    script = buildDevotionalScript(scriptOrDevotional);
  }

  const clean = script.replace(/[#*_`]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;

  // Calibrated pacing for Web Speech Synthesis across modern browser engines:
  // Average speaking pace: ~142 words per minute (~2.37 words per second)
  // Commas / colons / semicolons: ~0.15s pause
  // Sentence endings (. ! ?): ~0.35s pause
  // Paragraph breaks: ~0.50s contemplation pause
  // Approximate chunk boundary latency: ~0.12s per chunk
  const commas = (clean.match(/[,;:]/g) || []).length;
  const sentenceEnds = (clean.match(/[.!?]/g) || []).length;
  const paragraphs = Math.max(0, clean.split(/\n\n+/).length - 1);
  const approxChunks = Math.max(1, Math.ceil(clean.length / 120));

  const baseSeconds =
    words / 2.37 +
    commas * 0.15 +
    sentenceEnds * 0.35 +
    paragraphs * 0.50 +
    approxChunks * 0.12;

  const safeRate = Math.max(0.5, Math.min(2.5, playbackRate || 1.0));
  return Math.max(5, Math.round(baseSeconds / safeRate));
}

/**
 * Calculates audio duration for a devotional based on:
 * 1. Probed metadata cache from audioUrl if a real audio file exists
 * 2. Stored audio file duration if explicit audio link is provided
 * 3. Exact word count, punctuation pacing, and playback rate of the spoken script
 */
export function calculateAudioDuration(
  devotional: Partial<Devotional>,
  playbackRate: number = 1.0
): number {
  const normUrl = devotional.audioUrl ? normalizeAudioUrl(devotional.audioUrl) : null;
  if (normUrl && probedAudioDurationCache.has(normUrl)) {
    const probed = probedAudioDurationCache.get(normUrl)!;
    if (probed > 0) return probed;
  }

  // If this devotional has an explicit audio file and stored duration, use it
  if (normUrl && devotional.audioDurationSeconds && devotional.audioDurationSeconds > 0) {
    return devotional.audioDurationSeconds;
  }

  // Otherwise calculate exact text-to-speech narration duration
  return calculateTextToSpeechDuration(devotional, playbackRate);
}

/**
 * Probes the actual audio file metadata from an audioUrl to extract true duration in seconds.
 */
export async function probeAudioFileDuration(audioUrl: string): Promise<number> {
  const normUrl = normalizeAudioUrl(audioUrl);
  if (!normUrl || typeof window === 'undefined') return 0;
  if (probedAudioDurationCache.has(normUrl)) {
    return probedAudioDurationCache.get(normUrl)!;
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
          probedAudioDurationCache.set(normUrl, dur);
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

      const onError = () => {
        // If probing direct URL failed and it wasn't already through proxy, try via proxy
        if (!normUrl.startsWith('/api/proxy-audio')) {
          const proxyAudio = new Audio(`/api/proxy-audio?url=${encodeURIComponent(normUrl)}`);
          proxyAudio.preload = 'metadata';
          proxyAudio.onloadedmetadata = () => {
            if (proxyAudio.duration && isFinite(proxyAudio.duration) && proxyAudio.duration > 0) {
              finish(Math.round(proxyAudio.duration));
            } else {
              finish(0);
            }
          };
          proxyAudio.onerror = () => finish(0);
          setTimeout(() => finish(0), 3000);
        } else {
          finish(0);
        }
      };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);

      // Timeout fallback after 4 seconds
      setTimeout(() => finish(0), 4000);

      audio.src = normUrl;
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
      const res = await fetch(`${getApiBaseUrl()}/api/tts`, {
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
