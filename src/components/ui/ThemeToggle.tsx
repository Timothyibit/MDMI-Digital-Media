import React from 'react';
import { Sun, Moon, BookOpen, Monitor } from 'lucide-react';
import { ThemeMode } from '../../types';
import { useUIStore } from '../../store/useUIStore';

interface ThemeToggleProps {
  showLabels?: boolean;
  className?: string;
  scope?: 'reader' | 'global';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabels = false,
  className = '',
  scope = 'reader',
}) => {
  const { theme, setTheme } = useUIStore();

  const options: { mode: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark OLED', icon: Moon },
    { mode: 'sepia', label: 'Sepia Bible', icon: BookOpen },
    { mode: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div
      id={`theme-toggle-${scope}`}
      className={`inline-flex items-center p-1 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/80 backdrop-blur-md border border-neutral-300/40 dark:border-neutral-700/50 ${className}`}
      role="radiogroup"
      aria-label="Theme mode selection"
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            id={`theme-btn-${mode}`}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(mode)}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isActive
                ? mode === 'sepia'
                  ? 'bg-[#F4ECD8] text-[#5B4636] shadow-sm font-semibold'
                  : mode === 'dark'
                  ? 'bg-black text-white shadow-sm font-semibold'
                  : 'bg-white text-neutral-900 shadow-sm font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title={`Switch to ${label} mode`}
          >
            <Icon className="w-3.5 h-3.5" />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
};
