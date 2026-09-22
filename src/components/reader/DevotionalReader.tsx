import React, { useRef, useState, useEffect } from 'react';
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
} from 'lucide-react';
import { motion } from 'motion/react';
import { Devotional } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { useAuthStore } from '../../store/useAuthStore';
import { LikeButton } from '../ui/LikeButton';
import { ThemeToggle } from '../ui/ThemeToggle';

interface DevotionalReaderProps {
  devotional: Devotional;
  onBack: () => void;
}

export const DevotionalReader: React.FC<DevotionalReaderProps> = ({ devotional, onBack }) => {
  const {
    theme,
    openCommentsSheet,
    openVerseShare,
    playDevotionalAudio,
    triggerConfetti,
  } = useUIStore();

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { recordDevotionalRead } = useAuthStore();
  const { incrementViewCount } = useDevotionalStore();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const bookmarked = isBookmarked(devotional.id);

  useEffect(() => {
    incrementViewCount(devotional.id);
  }, [devotional.id, incrementViewCount]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const totalScroll = scrollHeight - clientHeight;
    if (totalScroll <= 0) return;
    const progress = Math.min(100, Math.max(0, (scrollTop / totalScroll) * 100));
    setScrollProgress(progress);

    if (progress > 85 && !hasFinishedReading) {
      setHasFinishedReading(true);
      recordDevotionalRead().then((res) => {
        if (res?.milestone) {
          triggerConfetti(res.milestone);
        }
      });
    }
  };

  const isSepia = theme === 'sepia';
  const isDark = theme === 'dark';

  // Apply theme tokens strictly per §6:
  // Sepia: #F4ECD8 bg / #5B4636 text / #966F33 accent (WCAG AA checked)
  // Dark: True OLED black (#000000)
  const themeClasses = isSepia
    ? 'bg-[#F4ECD8] text-[#5B4636]'
    : isDark
    ? 'bg-black text-[#EDEDED]'
    : 'bg-[#FAF9F6] text-neutral-900';

  const scriptureCardClasses = isSepia
    ? 'bg-[#EFE6D0] border-[#DFD1B5] text-[#5B4636]'
    : isDark
    ? 'bg-[#111111] border-neutral-800 text-neutral-100'
    : 'bg-white border-neutral-200/80 text-neutral-900';

  const accentColor = isSepia ? '#966F33' : isDark ? '#3B82F6' : '#2563EB';

  return (
    <div className={`relative h-full flex flex-col overflow-hidden ${themeClasses}`}>
      {/* Top Animated Reading Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-black/10 dark:bg-white/10 z-30">
        <motion.div
          id="reading-progress-bar"
          className="h-full bg-blue-600 dark:bg-blue-400"
          style={{
            backgroundColor: accentColor,
            width: `${scrollProgress}%`,
          }}
          transition={{ ease: 'easeOut', duration: 0.1 }}
        />
      </div>

      {/* Reader Navigation Header */}
      <header
        id="reader-header"
        className={`shrink-0 z-20 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md ${
          isSepia
            ? 'bg-[#F4ECD8]/90 border-[#DFD1B5]'
            : isDark
            ? 'bg-black/90 border-neutral-900'
            : 'bg-[#FAF9F6]/90 border-neutral-200'
        }`}
      >
        <button
          id="back-to-feed-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Feed</span>
        </button>

        <div className="flex items-center gap-1">
          <ThemeToggle scope="reader" />

          <button
            id="reader-audio-btn"
            onClick={() => playDevotionalAudio(devotional)}
            title="Listen to Narration"
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Listen to audio"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            id="reader-share-btn"
            onClick={() =>
              openVerseShare({
                scripture: devotional.scripture,
                scriptureText: devotional.scriptureText,
                title: devotional.title,
                author: devotional.authorName,
              })
            }
            title="Share Scripture as Image"
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Share verse card"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            id="reader-bookmark-btn"
            onClick={() => toggleBookmark(devotional.id)}
            title={bookmarked ? 'Remove Bookmark' : 'Bookmark Devotional'}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label={bookmarked ? 'Bookmarked' : 'Bookmark'}
          >
            <Bookmark
              className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : 'text-current'}`}
            />
          </button>
        </div>
      </header>

      {/* Scrollable Content View */}
      <main
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 md:px-8 py-6 max-w-2xl mx-auto w-full"
      >
        {/* Category Tags & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {devotional.tags.map((tag) => (
            <span
              key={tag}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                isSepia
                  ? 'bg-[#E3D5BA] text-[#5B4636]'
                  : isDark
                  ? 'bg-neutral-800 text-neutral-300'
                  : 'bg-neutral-200/70 text-neutral-700'
              }`}
            >
              {tag}
            </span>
          ))}
          <span className="text-[11px] opacity-60 flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" /> 4 min read
          </span>
        </div>

        {/* Devotional Title */}
        <h1 className="font-display-scripture text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          {devotional.title}
        </h1>

        {/* Author Bylines */}
        <div className="flex items-center gap-3 my-4 pb-4 border-b border-black/10 dark:border-white/10 text-xs">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
              isSepia ? 'bg-[#966F33] text-[#F4ECD8]' : 'bg-blue-600 text-white'
            }`}
          >
            {devotional.authorName.charAt(0)}
          </div>
          <div>
            <p className="font-bold">{devotional.authorName}</p>
            <p className="opacity-70 text-[11px]">{devotional.authorRole}</p>
          </div>
          <div className="ml-auto text-right opacity-60 text-[11px] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {devotional.publishedAt
              ? new Date(devotional.publishedAt).toLocaleDateString()
              : 'Draft'}
          </div>
        </div>

        {/* Audio Prompt Bar */}
        {devotional.audioUrl && (
          <div
            onClick={() => playDevotionalAudio(devotional)}
            className={`my-5 p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${scriptureCardClasses}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSepia ? 'bg-[#966F33] text-white' : 'bg-blue-600 text-white'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Listen to Audio Narration</p>
                <p className="text-[11px] opacity-70">Narrated by ministry leadership (3m 15s)</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                isSepia
                  ? 'bg-[#966F33]/15 text-[#966F33]'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}
            >
              Play
            </span>
          </div>
        )}

        {/* Scripture Box */}
        <div
          className={`my-6 p-5 md:p-6 rounded-3xl border shadow-sm relative overflow-hidden ${scriptureCardClasses}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold font-display-scripture uppercase tracking-wider ${
                isSepia ? 'text-[#966F33]' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              Holy Scripture • {devotional.scripture}
            </span>
            <button
              onClick={() =>
                openVerseShare({
                  scripture: devotional.scripture,
                  scriptureText: devotional.scriptureText,
                  title: devotional.title,
                  author: devotional.authorName,
                })
              }
              title="Share Verse"
              className="text-xs font-semibold opacity-70 hover:opacity-100 flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" /> Share
            </button>
          </div>
          <p className="font-serif-reading italic text-base md:text-lg leading-relaxed">
            “{devotional.scriptureText}”
          </p>
        </div>

        {/* Devotional Body (Rendered with clean typographic rhythm) */}
        <article className="font-serif-reading text-base md:text-lg leading-relaxed space-y-5 my-6">
          {devotional.body.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h2
                  key={index}
                  className="font-display-scripture text-lg md:text-xl font-bold mt-6 mb-2"
                >
                  {paragraph.replace('### ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h3
                  key={index}
                  className="font-display-scripture text-base md:text-lg font-bold mt-5 mb-2"
                >
                  {paragraph.replace('#### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
              return (
                <div key={index} className="pl-4 border-l-2 border-black/20 dark:border-white/20 py-1 space-y-1 text-sm md:text-base">
                  {paragraph.split('\n').map((line, li) => (
                    <p key={li} className="leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              );
            }
            return (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </article>

        {/* Key Thought Callout */}
        <div
          className={`my-8 p-5 rounded-2xl border ${
            isSepia
              ? 'bg-[#EFE6D0] border-[#DFD1B5]'
              : isDark
              ? 'bg-neutral-900 border-neutral-800'
              : 'bg-amber-50/70 border-amber-200/60'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isSepia ? 'text-[#966F33]' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              Key Meditation For Today
            </h3>
          </div>
          <p className="text-sm md:text-base font-semibold italic pl-6">
            “{devotional.keyThought}”
          </p>
        </div>

        {/* Prayer of the Day */}
        <div
          className={`my-8 p-5 rounded-2xl border ${
            isSepia
              ? 'bg-[#E8DDC3] border-[#D4C3A3]'
              : isDark
              ? 'bg-neutral-900 border-neutral-800'
              : 'bg-blue-50/60 border-blue-200/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isSepia ? 'text-[#966F33]' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              Prayer of Consecration
            </h3>
          </div>
          <p className="text-sm md:text-base italic leading-relaxed pl-6">
            {devotional.prayerPrompt}
          </p>
        </div>

        {/* Reading Completion Banner */}
        {hasFinishedReading && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`my-8 p-4 rounded-2xl border text-center flex items-center justify-center gap-2 ${
              isSepia
                ? 'bg-[#E3D5BA] border-[#D8C7A4]'
                : isDark
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold">
              Devotional completed today! Daily streak updated.
            </span>
          </motion.div>
        )}

        {/* Interaction Action Bar */}
        <div className="my-8 pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
          <LikeButton devotionalId={devotional.id} count={devotional.likeCount} variant="pill" />

          <div className="flex items-center gap-2">
            <button
              id="open-comments-action-btn"
              onClick={() => openCommentsSheet(devotional.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSepia
                  ? 'bg-[#EFE6D0] border-[#DFD1B5] hover:bg-[#E3D5BA]'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reflections</span>
            </button>

            <button
              onClick={() =>
                openVerseShare({
                  scripture: devotional.scripture,
                  scriptureText: devotional.scriptureText,
                  title: devotional.title,
                  author: devotional.authorName,
                })
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSepia
                  ? 'bg-[#EFE6D0] border-[#DFD1B5] hover:bg-[#E3D5BA]'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                  : 'bg-white border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
