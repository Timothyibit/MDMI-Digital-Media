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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FB6340]/10 border border-[#FB6340]/25 text-[#FB6340] text-xs font-bold ${className}`}
      >
        <Flame className="w-4 h-4 fill-[#FB6340] text-[#FB6340] animate-pulse" />
        <span className="tabular-nums">{streak}d streak</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        id="streak-tracker-badge"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FB6340]/10 border border-[#FB6340]/25 ${className}`}
      >
        <div className="w-7 h-7 rounded-lg bg-[#FB6340]/20 flex items-center justify-center text-[#FB6340]">
          <Flame className="w-4 h-4 fill-[#FB6340]" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-[#172B4D] dark:text-white tabular-nums">
            {streak} Day Streak
          </div>
          <div className="text-[10px] text-[#525F7F] dark:text-neutral-400">
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
      className={`relative overflow-hidden rounded-lg p-5 bg-white dark:bg-neutral-900 border border-[#E9ECEF] dark:border-neutral-800 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(50,50,93,0.12)] transition-all cursor-pointer ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB6340] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#FB6340]" /> Daily Walk
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-4xl font-extrabold font-display-scripture text-[#172B4D] dark:text-white tabular-nums"
            >
              {streak}
            </motion.span>
            <span className="text-xs font-semibold text-[#525F7F] dark:text-neutral-400">
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
          className="w-11 h-11 rounded-lg bg-[#FB6340]/15 border border-[#FB6340]/30 flex items-center justify-center text-[#FB6340] hover:scale-105 transition-transform"
        >
          <Flame className="w-6 h-6 fill-[#FB6340] animate-bounce" />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-[#525F7F] dark:text-neutral-400 mb-1.5">
          <span className="flex items-center gap-1 font-semibold">
            <Award className="w-3.5 h-3.5 text-[#FB6340]" /> Next Milestone: {nextMilestone} Days
          </span>
          <span className="font-bold tabular-nums text-[#172B4D] dark:text-neutral-200">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#E9ECEF] dark:bg-neutral-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#FB6340] to-[#fbb140] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
