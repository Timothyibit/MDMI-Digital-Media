import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  Volume2,
  ChevronRight,
  PenLine,
  Sparkles,
  Flame,
  BookOpen,
} from 'lucide-react';
import { useDevotionalStore, sortDevotionalsByLatest } from '../store/useDevotionalStore';
import { useUIStore } from '../store/useUIStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useAuthStore } from '../store/useAuthStore';
import { Devotional } from '../types';
import { isDevotionalLive } from '../services/schedulingService';
import { MdmiLogo } from '../components/ui/MdmiLogo';
import {
  OrganicFruitHeroCard,
  StackedDeckSlider,
  ProductCardHorizontal,
  ActivityCardBarGraph,
  TiltedCollageCard,
} from '../components/cards';
import { PaginationPageDefault } from '@/components/application/pagination/pagination';
import { AlertCard } from '@/components/ui/card-8';

interface HomeTabProps {
  onSelectDevotional: (devotional: Devotional) => void;
}

const FEED_PAGE_SIZE = 6;

export const HomeTab: React.FC<HomeTabProps> = ({ onSelectDevotional }) => {
  const { devotionals } = useDevotionalStore();
  const { setActiveTab, openVerseShare, playDevotionalAudio, openOnboarding } = useUIStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { config, getFeaturedDevotional } = useLayoutStore();
  const { user } = useAuthStore();
  const [feedPage, setFeedPage] = useState(1);

  const sortedDevotionals = React.useMemo(() => sortDevotionalsByLatest(devotionals), [devotionals]);
  const published = sortedDevotionals.filter((d) => isDevotionalLive(d));
  const rawDisplayDevotionals = published.length > 0 ? published : sortedDevotionals;
  const displayDevotionals = React.useMemo(() => {
    const seen = new Set<string>();
    return rawDisplayDevotionals.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [rawDisplayDevotionals]);

  const featured = getFeaturedDevotional ? getFeaturedDevotional(devotionals) : (displayDevotionals[0] || null);

  const totalFeedPages = Math.max(1, Math.ceil(displayDevotionals.length / FEED_PAGE_SIZE));
  const currentFeedDevotionals = displayDevotionals.slice(
    (feedPage - 1) * FEED_PAGE_SIZE,
    feedPage * FEED_PAGE_SIZE
  );

  // Determine sections to display; provide safe default if config.sections is empty or unset
  const configuredSections = config?.sections?.length
    ? config.sections
    : [
        { id: 'headerBanner', enabled: true, order: 0 },
        { id: 'featuredHero', enabled: true, order: 1 },
        { id: 'stackedDeck', enabled: true, order: 2 },
        { id: 'activityStats', enabled: true, order: 3 },
        { id: 'horizontalFeed', enabled: true, order: 4 },
        { id: 'tiltedCollage', enabled: true, order: 5 },
      ];

  const sortedSections = React.useMemo(() => {
    const seen = new Set<string>();
    return [...configuredSections]
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter((s) => {
        if (!s || !s.id || seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
  }, [configuredSections]);

  const renderSection = (id: string) => {
    switch (id) {
      case 'headerBanner':
      case 'banner':
        return (
          <View
            key="headerBanner"
            className="flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          >
            <View className="flex-row items-center gap-3.5">
              <div className="shrink-0">
                <MdmiLogo size={44} />
              </div>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-lime-500/10 text-lime-700 dark:text-lime-400">
                    Discipling to Serve
                  </span>
                  <button
                    onClick={() => openOnboarding()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E72E4]/10 hover:bg-[#5E72E4]/20 text-[#5E72E4] transition-all"
                    title="View Onboarding Welcome Screen"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>Welcome Tour</span>
                  </button>
                </View>
                <Text className="text-xl sm:text-2xl font-extrabold font-display-scripture text-neutral-900 dark:text-white tracking-tight mt-0.5">
                  The Master's Discipleship Ministries
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {config?.customWelcomeMessage ||
                    'Winning souls, maturing believers in Christ, and serving in love'}
                </Text>
              </View>
            </View>

            {user && (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 hover:border-[#5E72E4]/40 transition-all text-left shrink-0 cursor-pointer self-start sm:self-auto"
                title="View your Disciple profile"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.displayName || 'Profile'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#5E72E4]/30 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#5E72E4] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'D'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">
                    Welcome Disciple
                  </span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white truncate block max-w-[130px]">
                    {user.displayName || 'Devoted Disciple'}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-current inline" />
                    <span>{user.streakCount ?? 0} {(user.streakCount ?? 0) === 1 ? 'day streak' : 'day streak'}</span>
                  </span>
                </div>
              </button>
            )}
          </View>
        );

      case 'featuredHero':
      case 'hero':
        return featured ? (
          <div key="featuredHero">
            <OrganicFruitHeroCard
              devotional={featured}
              onRead={onSelectDevotional}
              onAudio={playDevotionalAudio}
              onShare={() => {
                openVerseShare({
                  scripture: featured.scripture,
                  scriptureText: featured.scriptureText,
                  title: featured.title,
                  author: featured.authorName,
                });
              }}
            />
          </div>
        ) : null;

      case 'stackedDeck':
      case 'deck':
        return displayDevotionals.length > 1 ? (
          <div key="stackedDeck" className="mt-2">
            <StackedDeckSlider
              devotionals={displayDevotionals.slice(0, 6)}
              onSelect={onSelectDevotional}
            />
          </div>
        ) : null;

      case 'activityStats':
      case 'activity': {
        const showReflection = config.showSpokenReflectionCard !== false;
        const showJournal = config.showPrayerJournalCard !== false;
        const hasAnyTile = showReflection || showJournal;

        return (
          <div
            key="activityStats"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
          >
            {/* Interactive 7-Day Spiritual Activity Card */}
            <div className={hasAnyTile ? 'lg:col-span-7' : 'lg:col-span-12'}>
              <ActivityCardBarGraph
                onMorePress={() => setActiveTab('profile')}
                className="h-full"
              />
            </div>

            {/* Quick Action Tiles */}
            {hasAnyTile && (
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                {/* Daily Spoken Reflection Card */}
                {showReflection && (
                  <AlertCard
                    variant="ministry-green"
                    badge="Voice Narration • Discipling to Serve"
                    icon={<Volume2 className="h-6 w-6 text-white" />}
                    title="Daily Spoken Reflection"
                    description="Instant stream-first audio for quiet time, prayer, and meditation."
                    buttonText="Listen Audio Now"
                    onButtonClick={() => featured && playDevotionalAudio(featured)}
                    className="max-w-none shadow-md h-full flex flex-col justify-between"
                  />
                )}

                {/* Prayer Journal Card */}
                {showJournal && (
                  <AlertCard
                    variant="ministry-red"
                    badge="Private Sanctuary • Ministry of Prayer"
                    icon={<PenLine className="h-6 w-6 text-white" />}
                    title="Prayer Journal"
                    description="Record what the Holy Spirit whispers during scripture reading."
                    buttonText="Open Journal"
                    onButtonClick={() => setActiveTab('journal')}
                    className="max-w-none shadow-md h-full flex flex-col justify-between"
                  />
                )}
              </div>
            )}
          </div>
        );
      }

      case 'horizontalFeed':
      case 'recent':
        return (
          <div key="horizontalFeed" className="mt-4 space-y-4">
            {/* Recent Devotionals AlertCard Header */}
            <AlertCard
              variant="ministry-dark"
              badge="Daily Bread • Discipling to Serve"
              icon={<BookOpen className="h-6 w-6 text-[#84CC16]" />}
              title="Recent Devotional Releases"
              description="Nourishing scriptural insights, exegetical reflections, and prayer guides from The Master's Discipleship Ministries."
              buttonText="View All Devotionals"
              onButtonClick={() => setActiveTab('devotionals')}
              className="max-w-none shadow-md"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentFeedDevotionals.map((devotional) => (
                <ProductCardHorizontal
                  key={devotional.id}
                  devotional={devotional}
                  onPress={() => onSelectDevotional(devotional)}
                  onBookmark={toggleBookmark}
                  isBookmarked={isBookmarked(devotional.id)}
                  onAudio={playDevotionalAudio}
                />
              ))}
            </div>

            {displayDevotionals.length > FEED_PAGE_SIZE && (
              <div className="mt-4">
                <PaginationPageDefault
                  page={feedPage}
                  total={totalFeedPages}
                  onPageChange={setFeedPage}
                />
              </div>
            )}
          </div>
        );

      case 'tiltedCollage':
      case 'collage':
        return (
          <div key="tiltedCollage" className="mt-6">
            <TiltedCollageCard
              title="The Great Commission Vision"
              message="Go therefore and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit. Matthew 28:19."
              actionText="Explore MDMI Ministry"
              onAction={() => setActiveTab('about')}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 sm:px-3">
        {sortedSections.map((section, idx) => (
          <React.Fragment key={section.id || `sec-${idx}`}>
            {renderSection(section.id)}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
};
