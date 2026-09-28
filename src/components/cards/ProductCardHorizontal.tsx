import React from 'react';
import { Bookmark, Volume2, Heart, Clock, Sparkles, Edit3 } from 'lucide-react';
import { Devotional } from '../../types';

interface ProductCardHorizontalProps {
  devotional: Devotional;
  onPress: () => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
  onAudio?: (devotional: Devotional) => void;
  onEdit?: (devotional: Devotional) => void;
  className?: string;
}

export const ProductCardHorizontal: React.FC<ProductCardHorizontalProps> = ({
  devotional,
  onPress,
  onBookmark,
  isBookmarked = false,
  onAudio,
  onEdit,
  className = '',
}) => {
  const estimatedMinutes = Math.max(
    2,
    Math.ceil((devotional.body.split(/\s+/).length + (devotional.scriptureText || '').split(/\s+/).length) / 160)
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress();
        }
      }}
      className={`group relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-[10px_10px_35px_0px_rgba(0,0,0,0.05)] hover:shadow-[10px_15px_40px_0px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 cursor-pointer text-left active:scale-[0.99] ${className}`}
    >
      {/* Left Info Column (Template 3 Spec: .info) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div>
          {/* Top scripture & tag */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5E72E4]/15 text-[#3b4cb8] dark:bg-[#5E72E4]/25 dark:text-[#8be3bf]">
              {devotional.scripture}
            </span>
            {devotional.scheduledDate && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30 dark:border-amber-500/40 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                <span>{devotional.scheduledDate}</span>
              </span>
            )}
            {devotional.tags?.[0] && (
              <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                {devotional.tags[0]}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#5E72E4] transition-colors">
            {devotional.title}
          </h3>

          {/* Subtitle / Key thought excerpt */}
          {devotional.keyThought && (
            <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 line-clamp-1 italic font-serif-reading">
              “{devotional.keyThought}”
            </p>
          )}
        </div>

        {/* Stats Row (Template 3 Spec: <span> with fire icon + real reading time & likes) */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium flex-wrap">
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{estimatedMinutes} min read</span>
            </span>

            <span>•</span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{devotional.likeCount || 0}</span>
            </span>

            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">By {devotional.authorName}</span>
          </div>

          {/* Price / Category Accent */}
          <div className="flex items-center gap-2">
            {onAudio && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAudio(devotional);
                }}
                title="Play Audio"
                aria-label="Play audio"
                className="p-1.5 rounded-lg text-[#5E72E4] hover:bg-[#5E72E4]/10 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(devotional);
                }}
                title="Edit devotional & cover photo"
                aria-label="Edit devotional"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-[#5E72E4] hover:bg-[#5E72E4]/10 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {onBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(devotional.id);
                }}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                aria-label="Bookmark"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 transition-colors"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isBookmarked ? 'fill-amber-500 text-amber-500' : ''
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Image Column (Template 3 Spec: rounded thumbnail with shadow) */}
      <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-[10px_10px_35px_0px_#dedede] dark:shadow-none border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
        <img
          src={
            devotional.imageUrl ||
            'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=300&q=80'
          }
          alt={devotional.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 pointer-events-none" />
      </div>
    </div>
  );
};
