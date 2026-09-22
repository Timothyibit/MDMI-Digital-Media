import React, { useState, useMemo } from 'react';
import {
  Search,
  Bookmark,
  BookOpen,
  Volume2,
  Clock,
  Heart,
  Eye,
  X,
  Filter,
} from 'lucide-react';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { Devotional } from '../types';

interface DevotionalsTabProps {
  onSelectDevotional: (devotional: Devotional) => void;
}

const TAG_FILTERS = [
  'All',
  'Discipleship',
  'Prayer',
  'Faith',
  'Grace',
  'Sanctification',
  'Spiritual Warfare',
  'Holy Spirit',
];

export const DevotionalsTab: React.FC<DevotionalsTabProps> = ({ onSelectDevotional }) => {
  const { devotionals, searchQuery, setSearchQuery } = useDevotionalStore();
  const { bookmarkedIds, toggleBookmark } = useBookmarkStore();

  const [activeTag, setActiveTag] = useState<string>('All');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);

  const filteredDevotionals = useMemo(() => {
    return devotionals.filter((d) => {
      // Must be published unless previewing
      const matchesSearch =
        searchQuery.trim() === '' ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.scripture.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.scriptureText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.body.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        activeTag === 'All' || d.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase());

      const matchesBookmark = !onlyBookmarked || bookmarkedIds.includes(d.id);

      return matchesSearch && matchesTag && matchesBookmark;
    });
  }, [devotionals, searchQuery, activeTag, onlyBookmarked, bookmarkedIds]);

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display-scripture text-neutral-900 dark:text-white">
          Devotional Library
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Topical discipleship teachings grounded in Holy Scripture
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="devotionals-search-input"
          type="text"
          placeholder="Search by title, scripture reference, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips & Bookmark Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Filter className="w-3 h-3" />
            <span>Topics</span>
          </div>

          <button
            id="toggle-bookmarked-filter-btn"
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              onlyBookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-current' : ''}`} />
            <span>Bookmarked ({bookmarkedIds.length})</span>
          </button>
        </div>

        {/* Horizontally scrollable chip container */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {TAG_FILTERS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTag === tag
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Devotionals Count Bar */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
        <span>Showing {filteredDevotionals.length} writings</span>
      </div>

      {/* Devotionals List */}
      {filteredDevotionals.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
          <BookOpen className="w-10 h-10 stroke-1 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
            No devotionals matched your search
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search terms or clearing your topic filters to explore our library.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTag('All');
              setOnlyBookmarked(false);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevotionals.map((devotional) => {
            const isBookmarkedItem = bookmarkedIds.includes(devotional.id);

            return (
              <div
                key={devotional.id}
                id={`devotional-card-${devotional.id}`}
                onClick={() => onSelectDevotional(devotional)}
                className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-display-scripture">
                        {devotional.scripture}
                      </span>
                      {devotional.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {devotional.title}
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed font-serif-reading italic">
                      “{devotional.keyThought}”
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(devotional.id);
                    }}
                    title={isBookmarkedItem ? 'Remove Bookmark' : 'Save Bookmark'}
                    aria-label="Toggle Bookmark"
                    className="p-2 rounded-xl text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isBookmarkedItem ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2">
                  <div className="flex items-center gap-3">
                    <span>By {devotional.authorName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 4 min
                    </span>
                    {devotional.audioUrl && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Volume2 className="w-3 h-3" /> Audio
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {devotional.viewCount}
                    </span>
                    <span className="flex items-center gap-1 text-rose-500 font-semibold">
                      <Heart className="w-3 h-3 fill-rose-500" /> {devotional.likeCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
