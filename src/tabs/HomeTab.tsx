import React from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  ChevronRight,
  Bookmark,
  PenTool,
  Clock,
  Heart,
  Share2,
} from 'lucide-react';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { useUIStore } from '../store/useUIStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { BentoCard } from '../components/ui/BentoGrid';
import { StreakTracker } from '../components/ui/StreakTracker';
import { Devotional } from '../types';

interface HomeTabProps {
  onSelectDevotional: (devotional: Devotional) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onSelectDevotional }) => {
  const { devotionals } = useDevotionalStore();
  const { setActiveTab, openVerseShare, playDevotionalAudio } = useUIStore();
  const { isBookmarked } = useBookmarkStore();

  const published = devotionals.filter((d) => d.publishedAt !== null);
  const featured = published[0] || devotionals[0];

  return (
    <div className="space-y-4 md:space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-display-scripture">
            THE MASTER'S DISCIPLESHIP MINISTRIES
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tracking-tight">
            Daily Devotional
          </h1>
        </div>

        <StreakTracker variant="compact" />
      </div>

      {/* Bento Grid Layout (Flex / Wrap with explicit width fractions) */}
      <div className="flex flex-wrap -m-2">
        {/* Large Bento Card: Verse of the Day & Featured Devotional */}
        <div className="w-full lg:w-2/3 p-2">
          {featured && (
            <BentoCard
              id="verse-of-the-day-card"
              index={0}
              className="h-full flex flex-col justify-between min-h-[300px] md:min-h-[340px] bg-gradient-to-br from-blue-900/10 via-white/80 to-amber-500/10 dark:from-blue-950/40 dark:via-neutral-900/80 dark:to-neutral-950 border-blue-200/60 dark:border-blue-900/40"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300 text-xs font-bold font-display-scripture">
                    <Sparkles className="w-3.5 h-3.5" /> Verse of the Day
                  </span>

                  <button
                    id="share-featured-verse-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openVerseShare({
                        scripture: featured.scripture,
                        scriptureText: featured.scriptureText,
                        title: featured.title,
                        author: featured.authorName,
                      });
                    }}
                    className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title="Share Verse"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="font-serif-reading italic text-lg sm:text-xl md:text-2xl leading-relaxed text-neutral-800 dark:text-neutral-100 font-medium">
                  “{featured.scriptureText}”
                </h2>

                <p className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 font-display-scripture">
                  — {featured.scripture}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {featured.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    By {featured.authorName} • 4 min read
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {featured.audioUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playDevotionalAudio(featured);
                      }}
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Play narration"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Audio</span>
                    </button>
                  )}

                  <button
                    id="read-today-devotional-btn"
                    onClick={() => onSelectDevotional(featured)}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Read Today's Devotional</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </BentoCard>
          )}
        </div>

        {/* Small Bento Card: Streak Tracker Tile */}
        <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
          <BentoCard index={1} className="h-full p-0 overflow-visible">
            <StreakTracker variant="card" />
          </BentoCard>
        </div>

        {/* Medium Bento Card: Audio Word of the Day */}
        <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
          <BentoCard
            id="audio-daily-word-card"
            index={2}
            onClick={() => featured && playDevotionalAudio(featured)}
            className="h-full flex flex-col justify-between bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border-neutral-800"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Spoken Word
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Audio Narration
              </h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Listen to reverent audio reflections narrated for prayer, driving, and meditation.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-blue-400 font-semibold">
              <span>Listen Now ({featured?.audioDurationSeconds || 195}s)</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </BentoCard>
        </div>

        {/* Medium Bento Card: Prayer Journal Prompt */}
        <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
          <BentoCard
            id="prayer-journal-prompt-card"
            index={3}
            onClick={() => setActiveTab('journal')}
            className="h-full flex flex-col justify-between bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
                <PenTool className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Personal Discipleship
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                Private Prayer Journal
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                Record what the Lord is speaking to your heart. Keep your private spiritual reflections safe.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <span>Write Reflection</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </BentoCard>
        </div>

        {/* Medium Bento Card: Library Quick Jump */}
        <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
          <BentoCard
            id="explore-library-card"
            index={4}
            onClick={() => setActiveTab('devotionals')}
            className="h-full flex flex-col justify-between border-neutral-200 dark:border-neutral-800"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Devotional Archives
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                Explore All Devotionals
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Browse topical studies on Abiding, Faith, Consecration, and Spiritual Transformation.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Browse {devotionals.length} Writings</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </BentoCard>
        </div>
      </div>

      {/* Devotional Feed Preview Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h3 className="text-lg font-bold font-display-scripture text-neutral-900 dark:text-white">
              Recent Devotional Releases
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Nourishing insights from The Master's Discipleship Ministries
            </p>
          </div>

          <button
            onClick={() => setActiveTab('devotionals')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {published.slice(1, 5).map((devotional, idx) => (
            <div
              key={devotional.id}
              onClick={() => onSelectDevotional(devotional)}
              className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {devotional.scripture}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 4 min
                  </span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {devotional.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {devotional.keyThought}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>By {devotional.authorName}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    {devotional.likeCount}
                  </span>
                  {isBookmarked(devotional.id) && (
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
