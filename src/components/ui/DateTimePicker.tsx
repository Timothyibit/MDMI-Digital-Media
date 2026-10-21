import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';

export type DateTimePickerMode = 'date' | 'time' | 'datetime';
export type DateTimePickerDisplay =
  | 'default'
  | 'spinner'
  | 'calendar'
  | 'clock'
  | 'compact'
  | 'inline';

export interface DateTimePickerEvent {
  type: 'set' | 'dismissed';
  nativeEvent: {
    timestamp?: number;
    utcOffset?: number;
  };
}

export interface DateTimePickerProps {
  value: Date;
  mode?: DateTimePickerMode;
  display?: DateTimePickerDisplay;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  is24Hour?: boolean;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  themeVariant?: 'light' | 'dark';
  className?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  id?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  mode = 'date',
  display = 'default',
  onChange,
  minimumDate,
  maximumDate,
  is24Hour = false,
  minuteInterval = 1,
  className = '',
  disabled = false,
  label,
  placeholder,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(display === 'inline');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    value instanceof Date && !isNaN(value.getTime()) ? new Date(value) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    value instanceof Date && !isNaN(value.getTime()) ? new Date(value) : new Date()
  );
  const [activeTab, setActiveTab] = useState<'date' | 'time'>(
    mode === 'time' ? 'time' : 'date'
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      setSelectedDate(new Date(value));
      setCurrentMonthDate(new Date(value));
    }
  }, [value]);

  // Click outside to close if not inline
  useEffect(() => {
    if (display === 'inline') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (onChange) {
          onChange({ type: 'dismissed', nativeEvent: {} });
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, display, onChange]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(day);

    if (minimumDate && newDate < minimumDate) return;
    if (maximumDate && newDate > maximumDate) return;

    setSelectedDate(newDate);
    if (mode === 'date') {
      if (onChange) {
        onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
      }
      if (display !== 'inline') setIsOpen(false);
    } else if (mode === 'datetime') {
      setActiveTab('time');
    }
  };

  const handleSelectTime = (hours24: number, minutes: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hours24);
    newDate.setMinutes(minutes);

    setSelectedDate(newDate);
    if (onChange) {
      onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
    }
    if (display !== 'inline' && mode === 'time') {
      setIsOpen(false);
    }
  };

  const handleConfirm = () => {
    if (onChange) {
      onChange(
        { type: 'set', nativeEvent: { timestamp: selectedDate.getTime() } },
        selectedDate
      );
    }
    if (display !== 'inline') setIsOpen(false);
  };

  const formatDisplayValue = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return placeholder || 'Select date/time';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, '0');
    let ampm = '';

    if (!is24Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    const hStr = is24Hour ? String(hours).padStart(2, '0') : String(hours);

    if (mode === 'date') {
      return `${y}-${m}-${d}`;
    }
    if (mode === 'time') {
      return `${hStr}:${mins}${ampm}`;
    }
    return `${y}-${m}-${d} ${hStr}:${mins}${ampm}`;
  };

  // Month grid calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Calendar cells
  const calendarCells = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      isPrev: true,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      currentMonth: true,
      isPrev: false,
    });
  }
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({
      day: d,
      currentMonth: false,
      isPrev: false,
    });
  }

  // Time components
  const currentHours = selectedDate.getHours();
  const currentMinutes = selectedDate.getMinutes();
  const isPM = currentHours >= 12;
  const displayHours = is24Hour ? currentHours : currentHours % 12 || 12;

  const hoursOptions = is24Hour
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  const minutesOptions = Array.from(
    { length: Math.floor(60 / minuteInterval) },
    (_, i) => i * minuteInterval
  );

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button (if not inline) */}
      {display !== 'inline' && (
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-semibold flex items-center justify-between shadow-xs hover:border-[#5E72E4] dark:hover:border-[#5E72E4] transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {mode === 'time' ? (
              <Clock className="w-4 h-4 text-[#5E72E4] dark:text-[#7BDEB2] shrink-0" />
            ) : (
              <CalendarIcon className="w-4 h-4 text-[#5E72E4] dark:text-[#7BDEB2] shrink-0" />
            )}
            <span className="truncate text-neutral-900 dark:text-white font-medium">
              {formatDisplayValue(selectedDate)}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#5E72E4] dark:text-[#7BDEB2] ml-2">
            {isOpen ? 'Close' : 'Select'}
          </span>
        </button>
      )}

      {/* Picker Card Dropdown / Modal */}
      {(isOpen || display === 'inline') && (
        <div
          className={`${
            display === 'inline'
              ? 'w-full'
              : 'absolute z-50 mt-2 left-0 right-0 sm:right-auto sm:w-88 min-w-[290px] max-w-[calc(100vw-24px)] shadow-2xl rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white'
          } p-4 sm:p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Tabs if datetime */}
          {mode === 'datetime' && (
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 mb-3 text-xs font-bold border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setActiveTab('date')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'date'
                    ? 'bg-white dark:bg-neutral-900 text-[#5E72E4] dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Date</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('time')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'time'
                    ? 'bg-white dark:bg-neutral-900 text-[#5E72E4] dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time</span>
              </button>
            </div>
          )}

          {/* Date Picker View */}
          {(mode === 'date' || (mode === 'datetime' && activeTab === 'date')) && (
            <div>
              {/* Header Month / Year Navigation */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                  {MONTH_NAMES[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    aria-label="Previous month"
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonthDate(new Date())}
                    title="Current Month"
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold text-[#5E72E4] hover:bg-[#5E72E4]/10"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    aria-label="Next month"
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAYS_SHORT.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-400 py-1"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const isCurrentDay =
                    cell.currentMonth &&
                    cell.day === selectedDate.getDate() &&
                    month === selectedDate.getMonth() &&
                    year === selectedDate.getFullYear();

                  const isToday =
                    cell.currentMonth &&
                    cell.day === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!cell.currentMonth}
                      onClick={() => cell.currentMonth && handleSelectDay(cell.day)}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        !cell.currentMonth
                          ? 'text-neutral-400 dark:text-neutral-600 opacity-30 cursor-default'
                          : isCurrentDay
                          ? 'bg-[#5E72E4] text-white font-bold shadow-sm'
                          : isToday
                          ? 'border-2 border-[#5E72E4] dark:border-[#7BDEB2] text-[#5E72E4] dark:text-[#7BDEB2] hover:bg-[#5E72E4]/10 dark:hover:bg-[#5E72E4]/20 font-bold'
                          : 'text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Picker View */}
          {(mode === 'time' || (mode === 'datetime' && activeTab === 'time')) && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4 py-2 w-full">
                {/* Hours select */}
                <div className="flex-1 max-w-[90px] flex flex-col items-center">
                  <label className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Hour
                  </label>
                  <select
                    value={displayHours}
                    onChange={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (!is24Hour) {
                        if (isPM && val < 12) val += 12;
                        if (!isPM && val === 12) val = 0;
                      }
                      handleSelectTime(val, currentMinutes);
                    }}
                    className="w-full text-center p-3 sm:p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-lg outline-none focus:border-[#5E72E4] cursor-pointer shadow-xs"
                  >
                    {hoursOptions.map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-2xl font-bold font-mono text-neutral-400 mt-5">:</span>

                {/* Minutes select */}
                <div className="flex-1 max-w-[90px] flex flex-col items-center">
                  <label className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Min
                  </label>
                  <select
                    value={
                      minutesOptions.includes(currentMinutes)
                        ? currentMinutes
                        : minutesOptions[0]
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleSelectTime(currentHours, val);
                    }}
                    className="w-full text-center p-3 sm:p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-lg outline-none focus:border-[#5E72E4] cursor-pointer shadow-xs"
                  >
                    {minutesOptions.map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM / PM Toggle (if not 24 hour) */}
                {!is24Hour && (
                  <div className="flex flex-col items-center mt-5 shrink-0">
                    <div className="flex rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPM) {
                            handleSelectTime(currentHours - 12, currentMinutes);
                          }
                        }}
                        className={`px-3.5 py-3 text-xs font-bold transition-all ${
                          !isPM
                            ? 'bg-[#5E72E4] text-white shadow-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPM) {
                            handleSelectTime(currentHours + 12, currentMinutes);
                          }
                        }}
                        className={`px-3.5 py-3 text-xs font-bold transition-all ${
                          isPM
                            ? 'bg-[#5E72E4] text-white shadow-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Preset Buttons for Daily Devotions */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="block text-[10px] font-bold uppercase text-neutral-400 mb-1.5">
                  Suggested Quiet Time Hours:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '06:00 AM (Dawn)', h: 6, m: 0 },
                    { label: '07:00 AM (Morning)', h: 7, m: 0 },
                    { label: '12:00 PM (Noon)', h: 12, m: 0 },
                    { label: '08:00 PM (Night)', h: 20, m: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectTime(preset.h, preset.m)}
                      className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-[#5E72E4]/10 hover:text-[#5E72E4] text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedDate(now);
                setCurrentMonthDate(now);
                if (onChange) {
                  onChange({ type: 'set', nativeEvent: { timestamp: now.getTime() } }, now);
                }
              }}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {display !== 'inline' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onChange) onChange({ type: 'dismissed', nativeEvent: {} });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-1.5 rounded-lg bg-[#5E72E4] text-white text-xs font-bold shadow-xs hover:bg-[#4a5ec4] flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
