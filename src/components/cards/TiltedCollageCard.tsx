import React from 'react';
import { ArrowRight, Globe, Users, HeartHandshake } from 'lucide-react';

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
      className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-6 sm:p-8 md:p-10 ${className}`}
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Globe className="w-3.5 h-3.5" />
          <span>The Great Commission</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold font-display-scripture text-neutral-900 dark:text-white leading-tight">
          {title}
        </h3>

        <p className="mt-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
          {message}
        </p>

        {onAction && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onAction}
              className="px-6 py-3 rounded-[16px] bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-bold shadow-lg active:scale-95 transition-all inline-flex items-center gap-2"
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
