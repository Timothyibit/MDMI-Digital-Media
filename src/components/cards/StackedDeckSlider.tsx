import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Calendar, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { Devotional } from '../../types';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card-effect';

interface StackedDeckSliderProps {
  devotionals: Devotional[];
  onSelect: (devotional: Devotional) => void;
  className?: string;
}

type MeditationFilter = 'all' | 'Renewal' | 'Abiding' | 'Devotion';

export const StackedDeckSlider: React.FC<StackedDeckSliderProps> = ({
  devotionals,
  onSelect,
  className = '',
}) => {
  const [selectedTheme, setSelectedTheme] = useState<MeditationFilter>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch swipe tracking refs
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Filter devotionals based on theme if selected
  const dedupedDevotionals = useMemo(() => {
    const seen = new Set<string>();
    return (devotionals || []).filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [devotionals]);

  const filteredDevotionals = useMemo(() => {
    if (dedupedDevotionals.length === 0) return [];
    if (selectedTheme === 'all') return dedupedDevotionals;
    return dedupedDevotionals.filter((d) => {
      const text = `${d.title} ${d.tags?.join(' ') || ''} ${d.body || ''}`.toLowerCase();
      if (selectedTheme === 'Renewal') {
        return text.includes('renew') || text.includes('grace') || text.includes('morning');
      }
      if (selectedTheme === 'Abiding') {
        return text.includes('abide') || text.includes('vine') || text.includes('rest');
      }
      if (selectedTheme === 'Devotion') {
        return text.includes('devot') || text.includes('prayer') || text.includes('fire') || text.includes('consecrat');
      }
      return true;
    });
  }, [dedupedDevotionals, selectedTheme]);

  const rawList = filteredDevotionals.length > 0 ? filteredDevotionals : dedupedDevotionals;
  const activeList = useMemo(() => {
    const seen = new Set<string>();
    return rawList.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [rawList]);

  if (!activeList || activeList.length === 0) return null;

  const safeIndex = currentIndex % activeList.length;
  const currentItem = activeList[safeIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
  };

  const handleSelectDot = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Trigger swipe only if horizontal delta is dominant and > 35px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        handleNext(); // Swiped left -> next card
      } else {
        handlePrev(); // Swiped right -> previous card
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const MAX_VISIBLE = 3;
  const visibleIndices = Array.from({ length: Math.min(MAX_VISIBLE, activeList.length) }, (_, i) => {
    return (safeIndex + i) % activeList.length;
  });

  return (
    <div
      className={`relative w-full rounded-[24px] sm:rounded-[32px] bg-neutral-900 text-white p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-neutral-800 ${className}`}
    >
      {/* 1. Header Top Bar: Structured cleanly into mobile-friendly rows */}
      <div className="flex flex-col gap-3.5 mb-4 sm:mb-6">
        {/* Row A: Category badge + Counter + Always-visible Header Arrows */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Featured Meditations Deck</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Counter Badge */}
            <span className="text-[11px] font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {safeIndex + 1} / {activeList.length}
            </span>

            {/* Header Prev & Next Buttons (Fixed shrink-0, guaranteed visible on all screens) */}
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-full border border-white/15">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous card"
                title="Previous card"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next card"
                title="Next card"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row B: Title & Scripture metadata */}
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold font-display-scripture text-white tracking-tight line-clamp-1">
            {currentItem.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1">
            <span className="flex items-center gap-1 font-semibold text-blue-300">
              <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{currentItem.scripture}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>
                {currentItem.publishedAt
                  ? new Date(currentItem.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Today'}
              </span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">By {currentItem.authorName}</span>
          </div>
        </div>

        {/* Row C: Horizontally Scrollable Theme Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {(['all', 'Renewal', 'Abiding', 'Devotion'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setSelectedTheme(t);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all cursor-pointer ${
                selectedTheme === t
                  ? 'bg-[#5E72E4] text-white shadow-md shadow-[#5E72E4]/25'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              {t === 'all' ? 'All Meditations' : t}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 3D Stack Deck Container with In-Deck Floating Controls & Touch Swipe */}
      <div
        className="relative h-72 sm:h-80 md:h-88 w-full mt-1 overflow-hidden sm:overflow-visible select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating In-Deck Left Arrow (Always accessible on touch devices & desktop) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous meditation"
          title="Previous card"
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/95 active:scale-90 text-white border border-white/20 shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-transform"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Floating In-Deck Right Arrow (Always accessible on touch devices & desktop) */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next meditation"
          title="Next card"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/95 active:scale-90 text-white border border-white/20 shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-transform"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Stacked Cards Area */}
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence initial={false}>
            {visibleIndices.map((itemIdx, stackPos) => {
              const item = activeList[itemIdx];
              const isTop = stackPos === 0;
              // Responsive xOffset: smaller on mobile so it never overflows or clips
              const xOffset = stackPos * 10;
              const scale = 1 - stackPos * 0.05;
              const opacity = 1 - stackPos * 0.25;
              const zIndex = MAX_VISIBLE - stackPos;

              return (
                <motion.div
                  key={`${item.id}-${stackPos}`}
                  layout
                  initial={{ opacity: 0, x: 40, scale: 0.88 }}
                  animate={{
                    x: xOffset,
                    scale,
                    opacity,
                    zIndex,
                  }}
                  exit={{ opacity: 0, x: -70, scale: 0.82 }}
                  transition={{ type: 'spring' as const, stiffness: 280, damping: 26 }}
                  className={`absolute inset-0 max-w-xl mx-auto rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-neutral-700/80 transition-all ${
                    isTop ? 'cursor-pointer' : 'pointer-events-none'
                  }`}
                >
                  {isTop ? (
                    // Top card gets 3D interactive tilt & layer elevation
                    <CardContainer
                      containerClassName="py-0 w-full h-full block"
                      className="w-full h-full"
                    >
                      <CardBody
                        className="w-full h-full relative overflow-hidden rounded-[20px] sm:rounded-[24px] [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]"
                      >
                        {/* Background Image */}
                        <img
                          src={
                            item.imageUrl ||
                            'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1000&q=80'
                          }
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />

                        {/* Content Overlay with 3D Depth */}
                        <div
                          onClick={() => onSelect(item)}
                          className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between"
                        >
                          {/* Top Badges */}
                          <CardItem
                            translateZ={30}
                            className="flex items-center justify-between w-full"
                          >
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                              {item.tags?.[0] || 'Meditation'}
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-neutral-300 backdrop-blur-sm px-2 py-0.5 sm:py-1 rounded-lg bg-black/60 border border-white/10">
                              Swipe or Tap
                            </span>
                          </CardItem>

                          {/* Bottom Content */}
                          <div className="space-y-1.5 sm:space-y-2">
                            <CardItem
                              as="h3"
                              translateZ={50}
                              className="text-lg sm:text-2xl font-bold font-display-scripture text-white leading-tight line-clamp-2"
                            >
                              {item.title}
                            </CardItem>

                            <CardItem
                              translateZ={35}
                              className="w-full"
                            >
                              <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 font-serif-reading italic">
                                “{item.scriptureText}”
                              </p>
                            </CardItem>

                            <CardItem
                              translateZ={60}
                              className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/20 w-full"
                            >
                              <span className="text-xs font-bold text-amber-400 line-clamp-1 max-w-[140px] sm:max-w-none">
                                {item.scripture}
                              </span>
                              <span className="px-3 sm:px-4 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-black font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 shrink-0">
                                <span>Read</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </CardItem>
                          </div>
                        </div>
                      </CardBody>
                    </CardContainer>
                  ) : (
                    // Lower stacked cards (static background render)
                    <div className="relative w-full h-full">
                      <img
                        src={
                          item.imageUrl ||
                          'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1000&q=80'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between opacity-80">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 text-white w-fit border border-white/20">
                          {item.tags?.[0] || 'Meditation'}
                        </span>
                        <h3 className="text-base sm:text-xl font-bold font-display-scripture text-white line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Bottom Controls Bar: Pagination Dots + Quick Action on Mobile */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
        {/* Pagination Dots (Clickable) */}
        <div className="flex items-center gap-1.5">
          {activeList.map((item, dotIdx) => (
            <button
              key={`dot-${item.id || 'd'}-${dotIdx}`}
              type="button"
              onClick={() => handleSelectDot(dotIdx)}
              aria-label={`Go to meditation ${dotIdx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                safeIndex === dotIdx
                  ? 'w-6 bg-[#5E72E4]'
                  : 'w-2 bg-neutral-600 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>

        {/* Mobile-Friendly Quick Next/Prev label buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="text-xs font-bold text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
