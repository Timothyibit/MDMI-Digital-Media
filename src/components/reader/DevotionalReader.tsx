import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  MessageSquare,
  Share2,
  Volume2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Mic,
  Camera,
  Edit3,
  BookHeart,
  ShieldCheck,
  Eye,
  EyeOff,
  Video,
} from 'lucide-react';
import { VideoPlayer } from '@/components/ui/video-thumbnail-player';
import { Devotional, JournalEntry } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useJournalStore } from '../../store/useJournalStore';
import {
  calculateAudioDuration,
  formatAudioDuration,
  probeAudioFileDuration,
} from '../../services/aiAudioService';
import { LikeButton } from '../ui/LikeButton';
import MotionButton from '@/components/ui/motion-button';
import { DevotionalReflectionsSection } from '../comments/DevotionalReflectionsSection';
import { RichTextRenderer } from '../ui/RichTextRenderer';
import { AudioErrorBoundary } from '../common/AudioErrorBoundary';
import { EditDevotionalModal } from '../admin/EditDevotionalModal';
import { EditJournalModal } from '../journal/EditJournalModal';
import { FancyMobileAudioCard } from '../ui/FancyMobileAudioCard';
import { SuccessIcon, MenuCloseIcon } from '@/components/ui/animated-state-icons';

interface DevotionalReaderProps {
  devotional: Devotional;
  onBack: () => void;
}

export const DevotionalReader: React.FC<DevotionalReaderProps> = ({ devotional, onBack }) => {
  const {
    theme,
    audioState,
    openCommentsSheet,
    openVerseShare,
    openVoiceSelector,
    playDevotionalAudio,
    toggleAudioPlayback,
    seekAudioTime,
    setAudioPlaybackRate,
    triggerConfetti,
  } = useUIStore();

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { recordReadingSession, user, isAdmin } = useAuthStore();
  const {
    devotionals,
    incrementViewCount,
    fetchCommentsForDevotional,
    comments,
    updateDevotional,
  } = useDevotionalStore();
  const { entries, addEntry } = useJournalStore();

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isEditingDevotional, setIsEditingDevotional] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [journalModalEntry, setJournalModalEntry] = useState<JournalEntry | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  const existingJournal = entries.find((e) => e.devotionalId === devotional.id);
  const currentDevotional = devotionals.find((d) => d.id === devotional.id) || devotional;

  const commentsCount = useMemo(() => {
    return comments.filter((c) => c.devotionalId === devotional.id).length;
  }, [comments, devotional.id]);

  const handleTogglePublish = async () => {
    setIsUpdatingStatus(true);
    try {
      const isCurrentlyPublished = !!currentDevotional.publishedAt;
      await updateDevotional(currentDevotional.id, {
        publishedAt: isCurrentlyPublished ? null : new Date().toISOString(),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenJournal = async () => {
    if (user?.isAnonymous) {
      useUIStore.getState().openAuthGate('Link your account to write and edit your private devotional prayer journal.');
      return;
    }
    if (existingJournal) {
      setJournalModalEntry(existingJournal);
      setIsJournalModalOpen(true);
    } else {
      const id = 'jrnl_' + Date.now().toString(36);
      const newEntry: JournalEntry = {
        id,
        uid: user?.uid || 'user',
        devotionalId: devotional.id,
        devotionalTitle: devotional.title,
        title: `${devotional.title} - Reflection`,
        scriptureRef: devotional.scripture,
        content: `Reflecting on ${devotional.scripture}:\n\nKey Thought: "${devotional.keyThought}"\n\n`,
        prayerPoint: devotional.prayerPrompt,
        imageUrl: devotional.imageUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addEntry({
        uid: newEntry.uid,
        devotionalId: newEntry.devotionalId,
        devotionalTitle: newEntry.devotionalTitle,
        title: newEntry.title,
        scriptureRef: newEntry.scriptureRef,
        content: newEntry.content,
        prayerPoint: newEntry.prayerPoint,
        imageUrl: newEntry.imageUrl,
      });
      setJournalModalEntry(newEntry);
      setIsJournalModalOpen(true);
    }
  };

  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);
  const [readingCompletedStats, setReadingCompletedStats] = useState<{
    streak: number;
    totalMinutes: number;
  } | null>(null);
  const [probedAudioDuration, setProbedAudioDuration] = useState<number | null>(null);

  const bookmarked = isBookmarked(devotional.id);

  // Dynamic estimated read time based on actual content word count
  const estimatedMinutes = Math.max(
    2,
    Math.ceil((devotional.body.split(/\s+/).length + devotional.scriptureText.split(/\s+/).length) / 160)
  );

  // Probe audio file duration dynamically when audioUrl is present
  useEffect(() => {
    if (!devotional.audioUrl) {
      setProbedAudioDuration(null);
      return;
    }
    let isMounted = true;
    probeAudioFileDuration(devotional.audioUrl).then((dur) => {
      if (isMounted && dur > 0) {
        setProbedAudioDuration(dur);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [devotional.audioUrl]);

  // Actual calculated audio duration (probed file duration, active audio player duration, stored duration, or script word count)
  const activeAudioDuration =
    audioState.devotionalId === devotional.id && audioState.duration > 0
      ? audioState.duration
      : probedAudioDuration ||
        (devotional.audioDurationSeconds && devotional.audioDurationSeconds > 0
          ? devotional.audioDurationSeconds
          : calculateAudioDuration(devotional));

  const audioDurationLabel = formatAudioDuration(activeAudioDuration);
  const isThisAudioPlaying = audioState.devotionalId === devotional.id && audioState.isPlaying;

  useEffect(() => {
    incrementViewCount(devotional.id);
    fetchCommentsForDevotional(devotional.id);
  }, [devotional.id, incrementViewCount, fetchCommentsForDevotional]);

  const handleCompleteReading = async () => {
    if (hasFinishedReading) return;
    setHasFinishedReading(true);
    const res = await recordReadingSession(devotional.id, devotional.title, estimatedMinutes);
    setReadingCompletedStats({
      streak: res.currentStreak,
      totalMinutes: res.totalMinutes,
    });
    if (res?.milestone) {
      triggerConfetti(res.milestone);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nativeEvent = event?.nativeEvent;
    if (!nativeEvent) return;
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (!contentOffset || !contentSize || !layoutMeasurement) return;
    const totalScroll = contentSize.height - layoutMeasurement.height;
    if (totalScroll <= 0) return;
    const progress = Math.min(100, Math.max(0, (contentOffset.y / totalScroll) * 100));
    setScrollProgress(progress);

    if (progress > 85 && !hasFinishedReading) {
      handleCompleteReading();
    }
  };

  const isDark = theme === 'dark';

  const themeClasses = isDark
    ? 'bg-neutral-950 text-[#EDEDED]'
    : 'bg-[#FAF9F6] text-neutral-900';

  const scriptureCardClasses = isDark
    ? 'bg-[#111111] border-neutral-800'
    : 'bg-white border-[#E9ECEF] shadow-[0_2px_12px_rgba(0,0,0,0.04)]';

  const accentColor = '#65A30D';

  return (
    <View className={`flex-1 ${themeClasses}`}>
      {/* Top Reading Progress Bar */}
      <View className="h-1 bg-black/10 dark:bg-white/10 w-full">
        <View
          id="reading-progress-bar"
          style={{
            backgroundColor: accentColor,
            width: `${scrollProgress}%`,
            height: '100%',
          }}
        />
      </View>

      {/* Reader Navigation Header */}
      <View
        id="reader-header"
        className={`px-4 py-2.5 flex-row items-center justify-between border-b ${
          isDark
            ? 'bg-neutral-950 border-neutral-900'
            : 'bg-[#FAF9F6] border-neutral-200/80'
        }`}
      >
        <TouchableOpacity
          id="back-to-feed-btn"
          onPress={onBack}
          className="flex-row items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-[#CAD1D7]/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
          <Text className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Feed
          </Text>
        </TouchableOpacity>

        {/* Scripture Context Pill */}
        <View className="hidden sm:flex flex-row items-center px-2.5 py-1 rounded-full bg-neutral-200/50 dark:bg-neutral-800/80">
          <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 truncate max-w-[200px]">
            {devotional.scripture}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          {isAdmin && (
            <button
              id="reader-admin-btn"
              type="button"
              onClick={() => setIsAdminPanelOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border transition-all shadow-sm cursor-pointer active:scale-95 ${
                isAdminPanelOpen
                  ? 'bg-[#5E72E4] text-white border-[#5E72E4] ring-2 ring-[#5E72E4]/30'
                  : 'border-[#5E72E4]/40 bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20 text-[#5E72E4] dark:text-[#889af7]'
              }`}
              title="Toggle Devotional Admin Controls"
              aria-label="Admin Controls"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold hidden xs:inline">Admin</span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentDevotional.publishedAt ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>
          )}

          <TouchableOpacity
            id="reader-share-btn"
            onPress={() =>
              openVerseShare({
                scripture: devotional.scripture,
                scriptureText: devotional.scriptureText,
                title: devotional.title,
                author: devotional.authorName,
              })
            }
            accessibilityLabel="Share verse card"
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#CAD1D7]/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </TouchableOpacity>

          <TouchableOpacity
            id="reader-bookmark-btn"
            onPress={() => toggleBookmark(devotional.id)}
            accessibilityLabel={bookmarked ? 'Bookmarked' : 'Bookmark'}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#CAD1D7]/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
          >
            <Bookmark
              className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : 'text-neutral-700 dark:text-neutral-300'}`}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content View */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 90 }}
        className="flex-1 max-w-2xl mx-auto w-full"
      >
        {/* Admin Devotional Management Bar (Hidden in Admin Button, expands on click) */}
        {isAdmin && isAdminPanelOpen && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-[#080E1B] via-[#101D38] to-[#04070D] border border-[#5E72E4]/40 text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5E72E4] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Teaching Administration
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentDevotional.publishedAt
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {currentDevotional.publishedAt ? '● Live Published' : '○ Draft Only'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Teaching ID: <code className="font-mono text-[10px] text-slate-200">{currentDevotional.id}</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAdminPanelOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close admin controls"
                title="Hide Admin Controls"
              >
                <MenuCloseIcon size={20} color="#FFFFFF" active={true} />
              </button>
            </div>

            {/* Admin Action Buttons (Responsive & Natural Width) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <MotionButton
                size="sm"
                variant="primary"
                id="admin-bar-edit-btn"
                icon={<Edit3 className="w-3.5 h-3.5 text-white" />}
                label="Edit Teaching"
                onClick={() => setIsEditingDevotional(true)}
              />

              <MotionButton
                size="sm"
                variant={currentDevotional.publishedAt ? 'warning' : 'ministry-green'}
                id="admin-bar-publish-btn"
                disabled={isUpdatingStatus}
                icon={
                  currentDevotional.publishedAt ? (
                    <EyeOff className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-white" />
                  )
                }
                label={
                  isUpdatingStatus
                    ? 'Updating...'
                    : currentDevotional.publishedAt
                    ? 'Set to Draft'
                    : 'Publish Now'
                }
                onClick={handleTogglePublish}
              />

              <MotionButton
                size="sm"
                variant="secondary"
                id="admin-bar-reflections-btn"
                icon={<MessageSquare className="w-3.5 h-3.5 text-[#84CC16]" />}
                label={`Reflections (${commentsCount})`}
                onClick={() => openCommentsSheet(devotional.id)}
              />
            </div>

            {/* Quick Photo Change for Admin */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Devotional Cover Media:</span>
              <button
                type="button"
                onClick={() => setIsEditingDevotional(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3 text-white" />
                <span>{currentDevotional.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Category Tags & Meta */}
        <View className="flex-row flex-wrap items-center gap-2 mb-3">
          {devotional.tags.map((tag) => (
            <View
              key={tag}
              className={`px-2.5 py-0.5 rounded-full ${
                isDark ? 'bg-neutral-800' : 'bg-neutral-200/70'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                {tag}
              </Text>
            </View>
          ))}
          <View className="flex-row items-center gap-3 ml-auto opacity-70">
            <View className="flex-row items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-500" />
              <Text className="text-[11px] text-neutral-500">{estimatedMinutes} min read</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <Text className="text-[11px] text-neutral-500">{devotional.viewCount || 1} views</Text>
            </View>
          </View>
        </View>

        {/* Devotional Header Photo */}
        {currentDevotional.imageUrl ? (
          <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-4 shadow-sm border border-neutral-200/60 dark:border-neutral-800 relative group">
            <img
              src={currentDevotional.imageUrl}
              alt={currentDevotional.title}
              className="w-full h-full object-cover"
            />
            {isAdmin && (
              <div className="absolute bottom-3 right-3 z-10">
                <MotionButton
                  size="sm"
                  variant="dark"
                  icon={<Camera className="w-3.5 h-3.5 text-white" />}
                  label="Change Photo"
                  onClick={() => setIsEditingDevotional(true)}
                />
              </div>
            )}
          </div>
        ) : (
          isAdmin && (
            <div className="mb-4">
              <MotionButton
                size="md"
                variant="primary"
                icon={<Camera className="w-4 h-4 text-white" />}
                label="Upload Devotional Cover Photo"
                onClick={() => setIsEditingDevotional(true)}
                className="w-full justify-center py-3"
              />
            </div>
          )
        )}

        {/* Devotional Title */}
        <Text className="font-display-scripture text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-neutral-900 dark:text-white">
          {currentDevotional.title}
        </Text>

        {/* Author Bylines */}
        <View className="flex-row items-center gap-3 my-4 pb-4 border-b border-black/10 dark:border-white/10">
          {user?.uid === currentDevotional.authorId && user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={currentDevotional.authorName}
              className="w-9 h-9 rounded-full object-cover shadow-sm ring-1 ring-neutral-300 dark:ring-neutral-700"
            />
          ) : (
            <View className="w-9 h-9 rounded-full items-center justify-center bg-[#5E72E4] shadow-sm">
              <Text className="font-bold text-xs text-white">
                {currentDevotional.authorName.charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text className="font-bold text-xs text-neutral-900 dark:text-white">
              {currentDevotional.authorName}
            </Text>
            <Text className="opacity-70 text-[11px] text-neutral-600 dark:text-neutral-400">
              {currentDevotional.authorRole}
            </Text>
          </View>
          <View className="ml-auto text-right opacity-60 flex-row items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-500" />
            <Text className="text-[11px] text-neutral-500">
              {currentDevotional.publishedAt
                ? new Date(currentDevotional.publishedAt).toLocaleDateString()
                : 'Draft'}
            </Text>
          </View>
        </View>

        {/* Fancy Mobile-First Audio Narration Card */}
        {(devotional.audioUrl || devotional.body) && (
          <div className="my-5 w-full">
            <AudioErrorBoundary>
              <FancyMobileAudioCard
                devotional={devotional}
                isPlaying={isThisAudioPlaying}
                currentTime={audioState.currentTime}
                duration={activeAudioDuration}
                playbackRate={audioState.playbackRate}
                onPlayPause={() => {
                  if (audioState.devotionalId === devotional.id) {
                    toggleAudioPlayback();
                  } else {
                    playDevotionalAudio(devotional);
                  }
                }}
                onSeek={seekAudioTime}
                onSpeedChange={setAudioPlaybackRate}
                onOpenVoiceSelector={openVoiceSelector}
              />
            </AudioErrorBoundary>
          </div>
        )}

        {/* Video Exhortation / Sermon Player Card - Shown ONLY if a video link is added */}
        {currentDevotional.videoUrl && currentDevotional.videoUrl.trim() ? (
          <div className="my-5 w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <Video className="w-4 h-4 text-red-500" />
                <span>Video Exhortation & Sermon</span>
              </div>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                Click to Watch Video
              </span>
            </div>
            <VideoPlayer
              videoUrl={currentDevotional.videoUrl}
              thumbnailUrl={currentDevotional.imageUrl || undefined}
              title={currentDevotional.title}
              description={`Discipleship message on ${currentDevotional.scripture}`}
              className="rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800"
            />
          </div>
        ) : null}

        {/* Holy Scripture Card (Mobile Look with High-Contrast Gradient) */}
        <div
          className={`my-5 p-4 sm:p-5 rounded-2xl border shadow-sm transition-all bg-gradient-to-br ${
            isDark
              ? 'from-[#080E1B] via-[#0F1E38] to-[#04070D] border-slate-700/60 text-white'
              : 'from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] border-slate-200/90 text-neutral-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 dark:bg-blue-500/25 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Holy Scripture
                </span>
                <h4 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-none text-neutral-900 dark:text-white">
                  {devotional.scripture}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                openVerseShare({
                  scripture: devotional.scripture,
                  scriptureText: devotional.scriptureText,
                  title: devotional.title,
                  author: devotional.authorName,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Share Verse</span>
            </button>
          </div>
          <p className="font-serif-reading italic text-base sm:text-lg leading-relaxed text-neutral-800 dark:text-neutral-100 pl-2 border-l-2 border-blue-500/40">
            “{devotional.scriptureText}”
          </p>
        </div>

        {/* Devotional Body (Rich Text Formatting) */}
        <div className="my-5 leading-relaxed text-neutral-800 dark:text-neutral-200">
          <RichTextRenderer content={devotional.body} />
        </div>

        {/* Key Thought Callout (Mobile Look with High Contrast Gradient) */}
        <div
          className={`my-6 p-4 sm:p-5 rounded-2xl border shadow-sm transition-all bg-gradient-to-br ${
            isDark
              ? 'from-[#1A1203] via-[#241705] to-[#0A0701] border-amber-600/30 text-white'
              : 'from-[#FFFDF5] via-[#FFFBEB] to-[#FEF3C7] border-amber-300/70 text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Key Meditation For Today
            </span>
          </div>
          <p className="text-sm sm:text-base font-semibold italic pl-10 leading-relaxed text-neutral-800 dark:text-neutral-100">
            “{devotional.keyThought}”
          </p>
        </div>

        {/* Prayer of the Day (Mobile Look with High Contrast Gradient) */}
        <div
          className={`my-6 p-4 sm:p-5 rounded-2xl border shadow-sm transition-all bg-gradient-to-br ${
            isDark
              ? 'from-[#080E1B] via-[#0E1A33] to-[#04070D] border-blue-600/30 text-white'
              : 'from-[#F5F8FF] via-[#EFF6FF] to-[#DBEAFE] border-blue-300/70 text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Prayer of Consecration
            </span>
          </div>
          <p className="text-sm sm:text-base italic leading-relaxed pl-10 text-neutral-800 dark:text-neutral-100">
            {devotional.prayerPrompt}
          </p>
        </div>

        {/* Reading Completion and Consecration Action (Uses animated SuccessIcon) */}
        <div className="my-6">
          {hasFinishedReading ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-3.5 shadow-md bg-gradient-to-br ${
                isDark
                  ? 'from-[#041F10] via-[#072C17] to-[#021208] border-emerald-600/40 text-white'
                  : 'from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0] border-emerald-400/80 text-emerald-950'
              }`}
            >
              <div className="shrink-0 flex items-center justify-center">
                <SuccessIcon size={40} color="#10B981" active={true} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Devotional Reading Completed & Consecrated!
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                  {readingCompletedStats
                    ? `Reading streak: ${readingCompletedStats.streak} ${readingCompletedStats.streak === 1 ? 'day' : 'days'} • Time in Word: ${readingCompletedStats.totalMinutes} mins`
                    : `Reading streak: ${user?.streakCount ?? 0} ${(user?.streakCount ?? 0) === 1 ? 'day' : 'days'} • Saved to your profile`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <button
                id="mark-read-consecrated-btn"
                type="button"
                onClick={handleCompleteReading}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#84CC16] via-[#65A30D] to-[#4D7C0F] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-md text-white cursor-pointer"
              >
                <SuccessIcon size={24} color="#FFFFFF" active={false} />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  Mark Devotional Read & Consecrated
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Interaction Action Bar (Clean touch-friendly row) */}
        <div className="my-6 pt-5 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <LikeButton devotionalId={devotional.id} count={devotional.likeCount} variant="pill" />

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="reader-journal-action-btn"
              type="button"
              onClick={handleOpenJournal}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border shadow-xs transition-all active:scale-95 cursor-pointer ${
                existingJournal
                  ? isDark
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-white border-[#CAD1D7] text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <BookHeart className={`w-3.5 h-3.5 ${existingJournal ? 'text-amber-500' : 'text-neutral-500 dark:text-neutral-400'}`} />
              <span className="text-xs font-bold">
                {existingJournal ? 'Edit Journal' : 'Journal'}
              </span>
            </button>

            <button
              id="open-comments-action-btn"
              type="button"
              onClick={() => openCommentsSheet(devotional.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#5E72E4]" />
              <span className="text-xs font-bold">Reflections {commentsCount > 0 ? `(${commentsCount})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openVerseShare({
                  scripture: devotional.scripture,
                  scriptureText: devotional.scriptureText,
                  title: devotional.title,
                  author: devotional.authorName,
                })
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border shadow-xs transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-white border-[#CAD1D7] text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              <span className="text-xs font-bold">Share</span>
            </button>
          </div>
        </div>

        {/* Reflections & Community Activity Thread - Exact same UI as popup */}
        <View className="mb-14">
          <DevotionalReflectionsSection
            devotionalId={devotional.id}
            maxInitial={3}
            onOpenPopup={() => openCommentsSheet(devotional.id)}
          />
        </View>
      </ScrollView>

      {/* Admin Quick Edit Devotional & Photo Modal */}
      {isAdmin && (
        <EditDevotionalModal
          devotional={currentDevotional}
          isOpen={isEditingDevotional}
          onClose={() => setIsEditingDevotional(false)}
        />
      )}

      {/* Complete Journal Reflection Editor Modal */}
      <EditJournalModal
        entry={journalModalEntry}
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
      />
    </View>
  );
};
