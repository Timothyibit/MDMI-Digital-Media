import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  ArrowUpDown,
  Sparkles,
  RotateCcw,
  Check,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface DevotionalFilterState {
  activeTag: string;
  onlyBookmarked: boolean;
  selectedDate: string;
  sortBy: 'latest' | 'popular' | 'oldest';
}

export interface SearchWithFilterBoxProps {
  // Search Bar Props (react-native-search-component style)
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSearchSubmit?: () => void;
  onClear?: () => void;
  className?: string;

  // Filter Box Props
  activeTag?: string;
  onTagChange?: (tag: string) => void;
  availableTags?: string[];

  onlyBookmarked?: boolean;
  onToggleBookmarked?: () => void;
  bookmarkedCount?: number;

  selectedDate?: string;
  onDateChange?: (date: string) => void;

  sortBy?: 'latest' | 'popular' | 'oldest';
  onSortChange?: (sort: 'latest' | 'popular' | 'oldest') => void;

  suggestedTags?: string[];
  onSuggestedTagClick?: (tag: string) => void;

  onResetAll?: () => void;

  // Custom filter content override if needed
  customFilterContent?: React.ReactNode;
}

export const SearchWithFilterBox: React.FC<SearchWithFilterBoxProps> = ({
  value,
  onChangeText,
  placeholder = 'Search devotionals, scriptures, themes...',
  onSearchSubmit,
  onClear,
  className,

  activeTag = 'All',
  onTagChange,
  availableTags = [
    'All',
    'Grace',
    'Faith',
    'Holy Spirit',
    'Prayer',
    'Spiritual Warfare',
    'Discipleship',
    'Consecration',
    'Praise & Thanksgiving',
    'Wisdom',
  ],

  onlyBookmarked = false,
  onToggleBookmarked,
  bookmarkedCount = 0,

  selectedDate = '',
  onDateChange,

  sortBy = 'latest',
  onSortChange,

  suggestedTags = ['Vine', 'Prayer', 'Faith', 'Consecration', 'Fruit'],
  onSuggestedTagClick,

  onResetAll,
  customFilterContent,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute active filters count
  const activeFilterCount =
    (activeTag && activeTag !== 'All' ? 1 : 0) +
    (onlyBookmarked ? 1 : 0) +
    (selectedDate ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0);

  const handleClearSearch = () => {
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    onChangeText('');
    onClear?.();
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleResetFilters = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      if (onTagChange) onTagChange('All');
      if (onToggleBookmarked && onlyBookmarked) onToggleBookmarked();
      if (onDateChange) onDateChange('');
      if (onSortChange) onSortChange('latest');
    }
  };

  return (
    <div className={cn('w-full flex flex-col gap-3', className)}>
      {/* ========================================================================= */}
      {/* 1. Sleek Search Bar (Modeled after react-native-search-component)          */}
      {/* ========================================================================= */}
      <div className="relative w-full flex items-center gap-2">
        <div
          className={cn(
            'flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-200',
            'bg-white dark:bg-neutral-900 shadow-sm',
            isFocused
              ? 'border-[#84CC16] ring-2 ring-[#84CC16]/20 dark:ring-[#84CC16]/30'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          )}
        >
          {/* Animated Search Icon */}
          <div
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-xl transition-colors duration-200',
              isFocused
                ? 'bg-[#84CC16]/15 text-[#65A30D] dark:text-[#84CC16]'
                : 'text-neutral-400 dark:text-neutral-500'
            )}
          >
            <Search className="w-4 h-4 shrink-0" />
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => onChangeText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit?.();
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none border-none min-w-0"
          />

          {/* Clear Button */}
          {value && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              type="button"
              onClick={handleClearSearch}
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}

          {/* Filter Toggle Button with Active Count Badge */}
          <div className="flex items-center pl-1 border-l border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                isFilterOpen
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : activeFilterCount > 0
                  ? 'bg-[#84CC16]/15 border border-[#84CC16]/50 text-[#4D7C0F] dark:text-[#84CC16] hover:bg-[#84CC16]/25'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              )}
              aria-label="Toggle filter options"
              title="Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Filters</span>

              {/* Active count badge */}
              {activeFilterCount > 0 && (
                <span
                  className={cn(
                    'w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center',
                    isFilterOpen
                      ? 'bg-[#84CC16] text-white'
                      : 'bg-[#DC2626] text-white shadow-xs animate-pulse'
                  )}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Animated Cancel Button (react-native-search-component signature) */}
        <AnimatePresence>
          {isFocused && value && (
            <motion.button
              initial={{ opacity: 0, width: 0, x: 10 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={handleCancel}
              className="text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2 py-2 cursor-pointer shrink-0"
            >
              Cancel
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 2. Hidden Filter Box (Opens on toggle, completely hidden otherwise)        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Card className="w-full border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-xl rounded-2xl">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#84CC16]/20 flex items-center justify-center text-[#4D7C0F] dark:text-[#84CC16]">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-extrabold text-[#172B4D] dark:text-white">
                        Filter & Refine Teachings
                      </CardTitle>
                      <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''} applied`
                          : 'Hide or reveal topics, dates, bookmarks, and sort criteria'}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="h-8 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
                      title="Close filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                <Separator />

                {customFilterContent ? (
                  customFilterContent
                ) : (
                  <>
                    {/* A. Topics / Categories Filter */}
                    {availableTags.length > 0 && onTagChange && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#84CC16]" />
                          <span>Spiritual Topics & Themes</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {availableTags.map((tag) => {
                            const isSelected = activeTag === tag;
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => onTagChange(tag)}
                                className={cn(
                                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
                                  isSelected
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm ring-1 ring-black dark:ring-white scale-[1.02]'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                <span>{tag}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* B. Bookmarked Toggle & Sort Order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* Bookmarks Filter */}
                      {onToggleBookmarked && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                            <span>Saved Reflections</span>
                          </label>
                          <Button
                            type="button"
                            variant={onlyBookmarked ? 'default' : 'outline'}
                            onClick={onToggleBookmarked}
                            className={cn(
                              'w-full justify-between h-9 text-xs font-bold rounded-xl cursor-pointer',
                              onlyBookmarked
                                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <Bookmark
                                className={cn(
                                  'w-3.5 h-3.5',
                                  onlyBookmarked ? 'fill-white text-white' : 'text-amber-500'
                                )}
                              />
                              <span>Only Bookmarked Devotionals</span>
                            </span>
                            <Badge
                              variant={onlyBookmarked ? 'secondary' : 'outline'}
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              {bookmarkedCount}
                            </Badge>
                          </Button>
                        </div>
                      )}

                      {/* Sort Order Selector */}
                      {onSortChange && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#84CC16]" />
                            <span>Sort Sequence</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(
                              [
                                { id: 'latest', label: 'Latest' },
                                { id: 'popular', label: 'Popular' },
                                { id: 'oldest', label: 'Oldest' },
                              ] as const
                            ).map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => onSortChange(s.id)}
                                className={cn(
                                  'py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer',
                                  sortBy === s.id
                                    ? 'bg-[#84CC16] text-white border-[#84CC16] shadow-xs'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                )}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* C. Date Picker */}
                    {onDateChange && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#84CC16]" />
                          <span>Specific Devotional Release Date</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#84CC16]"
                          />
                          {selectedDate && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDateChange('')}
                              className="h-8 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                            >
                              Clear Date
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* D. Suggested Quick Search Tags inside filter box */}
                    {suggestedTags.length > 0 && onSuggestedTagClick && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#84CC16]" />
                          <span>Quick Keynote Search Suggestions:</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                onSuggestedTagClick(tag);
                                setIsFilterOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:border-[#84CC16] hover:text-[#4D7C0F] dark:hover:text-[#84CC16] transition-colors cursor-pointer"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Footer action */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {activeFilterCount > 0 ? `${activeFilterCount} active filters` : 'All teachings included'}
                  </span>
                  <Button
                    size="sm"
                    className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black font-bold text-xs px-4 cursor-pointer"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Done Filtering
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchWithFilterBox;
