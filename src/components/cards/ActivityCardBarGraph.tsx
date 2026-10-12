import React, { useState, useEffect } from 'react';
import { MoreVertical, ArrowUpRight, ArrowDownRight, Flame, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

interface ActivityCardBarGraphProps {
  className?: string;
  onMorePress?: () => void;
}

export const ActivityCardBarGraph: React.FC<ActivityCardBarGraphProps> = ({
  className = '',
  onMorePress,
}) => {
  const { user, getWeeklyActivity } = useAuthStore();
  const { triggerConfetti } = useUIStore();
  const streak = user?.streakCount ?? 0;

  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real synchronized weekly reading activity from store and Firestore
  const { days: weekData, totalMinutes, changePercent } = getWeeklyActivity();

  // Find max minutes to scale bars dynamically
  const maxDayMinutes = Math.max(...weekData.map((d) => d.minutes), 25);

  // Gradient hue levels (Template 4 Spec)
  const getHue = (val: number, max: number) => {
    if (val === 0) return 210; // Slate/Neutral
    const frac = val / max;
    if (frac > 0.8) return 153; // Green / Emerald
    if (frac > 0.5) return 223; // Blue
    if (frac > 0.2) return 253; // Indigo/Purple
    return 33; // Amber/Gold
  };

  const isPositiveChange = changePercent >= 0;

  return (
    <div
      className={`rounded-[24px] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#080E1B] dark:via-[#101C33] dark:to-[#04070D] border border-slate-200/90 dark:border-neutral-800 shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Header (Template 4 Spec: activity__header) */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.displayName || 'You'}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            </div>
          )}
          <div>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white block leading-tight">
              Spiritual Walk & Activity
            </span>
            {user?.displayName && (
              <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
                {user.displayName}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerConfetti(streak);
            if (onMorePress) onMorePress();
          }}
          title="Celebrate streak"
          aria-label="Celebrate streak"
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        {/* Summary (Template 4 Spec: activity__summary) */}
        <div className="grid grid-cols-2 items-center mb-6">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold font-display-scripture text-neutral-950 dark:text-white tabular-nums leading-none">
              {streak} <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">{streak === 1 ? 'Day' : 'Days'}</span>
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 font-medium">
              {totalMinutes} min in God's Word this week
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={`flex items-center gap-1 text-sm font-bold ${
                isPositiveChange
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              <span>{isPositiveChange ? `+${changePercent}%` : `${changePercent}%`}</span>
              {isPositiveChange ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
            <span className="text-[11px] text-neutral-400">vs last 7 days</span>
          </div>
        </div>

        {/* 7-Day Bar Graph (Template 4 Spec: activity__graph) */}
        <div className="flex items-end justify-between gap-2 h-44 pt-6 px-1">
          {weekData.map((item, idx) => {
            const fraction = item.minutes > 0 ? Math.min(1, item.minutes / maxDayMinutes) : 0;
            const hue = getHue(item.minutes, maxDayMinutes);
            const barHeightPercent = animated
              ? item.minutes > 0
                ? Math.max(16, Math.round(fraction * 100))
                : 8
              : 8;

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setActiveTooltip(idx)}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(idx)}
              >
                {/* Floating Tooltip (Template 4 Spec: activity__tip) */}
                <div
                  className={`absolute -top-9 z-20 px-2.5 py-1 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold shadow-lg pointer-events-none transition-all duration-200 whitespace-nowrap ${
                    activeTooltip === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  {item.minutes > 0 ? `${item.minutes} min read` : 'No reading yet'}
                </div>

                {/* Vertical Bar Outer & Inner Track */}
                <div className="relative w-3 sm:w-3.5 h-32 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex flex-col justify-end items-center">
                  <div
                    className="w-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      height: `${barHeightPercent}%`,
                      background:
                        item.minutes > 0
                          ? `linear-gradient(to top, hsl(${hue}, 90%, 45%), hsl(${hue}, 90%, 65%))`
                          : 'transparent',
                    }}
                  />
                </div>

                {/* Floating Knob on top of the bar */}
                <div
                  className="w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm mt-1 transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor:
                      item.minutes > 0
                        ? `hsl(${hue}, 90%, 55%)`
                        : '#cbd5e1',
                  }}
                />

                {/* Day Label */}
                <span
                  className={`text-[11px] font-bold mt-2 uppercase tracking-wider ${
                    item.isToday
                      ? 'text-emerald-600 dark:text-emerald-400 font-black'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

