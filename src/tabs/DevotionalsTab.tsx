import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FlatList } from '../lib/react-native';
import {
  Search,
  Bookmark,
  BookOpen,
  X,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useDevotionalStore } from '../store/useDevotionalStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { Devotional } from '../types';
import { Input, Button } from '../components/common';
import { ProductCardHorizontal, StackedDeckSlider } from '../components/cards';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { Calendar } from 'lucide-react';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { isDevotionalLive } from '../services/schedulingService';
import { EditDevotionalModal } from '../components/admin/EditDevotionalModal';

interface DevotionalsTabProps {
  onSelectDevotional: (devotional: Devotional) => void;
}

const ITEMS_PER_PAGE = 6;

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
  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmarkStore();
  const { isAdmin } = useAuthStore();
  const { playDevotionalAudio } = useUIStore();

  const [activeTag, setActiveTag] = useState<string>('All');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingDevotional, setEditingDevotional] = useState<Devotional | null>(null);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTag, onlyBookmarked, selectedDate]);

  const filteredDevotionals = useMemo(() => {
    return devotionals.filter((d) => {
      // Disciples only see live teachings unless admin
      if (!isAdmin && !isDevotionalLive(d)) return false;

      const matchesSearch =
        searchQuery.trim() === '' ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.scripture.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.scriptureText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.body.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        activeTag === 'All' || d.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase());

      const matchesBookmark = !onlyBookmarked || bookmarkedIds.includes(d.id);

      const matchesDate =
        !selectedDate ||
        (d.scheduledDate && d.scheduledDate === selectedDate) ||
        (d.publishedAt && d.publishedAt.startsWith(selectedDate));

      return matchesSearch && matchesTag && matchesBookmark && matchesDate;
    });
  }, [devotionals, searchQuery, activeTag, onlyBookmarked, bookmarkedIds, selectedDate, isAdmin]);

  const totalPages = Math.max(1, Math.ceil(filteredDevotionals.length / ITEMS_PER_PAGE));
  const paginatedDevotionals = useMemo(() => {
    const list =
      filteredDevotionals.length <= ITEMS_PER_PAGE
        ? filteredDevotionals
        : filteredDevotionals.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
          );

    const seen = new Set<string>();
    return list.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [filteredDevotionals, currentPage]);

  const featuredForDeck = useMemo(() => {
    const seen = new Set<string>();
    return devotionals
      .filter((d) => {
        if (!d || !d.id || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      })
      .slice(0, 5);
  }, [devotionals]);

  const renderDevotionalItem = ({ item: devotional }: { item: Devotional }) => {
    return (
      <div className="mb-3.5">
        <ProductCardHorizontal
          devotional={devotional}
          onPress={() => onSelectDevotional(devotional)}
          onBookmark={toggleBookmark}
          isBookmarked={isBookmarked(devotional.id)}
          onAudio={playDevotionalAudio}
          onEdit={isAdmin ? (dev) => setEditingDevotional(dev) : undefined}
        />
      </div>
    );
  };

  return (
    <View className="flex-1 max-w-4xl mx-auto w-full px-1">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white">
          Devotional Library
        </Text>
        <Text className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
          Topical discipleship teachings grounded in Holy Scripture
        </Text>
      </View>

      {/* 3D Stacked Deck Slider: Shown when no active search (Template 2 Spec) */}
      {!searchQuery && activeTag === 'All' && !onlyBookmarked && (
        <div className="mb-6">
          <StackedDeckSlider
            devotionals={featuredForDeck}
            onSelect={onSelectDevotional}
          />
        </div>
      )}

      {/* Sticky Search & Quick Suggestions Bar */}
      <View className="mb-4">
        <div className="relative">
          <Input
            id="devotionals-search-input"
            placeholder="Search devotionals, scripture, topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconContent={<Search className="w-4 h-4 text-[#ADB5BD]" />}
            iconPosition="left"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Quick Suggested Searches */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#5E72E4]" /> Suggested:
          </span>
          {['Vine', 'Prayer', 'Faith', 'Consecration', 'Fruit'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:border-[#5E72E4] hover:text-[#5E72E4] transition-colors shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              {tag}
            </button>
          ))}
        </div>
      </View>

      {/* Filter Chips & Bookmark Toggle (Template 1 Spec: Clean Pill Tabs) */}
      <View className="space-y-3 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#5E72E4]" />
            <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Topic Filter
            </Text>
          </View>

          <Button
            small
            color={onlyBookmarked ? 'warning' : 'secondary'}
            id="toggle-bookmarked-filter-btn"
            onPress={() => setOnlyBookmarked(!onlyBookmarked)}
            className="flex-row items-center gap-1 min-h-[38px] px-3.5 rounded-full"
          >
            <Bookmark
              className={`w-3.5 h-3.5 mr-1 ${
                onlyBookmarked ? 'fill-white text-white' : 'text-amber-500'
              }`}
            />
            Bookmarked ({bookmarkedIds.length})
          </Button>
        </View>

        {/* Template 1 Pill Menu Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TAG_FILTERS.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-[12px] text-xs font-extrabold uppercase tracking-wide transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Date Filter Bar using DateTimePicker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5E72E4] dark:text-[#7BDEB2] shrink-0" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Browse by Date:
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <DateTimePicker
              value={selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()}
              mode="date"
              placeholder="Pick a publishing date..."
              onChange={(event, date) => {
                if (event.type === 'set' && date) {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, '0');
                  const d = String(date.getDate()).padStart(2, '0');
                  setSelectedDate(`${y}-${m}-${d}`);
                }
              }}
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </View>

      {/* Devotionals List: ProductCardHorizontal (Template 3 Spec) */}
      <FlatList<Devotional>
        data={paginatedDevotionals}
        keyExtractor={(item: Devotional, idx: number) => (item?.id ? `${item.id}-${idx}` : `dev-${idx}`)}
        renderItem={renderDevotionalItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        ListFooterComponent={
          filteredDevotionals.length > ITEMS_PER_PAGE ? (
            <div className="pt-4 pb-6">
              <PaginationPageDefault
                page={currentPage}
                total={totalPages}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }
                }}
              />
            </div>
          ) : null
        }
        ListEmptyComponent={
          <View className="py-16 sm:py-20 items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 bg-white dark:bg-neutral-900/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="w-14 h-14 rounded-full bg-[#5E72E4]/10 flex items-center justify-center mb-3 text-[#5E72E4]">
              <BookOpen className="w-7 h-7" />
            </div>
            <Text className="font-extrabold text-base text-neutral-900 dark:text-white">
              No devotionals matched your query
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-sm text-center leading-relaxed">
              We couldn't find matches for &ldquo;{searchQuery || activeTag}&rdquo;. Try another term, or reset your filters to browse the complete archive.
            </Text>
            <div className="mt-5">
              <Button
                color="primary"
                onPress={() => {
                  setSearchQuery('');
                  setActiveTag('All');
                  setOnlyBookmarked(false);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          </View>
        }
      />

      {/* Admin Quick Edit Devotional & Photo Modal */}
      {isAdmin && (
        <EditDevotionalModal
          devotional={editingDevotional}
          isOpen={!!editingDevotional}
          onClose={() => setEditingDevotional(null)}
        />
      )}
    </View>
  );
};
