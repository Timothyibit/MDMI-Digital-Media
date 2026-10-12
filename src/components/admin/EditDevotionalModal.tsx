import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Check, Calendar, Music, Sparkles, User, Upload, Play, Pause, Video } from 'lucide-react';
import { Devotional } from '../../types';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { ScheduledPublishingConfig } from './ScheduledPublishingConfig';
import { DeviceImageUploader } from '../common/DeviceImageUploader';
import { MotionButton } from '@/components/ui/motion-button';
import { VideoPlayer } from '@/components/ui/video-thumbnail-player';
import {
  calculateAudioDuration,
  formatAudioDuration,
  probeAudioFileDuration,
  normalizeAudioUrl,
} from '../../services/aiAudioService';

interface EditDevotionalModalProps {
  devotional: Devotional | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DEVOTIONAL_PHOTOS = [
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=800&q=80',
];

export const EditDevotionalModal: React.FC<EditDevotionalModalProps> = ({
  devotional,
  isOpen,
  onClose,
}) => {
  const { updateDevotional } = useDevotionalStore();

  const [title, setTitle] = useState(devotional?.title || '');
  const [scripture, setScripture] = useState(devotional?.scripture || '');
  const [scriptureText, setScriptureText] = useState(devotional?.scriptureText || '');
  const [keyThought, setKeyThought] = useState(devotional?.keyThought || '');
  const [body, setBody] = useState(devotional?.body || '');
  const [prayerPrompt, setPrayerPrompt] = useState(devotional?.prayerPrompt || '');
  const [imageUrl, setImageUrl] = useState(devotional?.imageUrl || '');
  const [audioUrl, setAudioUrl] = useState(devotional?.audioUrl || '');
  const [videoUrl, setVideoUrl] = useState(devotional?.videoUrl || '');
  const [authorName, setAuthorName] = useState(devotional?.authorName || '');
  const [authorRole, setAuthorRole] = useState(devotional?.authorRole || '');
  const [scheduledDate, setScheduledDate] = useState(devotional?.scheduledDate || '');
  const [scheduledTime, setScheduledTime] = useState(devotional?.scheduledTime || '06:00');
  const [scheduledTimezone, setScheduledTimezone] = useState(devotional?.scheduledTimezone || 'Africa/Lagos');
  const [tagsInput, setTagsInput] = useState(devotional?.tags?.join(', ') || '');
  const [isPublished, setIsPublished] = useState(devotional?.publishedAt !== null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const { config } = useLayoutStore();
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  const handleToggleTestAudio = () => {
    if (!audioUrl || !audioUrl.trim()) return;
    const streamUrl = normalizeAudioUrl(audioUrl);
    if (!streamUrl) return;

    if (!previewAudioRef.current || previewAudioRef.current.src !== streamUrl) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      previewAudioRef.current = new Audio(streamUrl);
      previewAudioRef.current.onended = () => setIsTestingAudio(false);
      previewAudioRef.current.onerror = () => {
        if (!streamUrl.startsWith('/api/proxy-audio')) {
          const proxied = `/api/proxy-audio?url=${encodeURIComponent(streamUrl)}`;
          if (previewAudioRef.current) {
            previewAudioRef.current.src = proxied;
            previewAudioRef.current
              .play()
              .then(() => setIsTestingAudio(true))
              .catch(() => setIsTestingAudio(false));
            return;
          }
        }
        setIsTestingAudio(false);
      };
    }

    if (isTestingAudio) {
      previewAudioRef.current.pause();
      setIsTestingAudio(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsTestingAudio(true))
        .catch(() => {
          if (!streamUrl.startsWith('/api/proxy-audio') && previewAudioRef.current) {
            previewAudioRef.current.src = `/api/proxy-audio?url=${encodeURIComponent(streamUrl)}`;
            previewAudioRef.current
              .play()
              .then(() => setIsTestingAudio(true))
              .catch(() => setIsTestingAudio(false));
            return;
          }
          setIsTestingAudio(false);
        });
    }
  };

  const handleCloseModal = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsTestingAudio(false);
    }
    onClose();
  };

  useEffect(() => {
    if (devotional) {
      setTitle(devotional.title || '');
      setScripture(devotional.scripture || '');
      setScriptureText(devotional.scriptureText || '');
      setKeyThought(devotional.keyThought || '');
      setBody(devotional.body || '');
      setPrayerPrompt(devotional.prayerPrompt || '');
      setImageUrl(devotional.imageUrl || '');
      setAudioUrl(devotional.audioUrl || '');
      setVideoUrl(devotional.videoUrl || '');
      setAuthorName(devotional.authorName || '');
      setAuthorRole(devotional.authorRole || '');
      setScheduledDate(devotional.scheduledDate || '');
      setScheduledTime(devotional.scheduledTime || '06:00');
      setScheduledTimezone(devotional.scheduledTimezone || 'Africa/Lagos');
      setTagsInput(devotional.tags?.join(', ') || '');
      setIsPublished(devotional.publishedAt !== null);
    }
  }, [devotional, isOpen]);

  if (!isOpen || !devotional) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const normalizedAudio = audioUrl.trim() ? normalizeAudioUrl(audioUrl.trim()) : null;

    const calculatedAudioDuration = calculateAudioDuration({
      title: title.trim(),
      scripture: scripture.trim(),
      scriptureText: scriptureText.trim(),
      keyThought: keyThought.trim(),
      body: body.trim(),
      prayerPrompt: prayerPrompt.trim(),
      audioUrl: normalizedAudio,
      audioDurationSeconds:
        normalizedAudio === (devotional.audioUrl || '')
          ? devotional.audioDurationSeconds
          : 0,
    });

    await updateDevotional(devotional.id, {
      title: title.trim(),
      scripture: scripture.trim(),
      scriptureText: scriptureText.trim(),
      keyThought: keyThought.trim(),
      body: body.trim(),
      prayerPrompt: prayerPrompt.trim(),
      imageUrl: imageUrl.trim() || null,
      audioUrl: normalizedAudio,
      audioDurationSeconds: calculatedAudioDuration,
      videoUrl: videoUrl.trim() || null,
      authorName: authorName.trim(),
      authorRole: authorRole.trim(),
      scheduledDate: scheduledDate.trim() || null,
      scheduledTime: scheduledDate.trim() ? (scheduledTime.trim() || '06:00') : null,
      scheduledTimezone: scheduledDate.trim() ? scheduledTimezone : null,
      tags: tags.length > 0 ? tags : ['Discipleship'],
      publishedAt: isPublished
        ? devotional.publishedAt || new Date().toISOString()
        : null,
    });

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Edit Devotional & Photo
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {devotional.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Device Image Uploader */}
          <DeviceImageUploader
            value={imageUrl}
            onChange={(url) => setImageUrl(url || '')}
            label="Devotional Header Photo"
            helperText="Upload image directly from your phone/computer, choose a spiritual preset, or enter URL"
            presets={PRESET_DEVOTIONAL_PHOTOS}
            aspectRatio="video"
          />

          {/* Title & Scripture Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Scripture Reference *
              </label>
              <input
                type="text"
                required
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Scripture Text */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Scripture Verse Text
            </label>
            <textarea
              rows={2}
              value={scriptureText}
              onChange={(e) => setScriptureText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white italic"
            />
          </div>

          {/* Key Meditation Thought */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Key Meditation Thought (Callout Banner)
            </label>
            <input
              type="text"
              value={keyThought}
              onChange={(e) => setKeyThought(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Body with RichTextEditor */}
          <div>
            <RichTextEditor
              label="Devotional Body (Rich Text & Formatting)"
              value={body}
              onChange={setBody}
              rows={6}
            />
          </div>

          {/* Prayer Prompt */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Daily Prayer of Consecration
            </label>
            <textarea
              rows={2}
              value={prayerPrompt}
              onChange={(e) => setPrayerPrompt(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white italic"
            />
          </div>

          {/* Author Attribution */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Devotional Author Name *</span>
              </label>
              <span className="text-[10px] text-neutral-500">Appears on cards, reader & notifications</span>
            </div>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Dr. Timothy Adeboye"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-neutral-400 font-semibold">Quick Set:</span>
              {user?.displayName && (
                <button
                  type="button"
                  onClick={() => setAuthorName(user.displayName || '')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#5E72E4] transition-colors cursor-pointer"
                >
                  👤 Use My Name ({user.displayName})
                </button>
              )}
              {config.defaultAuthorName && config.defaultAuthorName !== user?.displayName && (
                <button
                  type="button"
                  onClick={() => setAuthorName(config.defaultAuthorName || '')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#5E72E4] transition-colors cursor-pointer"
                >
                  ⭐ Default ({config.defaultAuthorName})
                </button>
              )}
              <button
                type="button"
                onClick={() => setAuthorName("The Master's Discipleship Ministries")}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#5E72E4] transition-colors cursor-pointer"
              >
                ⛪ Ministry Default
              </button>
            </div>
          </div>

          {/* Audio Stream URL or File Upload with Test Playback */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Devotional Audio Narration (Playable URL or Upload)</span>
              </label>
              <span className="text-[10px] text-neutral-500">Supports MP3, WAV, M4A, AAC</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={audioUrl}
                onChange={(e) => {
                  setAudioUrl(e.target.value);
                  if (previewAudioRef.current) {
                    previewAudioRef.current.pause();
                    setIsTestingAudio(false);
                  }
                }}
                placeholder="https://... audio file URL"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />

              <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-bold text-neutral-700 dark:text-neutral-200 cursor-pointer shrink-0 transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-[#5E72E4]" />
                <span>Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setAudioUrl(reader.result);
                          if (previewAudioRef.current) {
                            previewAudioRef.current.pause();
                            setIsTestingAudio(false);
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Audio Test Player & Duration Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/80 dark:border-neutral-750 text-xs">
              <div className="flex items-center gap-2">
                {audioUrl ? (
                  <button
                    type="button"
                    onClick={handleToggleTestAudio}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#5E72E4] text-white hover:bg-[#4b5ec7] font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isTestingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Play & Test Audio</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-neutral-400">
                    ℹ No audio file attached: text-to-speech voice reader will read aloud automatically.
                  </span>
                )}
                {audioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUrl('');
                      if (previewAudioRef.current) {
                        previewAudioRef.current.pause();
                        setIsTestingAudio(false);
                      }
                    }}
                    className="text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    Remove Audio
                  </button>
                )}
              </div>

              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                <span>Calculated Audio Duration: </span>
                <span className="font-bold text-[#5E72E4]">
                  {formatAudioDuration(
                    calculateAudioDuration({
                      title,
                      scripture,
                      scriptureText,
                      keyThought,
                      body,
                      prayerPrompt,
                      audioUrl,
                      audioDurationSeconds:
                        audioUrl === devotional.audioUrl
                          ? devotional.audioDurationSeconds
                          : 0,
                    })
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Video Exhortation / Sermon URL (Optional) with Live Preview */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-red-500" />
                <span>Video Exhortation / Sermon Link (Optional)</span>
              </label>
              <span className="text-[10px] text-neutral-500">Supports YouTube, Vimeo, or MP4</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#CAD1D7] dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-[#172B4D] dark:text-white"
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer shrink-0"
                >
                  Clear Link
                </button>
              )}
            </div>

            {/* Show video card only if a video link is added */}
            {videoUrl && videoUrl.trim() ? (
              <div className="mt-3 pt-3 border-t border-neutral-200/80 dark:border-neutral-750">
                <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Live Video Card Preview (Click to test modal player):</span>
                </div>
                <div className="max-w-md">
                  <VideoPlayer
                    videoUrl={videoUrl}
                    thumbnailUrl={imageUrl || undefined}
                    title={title.trim() || 'Daily Video Exhortation'}
                    description={keyThought.trim() || scripture.trim() || 'Discipleship sermon and scripture video'}
                    className="rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-neutral-400">
                ℹ Video player card will appear on the published devotional page only if a video link is entered here.
              </div>
            )}
          </div>

          {/* Scheduled Publishing & Time Zone Configuration */}
          <ScheduledPublishingConfig
            scheduledDate={scheduledDate}
            setScheduledDate={setScheduledDate}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
            scheduledTimezone={scheduledTimezone}
            setScheduledTimezone={setScheduledTimezone}
          />

          {/* Tags and Published status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="modal-is-published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5E72E4] focus:ring-[#5E72E4]"
                />
                <label htmlFor="modal-is-published" className="text-xs font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer">
                  {isPublished ? 'Live on Public Feed (Published)' : 'Draft / Scheduled Mode'}
                </label>
              </div>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-1 pl-6">
                {scheduledDate
                  ? isPublished
                    ? 'Currently live. Uncheck to revert to scheduled auto-publishing queue.'
                    : 'Devotional will automatically unlock and publish at the scheduled date & time.'
                  : 'Toggle to publish immediately or save as an unpublished draft.'}
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
            <MotionButton
              type="button"
              variant="secondary"
              size="sm"
              label="Cancel"
              onClick={onClose}
            />
            <MotionButton
              type="submit"
              disabled={saving}
              variant="ministry-green"
              size="sm"
              icon={<Check className="w-4 h-4 text-white" />}
              label={saving ? 'Saving...' : 'Save Changes'}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
