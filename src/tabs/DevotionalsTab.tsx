import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '../lib/react-native';
import {
  Search,
  Bookmark,
  BookOpen,
  X,
  Filter,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import MotionButton from '@/components/ui/motion-button';
import { useDevotionalStore, sortDevotionalsByLatest } from '../store/useDevotionalStore';
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
import { SearchWithFilterBox } from '@/components/ui/search-with-filter-box';

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
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'popular'>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingDevotional, setEditingDevotional] = useState<Devotional | null>(null);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTag, onlyBookmarked, selectedDate, sortBy]);

  const filteredDevotionals = useMemo(() => {
    const list = devotionals.filter((d) => {
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

    if (sortBy === 'latest') {
      return sortDevotionalsByLatest(list);
    } else if (sortBy === 'oldest') {
      return [...sortDevotionalsByLatest(list)].reverse();
    } else if (sortBy === 'popular') {
      return [...list].sort((a, b) => ((b.likeCount || 0) + (b.viewCount || 0)) - ((a.likeCount || 0) + (a.viewCount || 0)));
    }
    return sortDevotionalsByLatest(list);
  }, [devotionals, searchQuery, activeTag, onlyBookmarked, bookmarkedIds, selectedDate, isAdmin, sortBy]);

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
    const sorted = sortDevotionalsByLatest(devotionals);
    return sorted
      .filter((d) => {
        if (!d || !d.id || seen.has(d.id)) return false;
        if (!isAdmin && !isDevotionalLive(d)) return false;
        seen.add(d.id);
        return true;
      })
      .slice(0, 5);
  }, [devotionals, isAdmin]);

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

      {/* Search Bar with Hidden Filter Box (Modeled after react-native-search-component & TaskFilters) */}
      <View className="mb-4">
        <SearchWithFilterBox
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search devotionals, scriptures, themes..."
          activeTag={activeTag}
          onTagChange={setActiveTag}
          availableTags={TAG_FILTERS}
          onlyBookmarked={onlyBookmarked}
          onToggleBookmarked={() => setOnlyBookmarked(!onlyBookmarked)}
          bookmarkedCount={bookmarkedIds.length}
          selectedDate={selectedDate || ''}
          onDateChange={(d) => setSelectedDate(d || null)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          suggestedTags={['Vine', 'Prayer', 'Faith', 'Consecration', 'Fruit']}
          onSuggestedTagClick={(tag) => setSearchQuery(tag)}
          onResetAll={() => {
            setSearchQuery('');
            setActiveTag('All');
            setOnlyBookmarked(false);
            setSelectedDate(null);
            setSortBy('latest');
          }}
        />
      </View>

      {/* Devotionals List: ProductCardHorizontal (Template 3 Spec) */}
      <FlashList<Devotional>
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
              <MotionButton
                variant="ministry-green"
                size="md"
                icon={<RotateCcw className="w-4 h-4 text-white" />}
                label="Reset All Filters"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTag('All');
                  setOnlyBookmarked(false);
                }}
              />
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
