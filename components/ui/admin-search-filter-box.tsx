import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar,
  RotateCcw,
  Check,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export type AdminDevotionalStatus = 'all' | 'scheduled' | 'live' | 'draft';

export interface AdminDevotionalSearchFilterBoxProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: AdminDevotionalStatus;
  onStatusFilterChange: (status: AdminDevotionalStatus) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  counts?: {
    all: number;
    scheduled: number;
    live: number;
    draft: number;
  };
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

export const AdminDevotionalSearchFilterBox: React.FC<AdminDevotionalSearchFilterBoxProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  counts,
  totalCount,
  filteredCount,
  className,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (dateFilter ? 1 : 0);

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleResetFilters = () => {
    onStatusFilterChange('all');
    onDateFilterChange('');
  };

  const statusOptions: Array<{ id: AdminDevotionalStatus; label: string; count?: number }> = [
    { id: 'all', label: 'All', count: counts?.all },
    { id: 'scheduled', label: 'Scheduled Queue', count: counts?.scheduled },
    { id: 'live', label: 'Live Feed', count: counts?.live },
    { id: 'draft', label: 'Drafts', count: counts?.draft },
  ];

  return (
    <div className={cn('w-full flex flex-col gap-2.5', className)}>
      {/* Sleek Search Bar (react-native-search-component style) */}
      <div className="relative w-full flex items-center gap-2">
        <div
          className={cn(
            'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200',
            'bg-white dark:bg-neutral-900 shadow-xs',
            isFocused
              ? 'border-[#84CC16] ring-2 ring-[#84CC16]/20'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-lg transition-colors',
              isFocused
                ? 'bg-[#84CC16]/15 text-[#4D7C0F] dark:text-[#84CC16]'
                : 'text-neutral-400 dark:text-neutral-500'
            )}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
          </div>

          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search ministry teachings, scriptures, or tags..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none border-none min-w-0"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Filter Toggle Button */}
          <div className="flex items-center pl-1 border-l border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                'relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
                isFilterOpen
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : activeFilterCount > 0
                  ? 'bg-[#84CC16]/15 border border-[#84CC16]/50 text-[#4D7C0F] dark:text-[#84CC16]'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Filter Box */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg rounded-xl">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#84CC16]" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
                      Teaching Repository Filters
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="h-7 text-[11px] font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-3">
                <Separator />

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#84CC16]" />
                    <span>Publication Status</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {statusOptions.map((statusTab) => {
                      const isSelected = statusFilter === statusTab.id;
                      return (
                        <button
                          key={statusTab.id}
                          type="button"
                          onClick={() => onStatusFilterChange(statusTab.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                            isSelected
                              ? 'bg-[#84CC16] text-white shadow-xs'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{statusTab.label}</span>
                          {statusTab.count !== undefined && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.2 rounded-full font-extrabold',
                                isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                              )}
                            >
                              {statusTab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduled / Release Date Filter */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#84CC16]" />
                    <span>Scheduled / Release Date</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => onDateFilterChange(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-[#84CC16] outline-none"
                    />
                    {dateFilter && (
                      <button
                        type="button"
                        onClick={() => onDateFilterChange('')}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2 py-1"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] text-neutral-400">
                    Showing {filteredCount ?? 0} of {totalCount ?? 0} teachings
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black font-bold px-3 cursor-pointer"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
