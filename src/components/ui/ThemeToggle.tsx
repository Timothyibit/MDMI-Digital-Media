import React from 'react';
import { Sun, Moon } from 'lucide-react';
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
    { mode: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      id={`theme-toggle-${scope}`}
      className={`inline-flex items-center p-0.5 rounded-md bg-[#F4F5FE] dark:bg-neutral-800 border border-[#E9ECEF] dark:border-neutral-700 ${className}`}
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
            className={`relative flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-all ${
              isActive
                ? 'bg-[#5E72E4] text-white shadow-[0_2px_4px_rgba(94,114,228,0.3)]'
                : 'text-[#525F7F] dark:text-neutral-400 hover:text-[#172B4D] dark:hover:text-white'
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
