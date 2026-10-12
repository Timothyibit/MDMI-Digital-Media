import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';

interface TiltedCollageCardProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const TiltedCollageCard: React.FC<TiltedCollageCardProps> = ({
  title = "The Master's Discipleship Ministries",
  message = "Winning souls, maturing believers in Christ, and sending laborers into the harvest field.",
  actionText = "Join the Fellowship",
  onAction,
  className = '',
}) => {
  const images = [
    {
      url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80',
      rotate: 'rotate-6',
      offset: '-translate-y-2',
    },
    {
      url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      rotate: '-rotate-6',
      offset: 'translate-y-3',
    },
    {
      url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=400&q=80',
      rotate: 'rotate-12',
      offset: '-translate-y-4',
    },
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FFFDF5] via-[#FEF3C7] to-[#FDE68A] text-[#3D2314] dark:from-[#1C0E03] dark:via-[#261304] dark:to-[#0D0501] dark:text-white border border-amber-300/80 dark:border-amber-500/40 shadow-[0_12px_36px_rgba(245,158,11,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 md:p-10 transition-all duration-300 ${className}`}
    >
      {/* Background Tilted Image Collage (Template 5 Spec) */}
      <div className="absolute -top-6 -right-6 md:right-8 flex items-center gap-3 opacity-30 dark:opacity-20 pointer-events-none select-none">
        {images.map((img, i) => (
          <div
            key={i}
            className={`w-28 sm:w-36 h-36 sm:h-48 rounded-[24px] overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.25)] border-2 border-white/60 dark:border-neutral-700 transform ${img.rotate} ${img.offset} transition-transform hover:scale-105`}
          >
            <img src={img.url} alt="Collage" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600/15 dark:bg-amber-500/20 border border-amber-600/35 dark:border-amber-500/40 text-[#78350F] dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Globe className="w-3.5 h-3.5" />
          <span>The Great Commission</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-[#3D2314] dark:text-white leading-tight">
          {title}
        </h3>

        <p className="mt-3 text-xs sm:text-sm text-[#5C2304] dark:text-amber-100/90 leading-relaxed font-sans font-medium">
          {message}
        </p>

        {onAction && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onAction}
              className="px-6 py-3 rounded-[16px] bg-[#3D2314] hover:bg-[#52301B] dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-[#3D2314] text-sm font-black shadow-lg active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
