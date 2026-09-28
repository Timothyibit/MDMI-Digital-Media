import React from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  LayoutTemplate,
  Star,
  Check,
} from 'lucide-react';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useDevotionalStore } from '../../store/useDevotionalStore';

export const AdminLayoutManager: React.FC = () => {
  const {
    config,
    toggleSection,
    moveSection,
    setFeaturedDevotional,
    setHeroStyle,
    updateConfig,
  } = useLayoutStore();
  const { devotionals } = useDevotionalStore();

  const uniqueDevotionals = React.useMemo(() => {
    const seen = new Set<string>();
    return devotionals.filter((d) => {
      if (!d || !d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [devotionals]);

  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-5 rounded-xl border border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <LayoutTemplate className="w-5 h-5 text-[#5E72E4]" />
          <h3 className="font-bold text-base text-[#172B4D] dark:text-white">
            Home Page Layout & Template Architecture
          </h3>
        </div>
        <p className="text-xs text-[#525F7F] dark:text-neutral-400">
          Control the structure, sequence, and visibility of components across the home screen.
        </p>
      </div>

      {/* Featured Section Customization */}
      <div className="p-5 sm:p-6 rounded-xl border border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
            Featured Hero Devotional Customization
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Active Featured Devotional
            </label>
            <select
              value={config.featuredDevotionalId}
              onChange={(e) => setFeaturedDevotional(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
            >
              <option value="latest">⚡ Automatically Most Recent Live Devotional</option>
              {uniqueDevotionals.map((d, idx) => (
                <option key={`opt-layout-${d.id}-${idx}`} value={d.id}>
                  {d.title} ({d.scripture})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Overrides the daily hero card with any highlighted ministry revelation
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Hero Card Visual Template Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['organic', 'argon', 'classic', 'modern'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setHeroStyle(style)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                    config.heroCardStyle === style
                      ? 'bg-[#5E72E4] text-white border-[#5E72E4] shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Ministry Banner Motto */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
            Top Banner Welcome / Ministry Motto
          </label>
          <input
            type="text"
            value={config.customWelcomeMessage || ''}
            onChange={(e) => updateConfig({ customWelcomeMessage: e.target.value })}
            placeholder="e.g. Winning souls, maturing believers in Christ..."
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:border-[#5E72E4]"
          />
        </div>
      </div>

      {/* Sections Reordering & Toggle List */}
      <div className="p-5 sm:p-6 rounded-xl border border-[#E9ECEF] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5E72E4]" />
            <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
              Page Section Order & Toggles
            </h4>
          </div>
          <span className="text-[11px] text-neutral-400">
            Drag or use arrows to adjust sequence
          </span>
        </div>

        <div className="space-y-2.5">
          {sortedSections.map((section, idx) => (
            <div
              key={section.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                section.enabled
                  ? 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 shadow-xs'
                  : 'bg-neutral-100/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#5E72E4]/10 text-[#5E72E4] font-bold text-xs flex items-center justify-center font-mono shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h5 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {section.label}
                  </h5>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSection(section.id, 'up')}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 transition-all"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={idx === sortedSections.length - 1}
                  onClick={() => moveSection(section.id, 'down')}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 transition-all"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    section.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                  }`}
                >
                  {section.enabled ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
