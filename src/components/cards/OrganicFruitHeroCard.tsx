import React, { useState, useEffect } from 'react';
import { Sparkles, Share2, Volume2, ArrowRight, BookOpen, Video, Calendar } from 'lucide-react';
import { Devotional } from '../../types';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card-effect';

interface OrganicFruitHeroCardProps {
  devotional: Devotional;
  onRead: (devotional: Devotional) => void;
  onAudio?: (devotional: Devotional) => void;
  onShare?: () => void;
}

const COLOR_GRADIENTS = [
  {
    gradient: 'from-[#072412] via-[#0E3D1E] to-[#14532D]',
    glow: 'rgba(16, 185, 129, 0.25)',
    blobRadius: '57% 51% 48% 56% / 61% 11% 68% 31%',
  },
  {
    gradient: 'from-[#21043C] via-[#3B0764] to-[#4C0B7F]',
    glow: 'rgba(168, 85, 247, 0.25)',
    blobRadius: '57% 51% 48% 52% / 39% 11% 68% 62%',
  },
  {
    gradient: 'from-[#4C0519] via-[#700C28] to-[#881337]',
    glow: 'rgba(244, 63, 94, 0.25)',
    blobRadius: '59% 5% 44% 51% / 48% 11% 68% 31%',
  },
  {
    gradient: 'from-[#0F172A] via-[#1E293B] to-[#0A2540]',
    glow: 'rgba(59, 130, 246, 0.25)',
    blobRadius: '52% 48% 60% 40% / 45% 55% 45% 55%',
  },
];

const GRADIENT_INTERVAL_MS = 5000;

export const OrganicFruitHeroCard: React.FC<OrganicFruitHeroCardProps> = ({
  devotional,
  onRead,
  onAudio,
  onShare,
}) => {
  const [gradientIndex, setGradientIndex] = useState(0);

  // Smooth periodic cycling of the background ambient color gradient without changing any text
  useEffect(() => {
    const timer = setInterval(() => {
      setGradientIndex((prev) => (prev + 1) % COLOR_GRADIENTS.length);
    }, GRADIENT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const currentGradient = COLOR_GRADIENTS[gradientIndex];

  return (
    <CardContainer
      containerClassName="py-0 w-full block overflow-visible"
      className="w-full h-auto"
    >
      <CardBody className="w-full h-auto relative overflow-hidden rounded-[26px] sm:rounded-[32px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.7)] border border-slate-200/90 dark:border-neutral-800 transition-all duration-300 [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]">
        {/* Organic Morphing Shape Backdrops with Layered Blur - Changing color gradient */}
        <div
          className={`absolute -top-16 -right-16 md:-right-8 w-72 sm:w-96 md:w-[460px] h-72 sm:h-96 md:h-[460px] z-0 pointer-events-none opacity-20 dark:opacity-35 transition-all duration-1000 ease-in-out bg-gradient-to-tr ${currentGradient.gradient} blur-3xl`}
          style={{
            borderRadius: currentGradient.blobRadius,
          }}
        />
        <div
          className={`absolute -bottom-16 -left-16 w-56 sm:w-72 h-56 sm:h-72 z-0 pointer-events-none opacity-15 dark:opacity-25 transition-all duration-1000 ease-in-out bg-gradient-to-br ${currentGradient.gradient} blur-3xl`}
          style={{
            borderRadius: currentGradient.blobRadius,
          }}
        />

        <div className="relative z-10 p-5 sm:p-7 md:p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6 md:gap-8">
          {/* Left Content Column */}
          <div className="flex-1 max-w-2xl flex flex-col justify-between">
            <div>
              {/* Mobile App Header Badge */}
              <CardItem
                translateZ={30}
                className="w-fit flex items-center gap-2 mb-3"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-lime-500/10 dark:bg-lime-500/15 text-lime-700 dark:text-lime-400 border border-lime-500/25">
                  <Sparkles className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
                  <span>Daily Devotional</span>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 px-2">
                  <Calendar className="w-3 h-3 text-neutral-400" />
                  <span>
                    {devotional.publishedAt
                      ? new Date(devotional.publishedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Today'}
                  </span>
                </div>
              </CardItem>

              {/* Devotional Headline with 3D Depth */}
              <CardItem
                as="h1"
                translateZ={50}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display-scripture text-neutral-900 dark:text-white leading-tight tracking-tight"
              >
                {devotional.title}
              </CardItem>

              {/* Scripture Quote Excerpt in Raised Floating Card - Mobile UX styling */}
              <CardItem
                translateZ={40}
                className="w-full mt-3.5"
              >
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-neutral-100/90 dark:from-[#111A2E] dark:via-[#090F1C] dark:to-[#03060B] border border-slate-200/90 dark:border-slate-700/60 shadow-xs backdrop-blur-sm">
                  <p className="text-xs sm:text-sm md:text-base font-serif-reading italic text-neutral-900 dark:text-neutral-100 line-clamp-3 leading-relaxed font-medium">
                    “{devotional.scriptureText}”
                  </p>
                </div>
              </CardItem>

              {/* Scripture Reference and Author */}
              <CardItem
                translateZ={30}
                className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex-wrap"
              >
                <div className="flex items-center gap-1.5 text-primary">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{devotional.scripture}</span>
                </div>
                <span>•</span>
                <span>By {devotional.authorName}</span>
              </CardItem>
            </div>

            {/* Action Buttons with Mobile-Friendly Touch Targets */}
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

              {devotional.videoUrl && (
                <button
                  type="button"
                  onClick={() => onRead(devotional)}
                  className="px-4 py-2.5 rounded-[22px] border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-red-600" />
                  <span>Watch Video</span>
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

          {/* Right Floating Artwork Plaque - Mobile App Card Thumbnail */}
          <div className="relative flex flex-col items-center justify-center md:min-w-[200px] lg:min-w-[240px] self-center md:self-auto w-full md:w-auto">
            <CardItem
              translateZ={60}
              className="w-full max-w-[280px] sm:max-w-[320px] md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/95 dark:border-neutral-800 bg-neutral-900 group cursor-pointer"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-lime-400">
                    <BookOpen className="w-3 h-3" />
                    <span>MDMI Daily Word</span>
                  </div>
                  <p className="text-xs font-bold line-clamp-1 mt-0.5">
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
