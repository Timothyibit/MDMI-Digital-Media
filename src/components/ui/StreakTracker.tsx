import React from 'react';
import { Flame, Calendar, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

interface StreakTrackerProps {
  variant?: 'card' | 'compact' | 'badge';
  className?: string;
  onPress?: () => void;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  variant = 'card',
  className = '',
  onPress,
}) => {
  const { user } = useAuthStore();
  const { triggerConfetti } = useUIStore();
  const streak = user?.streakCount || 1;

  // Next milestone calculation
  const nextMilestone = streak < 7 ? 7 : streak < 30 ? 30 : streak < 100 ? 100 : streak + 50;
  const progressPercent = Math.min(100, Math.round((streak / nextMilestone) * 100));

  if (variant === 'compact') {
    return (
      <div
        id="streak-tracker-compact"
        onClick={onPress}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold ${className}`}
      >
        <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
        <span className="tabular-nums">{streak}d streak</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        id="streak-tracker-badge"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 ${className}`}
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
          <Flame className="w-4 h-4 fill-amber-500" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-neutral-900 dark:text-white tabular-nums">
            {streak} Day Streak
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
            {nextMilestone - streak} days to {nextMilestone}d badge
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="streak-tracker-card"
      onClick={onPress}
      className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/25 transition-all hover:border-amber-500/40 cursor-pointer ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Daily Walk
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-4xl font-extrabold font-display-scripture text-neutral-950 dark:text-amber-100 tabular-nums"
            >
              {streak}
            </motion.span>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {streak === 1 ? 'day' : 'days active'}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerConfetti(streak >= 7 ? streak : 7);
          }}
          title="Milestone celebration"
          aria-label="Celebrate streak"
          className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 hover:scale-105 transition-transform"
        >
          <Flame className="w-6 h-6 fill-amber-500 animate-bounce" />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400 mb-1">
          <span className="flex items-center gap-1 font-medium">
            <Award className="w-3 h-3 text-amber-500" /> Next Milestone: {nextMilestone} Days
          </span>
          <span className="font-semibold tabular-nums">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
