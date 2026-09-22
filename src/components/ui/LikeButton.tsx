import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useDevotionalStore } from '../../store/useDevotionalStore';
import { useAuthStore } from '../../store/useAuthStore';

interface LikeButtonProps {
  devotionalId: string;
  count: number;
  variant?: 'compact' | 'standard' | 'pill';
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  devotionalId,
  count,
  variant = 'standard',
  className = '',
}) => {
  const { likedIds, likeDevotional } = useDevotionalStore();
  const { user } = useAuthStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const isLiked = likedIds.includes(devotionalId);

  const handlePress = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    // Haptic vibration feedback if supported
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {
        // vibration unsupported
      }
    }

    likeDevotional(devotionalId, user?.uid || 'guest');
  };

  if (variant === 'compact') {
    return (
      <button
        id={`like-btn-${devotionalId}`}
        onClick={handlePress}
        aria-label={isLiked ? 'Unlike devotional' : 'Like devotional'}
        className={`group flex items-center gap-1.5 text-xs transition-colors ${
          isLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
        } ${className}`}
      >
        <motion.div
          animate={isAnimating ? { scale: [1, 1.45, 0.9, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 450, damping: 14 }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'}`} />
        </motion.div>
        <span className="font-semibold tabular-nums">{count}</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        id={`like-btn-pill-${devotionalId}`}
        onClick={handlePress}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
          isLiked
            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
        } ${className}`}
      >
        <motion.div
          animate={isAnimating ? { scale: [1, 1.5, 0.85, 1], rotate: [0, -15, 15, 0] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'}`} />
        </motion.div>
        <span className="tabular-nums">{count} {count === 1 ? 'amen' : 'amens'}</span>
      </button>
    );
  }

  return (
    <button
      id={`like-btn-std-${devotionalId}`}
      onClick={handlePress}
      className={`relative p-2.5 rounded-full transition-colors flex items-center justify-center ${
        isLiked
          ? 'bg-rose-500/10 text-rose-500'
          : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-400'
      } ${className}`}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.6, 0.8, 1.1, 1] } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 stroke-rose-500' : 'stroke-current'}`} />
      </motion.div>
    </button>
  );
};
