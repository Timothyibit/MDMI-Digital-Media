import React from 'react';
import { Calendar, Clock, Globe, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { DateTimePicker } from '../ui/DateTimePicker';
import { COMMON_TIMEZONES, formatScheduledSummary, computeIsoFromZonedDateTime } from '../../services/schedulingService';

interface ScheduledPublishingConfigProps {
  scheduledDate: string; // YYYY-MM-DD
  setScheduledDate: (date: string) => void;
  scheduledTime: string; // HH:mm
  setScheduledTime: (time: string) => void;
  scheduledTimezone: string; // "user_local" or IANA timezone
  setScheduledTimezone: (tz: string) => void;
  className?: string;
}

export const ScheduledPublishingConfig: React.FC<ScheduledPublishingConfigProps> = ({
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  scheduledTimezone,
  setScheduledTimezone,
  className = '',
}) => {
  const isUserLocal = scheduledTimezone === 'user_local';
  const effectiveTime = scheduledTime || '06:00';
  const effectiveTimezone = scheduledTimezone || 'Africa/Lagos';

  const summary = formatScheduledSummary(
    scheduledDate,
    effectiveTime,
    effectiveTimezone
  );

  const handleDateChange = (_event: any, date?: Date) => {
    if (date && !isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setScheduledDate(`${y}-${m}-${d}`);
    }
  };

  const QUICK_TIME_PRESETS = [
    { label: '06:00 AM (Dawn)', time: '06:00' },
    { label: '07:00 AM (Morning)', time: '07:00' },
    { label: '12:00 PM (Noon)', time: '12:00' },
    { label: '08:00 PM (Night)', time: '20:00' },
  ];

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-900 shadow-xs space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Schedule Publishing Time
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
              Choose when this devotional goes live for readers around the world
            </p>
          </div>
        </div>

        {scheduledDate && (
          <button
            type="button"
            onClick={() => {
              setScheduledDate('');
              setScheduledTime('06:00');
              setScheduledTimezone('Africa/Lagos');
            }}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline self-start sm:self-auto transition-colors"
          >
            Clear Schedule
          </button>
        )}
      </div>

      {/* Date & Time Picker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#5E72E4] dark:text-[#7BDEB2]" />
            <span>Publishing Date</span>
          </label>
          <DateTimePicker
            value={
              scheduledDate && !isNaN(new Date(scheduledDate + 'T00:00:00').getTime())
                ? new Date(scheduledDate + 'T00:00:00')
                : new Date()
            }
            mode="date"
            onChange={handleDateChange}
          />
        </div>

        {/* Time Selector */}
        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Release Time (24h or AM/PM)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={effectiveTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#5E72E4]/40 focus:border-[#5E72E4] dark:focus:border-[#7BDEB2] shadow-xs [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mr-0.5">Presets:</span>
            {QUICK_TIME_PRESETS.map((preset) => (
              <button
                key={preset.time}
                type="button"
                onClick={() => setScheduledTime(preset.time)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  effectiveTime === preset.time
                    ? 'bg-[#5E72E4] text-white border-[#5E72E4] shadow-xs dark:bg-[#5E72E4] dark:border-[#5E72E4]'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timezone Configuration Section */}
      <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Delivery Time Zone Mode</span>
          </label>
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            {isUserLocal ? 'Rolling Local' : 'Simultaneous'}
          </span>
        </div>

        {/* Segmented Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setScheduledTimezone('user_local')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              isUserLocal
                ? 'border-[#5E72E4] dark:border-[#7BDEB2] bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 ring-1 ring-[#5E72E4] dark:ring-[#7BDEB2] shadow-xs'
                : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Globe className={`w-3.5 h-3.5 ${isUserLocal ? 'text-[#5E72E4] dark:text-[#7BDEB2]' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span>Per User Time Zone</span>
              </span>
              {isUserLocal && <CheckCircle2 className="w-4 h-4 text-[#5E72E4] dark:text-[#7BDEB2]" />}
            </div>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-snug">
              Triggers at <span className="font-bold text-[#5E72E4] dark:text-[#7BDEB2]">{effectiveTime}</span> on{' '}
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{scheduledDate || 'scheduled date'}</span> as each disciple's local clock reaches it around the globe.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isUserLocal) {
                setScheduledTimezone('Africa/Lagos');
              }
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              !isUserLocal
                ? 'border-[#5E72E4] dark:border-[#7BDEB2] bg-[#5E72E4]/10 dark:bg-[#5E72E4]/20 ring-1 ring-[#5E72E4] dark:ring-[#7BDEB2] shadow-xs'
                : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${!isUserLocal ? 'text-[#5E72E4] dark:text-[#7BDEB2]' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span>Specific Global Time Zone</span>
              </span>
              {!isUserLocal && <CheckCircle2 className="w-4 h-4 text-[#5E72E4] dark:text-[#7BDEB2]" />}
            </div>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-snug">
              Triggers simultaneously for all disciples worldwide when the exact hour arrives in the chosen timezone.
            </p>
          </button>
        </div>

        {/* Timezone Dropdown (if not user_local) */}
        {!isUserLocal && (
          <div className="pt-1">
            <label className="block text-[11px] font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              Select Anchor Time Zone:
            </label>
            <select
              value={effectiveTimezone}
              onChange={(e) => setScheduledTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#5E72E4]/40 focus:border-[#5E72E4] dark:focus:border-[#7BDEB2] shadow-xs"
            >
              {COMMON_TIMEZONES.filter((tz) => tz.value !== 'user_local').map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Real-Time Live Status Feedback Card */}
      {scheduledDate ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 dark:border-amber-500/40 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950 dark:text-amber-100">
                {summary.title}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/30 dark:border-amber-400/40">
                {summary.isPast ? 'Ready to Auto-Publish' : 'Queued'}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 mt-0.5 font-medium">
              {summary.subtitle}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
          <span>No schedule set. Will save as draft or publish immediately upon submission.</span>
        </div>
      )}
    </div>
  );
};
