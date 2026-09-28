import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Share2, Volume2, ArrowRight, Pause, Play, BookOpen } from 'lucide-react';
import { Devotional } from '../../types';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card-effect';

interface OrganicFruitHeroCardProps {
  devotional: Devotional;
  onRead: (devotional: Devotional) => void;
  onAudio?: (devotional: Devotional) => void;
  onShare?: () => void;
}

type VariantType = 'lime' | 'grapes' | 'grapefruit';

const VARIANTS: VariantType[] = ['lime', 'grapes', 'grapefruit'];
const CYCLE_INTERVAL_MS = 4500;

export const OrganicFruitHeroCard: React.FC<OrganicFruitHeroCardProps> = ({
  devotional,
  onRead,
  onAudio,
  onShare,
}) => {
  const [activeVariant, setActiveVariant] = useState<VariantType>('lime');
  const [isHovered, setIsHovered] = useState(false);
  const [isPausedManually, setIsPausedManually] = useState(false);
  const [progress, setProgress] = useState(0);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const variantStyles = {
    lime: {
      gradient: 'from-[#00a510] via-[#57bc18] to-[#b8e932]',
      watermark: 'RENEWAL',
      themeColor: '#00a510',
      label: 'Renewal',
      focusTag: 'Morning Renewal & Grace',
      badgeLight: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      badgeDark: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
      activePillLight: 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20',
      activePillDark: 'bg-emerald-400 text-neutral-950 font-black shadow-md shadow-emerald-400/20',
      pillDotColor: '#10b981',
      blobRadius: '57% 51% 48% 56% / 61% 11% 68% 31%',
    },
    grapes: {
      gradient: 'from-[#25023d] via-[#4a0b77] to-[#7928ca]',
      watermark: 'ABIDING',
      themeColor: '#4a0b77',
      label: 'Abiding',
      focusTag: 'Abiding Deep in the Vine',
      badgeLight: 'bg-purple-50 text-purple-900 border-purple-300',
      badgeDark: 'bg-purple-950/70 text-purple-200 border-purple-700/60',
      activePillLight: 'bg-purple-900 text-white shadow-md shadow-purple-950/20',
      activePillDark: 'bg-purple-300 text-neutral-950 font-black shadow-md shadow-purple-300/20',
      pillDotColor: '#a855f7',
      blobRadius: '57% 51% 48% 52% / 39% 11% 68% 62%',
    },
    grapefruit: {
      gradient: 'from-[#ff512f] via-[#dd2476] to-[#ff4444]',
      watermark: 'DEVOTION',
      themeColor: '#dd2476',
      label: 'Devotion',
      focusTag: 'Devotion & Kingdom Fire',
      badgeLight: 'bg-rose-50 text-rose-900 border-rose-300',
      badgeDark: 'bg-rose-950/70 text-rose-200 border-rose-700/60',
      activePillLight: 'bg-rose-800 text-white shadow-md shadow-rose-950/20',
      activePillDark: 'bg-rose-400 text-neutral-950 font-black shadow-md shadow-rose-400/20',
      pillDotColor: '#f43f5e',
      blobRadius: '59% 5% 44% 51% / 48% 11% 68% 31%',
    },
  };

  const current = variantStyles[activeVariant];

  // Automatic Looping Animation between Renewal, Abiding, and Devotion
  useEffect(() => {
    if (isHovered || isPausedManually) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now() - (progress / 100) * CYCLE_INTERVAL_MS;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / CYCLE_INTERVAL_MS) * 100);
      setProgress(currentProgress);

      if (elapsed >= CYCLE_INTERVAL_MS) {
        setActiveVariant((prev) => {
          const currentIndex = VARIANTS.indexOf(prev);
          const nextIndex = (currentIndex + 1) % VARIANTS.length;
          return VARIANTS[nextIndex];
        });
        startTimeRef.current = Date.now();
        setProgress(0);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered, isPausedManually, activeVariant]);

  const handleSelectVariant = (v: VariantType) => {
    setActiveVariant(v);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  return (
    <CardContainer
      containerClassName="py-0 w-full block overflow-visible"
      className="w-full h-auto"
    >
      <CardBody className="w-full h-auto relative overflow-hidden rounded-[28px] sm:rounded-[32px] bg-white dark:bg-neutral-900 shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-neutral-200/90 dark:border-neutral-800 transition-all duration-300 [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]">
        {/* Top Edge Auto-Loop Ambient Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 z-30 overflow-hidden">
          <div
            className="h-full transition-all duration-75 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: current.pillDotColor,
            }}
          />
        </div>

        {/* Organic Morphing Shape Backdrop with Layered Blur */}
        <div
          className={`absolute -top-12 -right-12 md:-right-6 w-64 sm:w-96 md:w-[440px] h-64 sm:h-96 md:h-[440px] z-0 pointer-events-none opacity-20 dark:opacity-35 transition-all duration-1000 ease-in-out bg-gradient-to-tr ${current.gradient} blur-2xl`}
          style={{
            borderRadius: current.blobRadius,
          }}
        />

        <div
          role="region"
          aria-label="Daily Scripture Anchor Carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative z-10 p-5 sm:p-7 md:p-9 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-8"
        >
          {/* Left Content Column */}
          <div className="flex-1 max-w-2xl flex flex-col justify-between">
            <div>
              {/* Header: "Renewal, Abiding, Devotion" Pills with 3D Float */}
              <CardItem
                translateZ={35}
                className="w-full flex items-center justify-between gap-2 mb-4 sm:mb-5"
              >
                <nav aria-label="Devotional Themes" className="w-full sm:w-auto">
                  <ul className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 list-none p-0 m-0">
                    {VARIANTS.map((v) => {
                      const isActive = activeVariant === v;
                      const vStyle = variantStyles[v];
                      return (
                        <li key={v}>
                          <button
                            type="button"
                            onClick={() => handleSelectVariant(v)}
                            aria-pressed={isActive}
                            className={`relative flex items-center gap-1.5 text-xs font-black tracking-wide uppercase transition-all duration-300 px-3 sm:px-3.5 py-1.5 rounded-[12px] min-h-[34px] cursor-pointer ${
                              isActive
                                ? `dark:${vStyle.activePillDark} ${vStyle.activePillLight}`
                                : 'text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 dark:text-neutral-300 dark:hover:text-white dark:bg-neutral-800/90 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full inline-block transition-transform"
                              style={{
                                backgroundColor: isActive ? 'currentColor' : vStyle.pillDotColor,
                              }}
                            />
                            <span>{vStyle.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Auto Loop Toggle Control */}
                <button
                  type="button"
                  onClick={() => setIsPausedManually(!isPausedManually)}
                  title={isPausedManually ? 'Resume automatic theme loop' : 'Pause automatic theme loop'}
                  aria-label={isPausedManually ? 'Resume loop' : 'Pause loop'}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-xs shrink-0"
                >
                  {isPausedManually ? (
                    <>
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Auto Loop</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-2.5 h-2.5" />
                      <span className="opacity-75">Looping</span>
                    </>
                  )}
                </button>
              </CardItem>

              {/* Dynamic Spiritual Focus Badge in 3D Layer */}
              <CardItem
                translateZ={30}
                className="w-fit"
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 border transition-colors duration-300 ${
                    activeVariant === 'lime'
                      ? `${variantStyles.lime.badgeLight} dark:${variantStyles.lime.badgeDark}`
                      : activeVariant === 'grapes'
                      ? `${variantStyles.grapes.badgeLight} dark:${variantStyles.grapes.badgeDark}`
                      : `${variantStyles.grapefruit.badgeLight} dark:${variantStyles.grapefruit.badgeDark}`
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{current.focusTag}</span>
                </div>
              </CardItem>

              {/* Devotional Headline with 3D Depth */}
              <CardItem
                as="h1"
                translateZ={50}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display-scripture text-neutral-900 dark:text-white leading-tight tracking-tight mt-1"
              >
                {devotional.title}
              </CardItem>

              {/* Scripture Quote Excerpt in Raised Floating Card */}
              <CardItem
                translateZ={40}
                className="w-full mt-3.5"
              >
                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/90 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 shadow-xs backdrop-blur-sm">
                  <p className="text-xs sm:text-sm md:text-base font-serif-reading italic text-neutral-800 dark:text-neutral-100 line-clamp-3 leading-relaxed">
                    “{devotional.scriptureText}”
                  </p>
                </div>
              </CardItem>

              {/* Scripture Reference and Author */}
              <CardItem
                translateZ={30}
                className="mt-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>{devotional.scripture}</span>
                <span>•</span>
                <span>By {devotional.authorName}</span>
              </CardItem>
            </div>

            {/* Action Buttons with 3D Elevation */}
            <CardItem
              translateZ={55}
              className="mt-5 sm:mt-6 pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3 w-full"
            >
              <button
                type="button"
                id="organic-hero-read-btn"
                onClick={() => onRead(devotional)}
                className="px-5 sm:px-6 py-2.5 rounded-[22px] bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Read Devotional</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onAudio && (
                <button
                  type="button"
                  id="organic-hero-audio-btn"
                  onClick={() => onAudio(devotional)}
                  className="px-4 sm:px-5 py-2.5 rounded-[22px] border border-neutral-300 dark:border-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Listen Audio</span>
                </button>
              )}

              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  aria-label="Share verse"
                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </CardItem>
          </div>

          {/* Right Floating 3D Artwork Plaque */}
          <div className="relative flex flex-col items-center justify-center md:min-w-[220px] lg:min-w-[260px] self-center md:self-auto w-full md:w-auto">
            {/* Watermark Reflection */}
            <CardItem
              translateZ={20}
              className="hidden md:block uppercase text-4xl lg:text-5xl font-black tracking-widest text-neutral-900/10 dark:text-white/10 select-none transition-all duration-700 text-center"
            >
              {current.watermark}
            </CardItem>

            {/* Elevated 3D Thumbnail Card */}
            <CardItem
              translateZ={65}
              className="mt-2 w-full max-w-[280px] sm:max-w-[320px] md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/95 dark:border-neutral-800 bg-neutral-900 group cursor-pointer"
              onClick={() => onRead(devotional)}
            >
              <div className="relative w-full h-36 sm:h-44 md:h-full overflow-hidden">
                <img
                  src={
                    devotional.imageUrl ||
                    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={devotional.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    {current.label} Focus
                  </span>
                  <p className="text-xs font-bold line-clamp-1">
                    {devotional.title}
                  </p>
                </div>
              </div>
            </CardItem>
          </div>
        </div>
      </CardBody>
    </CardContainer>
  );
};
