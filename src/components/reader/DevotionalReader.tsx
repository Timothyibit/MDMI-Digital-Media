import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Devotional } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  calculateAudioDuration,
  formatAudioDuration,
  probeAudioFileDuration,
} from '../../services/aiAudioService';
import { LikeButton } from '../ui/LikeButton';
import { ThemeToggle } from '../ui/ThemeToggle';
import { CommentThread3 } from '@/components/ui/comment-thread-3';
import { RichTextRenderer } from '../ui/RichTextRenderer';
import { EditDevotionalModal } from '../admin/EditDevotionalModal';

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
    triggerConfetti,
  } = useUIStore();

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { recordReadingSession, user, isAdmin } = useAuthStore();
  const { devotionals, incrementViewCount, fetchCommentsForDevotional } = useDevotionalStore();

  const [isEditingDevotional, setIsEditingDevotional] = useState(false);
  const currentDevotional = devotionals.find((d) => d.id === devotional.id) || devotional;

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

  const accentColor = '#5E72E4';

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

        <View className="flex-row items-center gap-1.5">
          <ThemeToggle scope="reader" />

          <TouchableOpacity
            id="reader-audio-btn"
            onPress={() => playDevotionalAudio(devotional)}
            accessibilityLabel="Listen to audio"
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#CAD1D7]/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </TouchableOpacity>

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
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#CAD1D7]/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </TouchableOpacity>

          <TouchableOpacity
            id="reader-bookmark-btn"
            onPress={() => toggleBookmark(devotional.id)}
            accessibilityLabel={bookmarked ? 'Bookmarked' : 'Bookmark'}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#CAD1D7]/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
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
              <button
                type="button"
                onClick={() => setIsEditingDevotional(true)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Edit devotional cover photo from device"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Photo</span>
              </button>
            )}
          </div>
        ) : (
          isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditingDevotional(true)}
              className="w-full py-4 border-2 border-dashed border-[#5E72E4]/40 hover:border-[#5E72E4] rounded-2xl flex items-center justify-center gap-2 mb-4 text-[#5E72E4] text-xs font-bold bg-[#5E72E4]/5 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Devotional Cover Photo from Device</span>
            </button>
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

        {/* Audio Prompt Bar */}
        {(devotional.audioUrl || devotional.body) && (
          <View
            className={`my-4 p-3.5 rounded-lg border flex-row items-center justify-between transition-all ${scriptureCardClasses} ${
              isThisAudioPlaying ? 'ring-2 ring-[#5E72E4]/40 dark:ring-[#5E72E4]/60' : ''
            }`}
          >
            <TouchableOpacity
              onPress={() => {
                if (audioState.devotionalId === devotional.id) {
                  toggleAudioPlayback();
                } else {
                  playDevotionalAudio(devotional);
                }
              }}
              accessibilityLabel={isThisAudioPlaying ? 'Pause Audio Narration' : 'Listen to Audio Narration'}
              className="flex-1 flex-row items-center gap-3 mr-2 text-left"
            >
              <View
                className={`w-10 h-10 rounded-lg items-center justify-center shrink-0 ${
                  isThisAudioPlaying ? 'bg-emerald-600' : 'bg-[#5E72E4]'
                } shadow-[0_4px_10px_rgba(94,114,228,0.3)]`}
              >
                <Volume2 className="w-5 h-5 text-white" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {isThisAudioPlaying ? 'Now Playing Narration' : 'Listen to Audio Narration'}
                </Text>
                <Text className="text-[11px] opacity-70 text-neutral-600 dark:text-neutral-400 truncate">
                  Narrated by ministry leadership ({audioDurationLabel})
                </Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 shrink-0">
              <TouchableOpacity
                onPress={() => openVoiceSelector()}
                accessibilityLabel="Choose narrator voice"
                className="px-2.5 py-1.5 rounded-md border border-[#CAD1D7]/50 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800 hover:bg-white dark:hover:bg-neutral-700 flex-row items-center gap-1.5 shadow-xs"
              >
                <Mic className="w-3.5 h-3.5 text-[#5E72E4]" />
                <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Voice
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (audioState.devotionalId === devotional.id) {
                    toggleAudioPlayback();
                  } else {
                    playDevotionalAudio(devotional);
                  }
                }}
                accessibilityLabel={isThisAudioPlaying ? 'Pause narration' : 'Play narration'}
                className={`px-3 py-1.5 rounded-md ${
                  isThisAudioPlaying
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[#5E72E4]/10 text-[#5E72E4]'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isThisAudioPlaying
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[#5E72E4]'
                  }`}
                >
                  {isThisAudioPlaying ? 'Pause' : 'Play'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scripture Box */}
        <View className={`my-5 p-5 md:p-6 rounded-lg border shadow-sm ${scriptureCardClasses}`}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold font-display-scripture uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Holy Scripture • {devotional.scripture}
            </Text>
            <TouchableOpacity
              onPress={() =>
                openVerseShare({
                  scripture: devotional.scripture,
                  scriptureText: devotional.scriptureText,
                  title: devotional.title,
                  author: devotional.authorName,
                })
              }
              className="px-2.5 py-1 rounded-md border border-[#CAD1D7]/40 dark:border-neutral-800 bg-white/60 dark:bg-neutral-800 flex-row items-center gap-1.5"
            >
              <Share2 className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
              <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Share</Text>
            </TouchableOpacity>
          </View>
          <Text className="font-serif-reading italic text-base md:text-lg leading-relaxed text-neutral-800 dark:text-neutral-100">
            “{devotional.scriptureText}”
          </Text>
        </View>

        {/* Devotional Body (Rich Text Formatting) */}
        <div className="my-5 leading-relaxed text-neutral-800 dark:text-neutral-200">
          <RichTextRenderer content={devotional.body} />
        </div>

        {/* Key Thought Callout */}
        <View
          className={`my-6 p-5 rounded-2xl border ${
            isDark
              ? 'bg-neutral-900 border-neutral-800'
              : 'bg-amber-50/70 border-amber-200/60'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <Text className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Key Meditation For Today
            </Text>
          </View>
          <Text className="text-sm md:text-base font-semibold italic pl-6 text-neutral-800 dark:text-neutral-200">
            “{devotional.keyThought}”
          </Text>
        </View>

        {/* Prayer of the Day */}
        <View
          className={`my-6 p-5 rounded-2xl border ${
            isDark
              ? 'bg-neutral-900 border-neutral-800'
              : 'bg-blue-50/60 border-blue-200/50'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <Text className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Prayer of Consecration
            </Text>
          </View>
          <Text className="text-sm md:text-base italic leading-relaxed pl-6 text-neutral-800 dark:text-neutral-200">
            {devotional.prayerPrompt}
          </Text>
        </View>

        {/* Reading Completion and Consecration Action */}
        <View className="my-6">
          {hasFinishedReading ? (
            <View
              className={`p-4 rounded-2xl border flex-col items-center justify-center gap-1.5 ${
                isDark
                  ? 'bg-emerald-950/30 border-emerald-800/50'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <View className="flex-row items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <Text className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                  Devotional Reading Completed & Consecrated!
                </Text>
              </View>
              <Text className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                {readingCompletedStats
                  ? `Daily streak: ${readingCompletedStats.streak} ${readingCompletedStats.streak === 1 ? 'day' : 'days'} • Total Word time: ${readingCompletedStats.totalMinutes} mins`
                  : `Daily streak: ${user?.streakCount ?? 0} ${(user?.streakCount ?? 0) === 1 ? 'day' : 'days'} • Daily activity synced`}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleCompleteReading}
              className="p-4 rounded-2xl bg-[#5E72E4] hover:bg-[#4d61d1] active:scale-[0.99] transition-all flex-row items-center justify-center gap-2.5 shadow-md"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <Text className="text-sm font-black text-white uppercase tracking-wider">
                Mark Devotional Read & Consecrated
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Interaction Action Bar */}
        <View className="my-6 pt-5 border-t border-black/10 dark:border-white/10 flex-row items-center justify-between">
          <LikeButton devotionalId={devotional.id} count={devotional.likeCount} variant="pill" />

          <View className="flex-row items-center gap-2">
            {isAdmin && (
              <TouchableOpacity
                id="admin-edit-devotional-btn"
                onPress={() => setIsEditingDevotional(true)}
                className={`flex-row items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border shadow-sm transition-colors ${
                  isDark
                    ? 'bg-[#5E72E4]/20 border-[#5E72E4]/40 hover:bg-[#5E72E4]/30'
                    : 'bg-[#5E72E4]/10 border-[#5E72E4]/30 hover:bg-[#5E72E4]/20'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-[#5E72E4]" />
                <Text className="text-xs font-bold text-[#5E72E4]">
                  Edit Teaching & Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              id="open-comments-action-btn"
              onPress={() => openCommentsSheet(devotional.id)}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border shadow-sm transition-colors ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white border-[#CAD1D7] hover:bg-neutral-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Reflections
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                openVerseShare({
                  scripture: devotional.scripture,
                  scriptureText: devotional.scriptureText,
                  title: devotional.title,
                  author: devotional.authorName,
                })
              }
              className={`flex-row items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border shadow-sm transition-colors ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white border-[#CAD1D7] hover:bg-neutral-50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
              <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reflections & Community Activity Thread */}
        <View className="mb-14">
          <CommentThread3
            devotionalId={devotional.id}
            maxInitial={2}
            onViewAll={() => openCommentsSheet(devotional.id)}
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
    </View>
  );
};
