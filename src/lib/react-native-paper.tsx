"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, MoreVertical, X, Check } from 'lucide-react';

/* ==========================================================================
   React Native Paper (Material Design 3) Component Suite
   High-performance native mobile primitives conforming to Callstack React Native Paper
   ========================================================================== */

/**
 * MD3 Theme Definition
 */
export interface MD3Colors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  background: string;
  onBackground: string;
  outline: string;
  error: string;
  elevation: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
  };
}

export const MD3LightTheme: MD3Colors = {
  primary: '#5E72E4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E8ECFF',
  onPrimaryContainer: '#172B4D',
  secondary: '#525F7F',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F4F5F7',
  onSecondaryContainer: '#172B4D',
  surface: '#FFFFFF',
  onSurface: '#172B4D',
  surfaceVariant: '#F8F9FA',
  onSurfaceVariant: '#525F7F',
  background: '#F8F9FA',
  onBackground: '#172B4D',
  outline: '#CAD1D7',
  error: '#F5365C',
  elevation: {
    level0: 'none',
    level1: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    level2: '0 3px 6px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
    level3: '0 6px 12px rgba(0,0,0,0.10), 0 3px 6px rgba(0,0,0,0.06)',
    level4: '0 10px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
    level5: '0 15px 30px rgba(0,0,0,0.14), 0 6px 12px rgba(0,0,0,0.08)',
  },
};

export const MD3DarkTheme: MD3Colors = {
  primary: '#889AF7',
  onPrimary: '#0A122C',
  primaryContainer: '#2D3A7B',
  onPrimaryContainer: '#E8ECFF',
  secondary: '#A3ADC2',
  onSecondary: '#141A29',
  secondaryContainer: '#222838',
  onSecondaryContainer: '#E3E7F0',
  surface: '#121212',
  onSurface: '#EDEDED',
  surfaceVariant: '#1E1E1E',
  onSurfaceVariant: '#A3ADC2',
  background: '#0A0A0A',
  onBackground: '#EDEDED',
  outline: '#383838',
  error: '#FF708F',
  elevation: {
    level0: 'none',
    level1: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
    level2: '0 3px 6px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.35)',
    level3: '0 6px 12px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.4)',
    level4: '0 10px 20px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.45)',
    level5: '0 15px 30px rgba(0,0,0,0.8), 0 6px 12px rgba(0,0,0,0.5)',
  },
};

export function useTheme() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return {
    dark: isDark,
    colors: isDark ? MD3DarkTheme : MD3LightTheme,
  };
}

/* ==========================================================================
   1. TouchableRipple (Material Design 3 Ink Ripple)
   ========================================================================== */

export interface TouchableRippleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  borderless?: boolean;
  rippleColor?: string;
  onPress?: (e?: any) => void;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const TouchableRipple: React.FC<TouchableRippleProps> = ({
  borderless = false,
  rippleColor,
  onPress,
  onClick,
  hitSlop,
  children,
  className = '',
  style,
  disabled,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const rippleIdRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Haptic feedback for tactile native feeling
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;

    const newRipple = {
      id: ++rippleIdRef.current,
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev.slice(-4), newRipple]);
  };

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  // HitSlop expansion styles
  let hitSlopStyle = '';
  if (hitSlop) {
    if (typeof hitSlop === 'number') {
      hitSlopStyle = `relative before:absolute before:-inset-[${hitSlop}px] before:content-['']`;
    } else {
      hitSlopStyle = `relative before:absolute before:-top-[${hitSlop.top || 0}px] before:-bottom-[${hitSlop.bottom || 0}px] before:-left-[${hitSlop.left || 0}px] before:-right-[${hitSlop.right || 0}px] before:content-['']`;
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        onPress?.(e);
        onClick?.(e);
      }}
      className={`relative select-none outline-none focus:outline-none cursor-pointer transition-transform active:scale-[0.98] ${
        borderless ? 'overflow-visible' : 'overflow-hidden'
      } ${hitSlopStyle} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={style}
      {...props}
    >
      {/* Ripple Surface Container */}
      <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.35 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              style={{
                position: 'absolute',
                top: ripple.y - ripple.size / 2,
                left: ripple.x - ripple.size / 2,
                width: ripple.size,
                height: ripple.size,
                borderRadius: '50%',
                backgroundColor: rippleColor || 'currentColor',
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>
      </span>
      {children}
    </button>
  );
};

/* ==========================================================================
   2. Appbar (Material Design 3 Header)
   ========================================================================== */

export interface AppbarHeaderProps {
  children?: React.ReactNode;
  elevated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AppbarHeader: React.FC<AppbarHeaderProps> = ({
  children,
  elevated = true,
  className = '',
  style,
}) => (
  <header
    className={`sticky top-0 z-30 w-full select-none h-14 sm:h-16 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl transition-all ${
      elevated
        ? 'border-b border-neutral-200/80 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
        : ''
    } ${className}`}
    style={style}
  >
    {children}
  </header>
);

export interface AppbarContentProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  titleStyle?: React.CSSProperties;
  className?: string;
}

export const AppbarContent: React.FC<AppbarContentProps> = ({
  title,
  subtitle,
  titleStyle,
  className = '',
}) => (
  <div className={`flex flex-col min-w-0 flex-1 justify-center px-1.5 ${className}`}>
    <h1
      className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate tracking-tight"
      style={titleStyle}
    >
      {title}
    </h1>
    {subtitle && (
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-medium">
        {subtitle}
      </p>
    )}
  </div>
);

export interface AppbarActionProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  onPress?: () => void;
  accessibilityLabel?: string;
  badge?: string | number;
  color?: string;
  size?: number;
  className?: string;
}

export const AppbarAction: React.FC<AppbarActionProps> = ({
  icon: Icon,
  onPress,
  accessibilityLabel,
  badge,
  color,
  size = 20,
  className = '',
}) => (
  <TouchableRipple
    onPress={onPress}
    aria-label={accessibilityLabel}
    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${className}`}
  >
    <Icon className="w-5 h-5" style={{ color }} />
    {badge !== undefined && (
      <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#F5365C] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
        {badge}
      </span>
    )}
  </TouchableRipple>
);

export const AppbarBackAction: React.FC<{ onPress?: () => void; accessibilityLabel?: string; className?: string }> = ({
  onPress,
  accessibilityLabel = 'Back',
  className = '',
}) => (
  <TouchableRipple
    onPress={onPress}
    aria-label={accessibilityLabel}
    className={`w-10 h-10 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 ${className}`}
  >
    <ChevronLeft className="w-6 h-6" />
  </TouchableRipple>
);

export const Appbar = {
  Header: AppbarHeader,
  Content: AppbarContent,
  Action: AppbarAction,
  BackAction: AppbarBackAction,
};

/* ==========================================================================
   3. BottomNavigation / NavigationBar (Material Design 3 Native Tabs)
   ========================================================================== */

export interface NavigationRoute {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface BottomNavigationProps {
  routes: NavigationRoute[];
  activeIndex: number;
  onTabPress: (index: number, route: NavigationRoute) => void;
  className?: string;
  safeAreaBottom?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  routes,
  activeIndex,
  onTabPress,
  className = '',
  safeAreaBottom = true,
}) => {
  return (
    <nav
      role="navigation"
      aria-label="Mobile Navigation Bar"
      className={`fixed bottom-0 inset-x-0 z-40 select-none bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-6px_24px_rgba(0,0,0,0.5)] transition-colors ${
        safeAreaBottom ? 'pb-[env(safe-area-inset-bottom,8px)]' : ''
      } ${className}`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {routes.map((route, index) => {
          const isActive = index === activeIndex;
          const Icon = route.icon;

          return (
            <TouchableRipple
              key={route.key}
              onPress={() => onTabPress(index, route)}
              aria-label={route.title}
              className="flex-1 flex flex-col items-center justify-center py-1 rounded-2xl group transition-all"
            >
              {/* Active Pill Container (MD3 NavigationBar specification) */}
              <div
                className={`relative px-4 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#5E72E4]/15 dark:bg-[#5E72E4]/25 text-[#5E72E4] dark:text-[#889af7]'
                    : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-[#5E72E4] dark:text-[#889af7]' : ''
                  }`}
                />
                {route.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#F5365C] text-white text-[9px] font-black flex items-center justify-center">
                    {route.badge}
                  </span>
                )}
              </div>

              {/* Tab Title Label */}
              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-all duration-150 ${
                  isActive
                    ? 'font-bold text-[#5E72E4] dark:text-[#889af7]'
                    : 'font-semibold text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {route.title}
              </span>
            </TouchableRipple>
          );
        })}
      </div>

      {/* Hardware Home Indicator Bar */}
      <div className="w-32 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto my-1 pointer-events-none" />
    </nav>
  );
};

/* ==========================================================================
   4. Card (Material Design 3 Surface Card)
   ========================================================================== */

export interface CardProps {
  children?: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  mode?: 'elevated' | 'outlined' | 'contained';
  onPress?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> & {
  Title: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; left?: React.ReactNode; right?: React.ReactNode; className?: string }>;
  Content: React.FC<{ children: React.ReactNode; className?: string }>;
  Cover: React.FC<{ source: { uri: string }; alt?: string; className?: string }>;
  Actions: React.FC<{ children: React.ReactNode; className?: string }>;
} = ({
  children,
  elevation = 1,
  mode = 'elevated',
  onPress,
  className = '',
  style,
}) => {
  const modeClasses =
    mode === 'outlined'
      ? 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
      : mode === 'contained'
      ? 'bg-neutral-100 dark:bg-neutral-850'
      : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm';

  const Container = onPress ? TouchableRipple : 'div';

  return (
    <Container
      onPress={onPress}
      className={`rounded-2xl overflow-hidden select-none transition-all ${modeClasses} ${className}`}
      style={style}
    >
      {children}
    </Container>
  );
};

Card.Title = ({ title, subtitle, left, right, className = '' }) => (
  <div className={`p-4 flex items-center justify-between gap-3 ${className}`}>
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {left && <div className="shrink-0">{left}</div>}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

Card.Content = ({ children, className = '' }) => (
  <div className={`px-4 pb-4 ${className}`}>{children}</div>
);

Card.Cover = ({ source, alt = '', className = '' }) => (
  <div className={`w-full h-48 sm:h-56 overflow-hidden ${className}`}>
    <img src={source.uri} alt={alt} className="w-full h-full object-cover" />
  </div>
);

Card.Actions = ({ children, className = '' }) => (
  <div className={`px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 ${className}`}>
    {children}
  </div>
);

/* ==========================================================================
   5. Button (Material Design 3 Button)
   ========================================================================== */

export interface ButtonProps {
  mode?: 'contained' | 'outlined' | 'text' | 'elevated';
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  disabled?: boolean;
  onPress?: (e?: any) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  icon: Icon,
  loading = false,
  disabled = false,
  onPress,
  children,
  className = '',
  style,
}) => {
  let modeClass = '';
  switch (mode) {
    case 'contained':
      modeClass = 'bg-[#5E72E4] hover:bg-[#4d61d1] text-white shadow-xs';
      break;
    case 'outlined':
      modeClass = 'border border-neutral-300 dark:border-neutral-700 bg-transparent text-[#5E72E4] dark:text-[#889af7] hover:bg-neutral-100 dark:hover:bg-neutral-800';
      break;
    case 'elevated':
      modeClass = 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-md border border-neutral-200 dark:border-neutral-700';
      break;
    case 'text':
    default:
      modeClass = 'bg-transparent text-[#5E72E4] dark:text-[#889af7] hover:bg-[#5E72E4]/10';
      break;
  }

  return (
    <TouchableRipple
      disabled={disabled || loading}
      onPress={onPress}
      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all ${modeClass} ${className}`}
      style={style}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </TouchableRipple>
  );
};

/* ==========================================================================
   6. IconButton
   ========================================================================== */

export interface IconButtonProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  size?: number;
  iconColor?: string;
  containerColor?: string;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  size = 20,
  iconColor,
  containerColor,
  disabled = false,
  onPress,
  accessibilityLabel,
  className = '',
}) => (
  <TouchableRipple
    disabled={disabled}
    onPress={onPress}
    aria-label={accessibilityLabel}
    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${className}`}
    style={{ backgroundColor: containerColor }}
  >
    <Icon className="w-5 h-5" style={{ color: iconColor }} />
  </TouchableRipple>
);

/* ==========================================================================
   7. Chip
   ========================================================================== */

export interface ChipProps {
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  avatar?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  selected = false,
  disabled = false,
  onPress,
  onClose,
  avatar,
  icon: Icon,
  children,
  className = '',
}) => (
  <TouchableRipple
    disabled={disabled}
    onPress={onPress}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
      selected
        ? 'bg-[#5E72E4] text-white shadow-xs'
        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
    } ${className}`}
  >
    {avatar && <div className="shrink-0 -ml-1">{avatar}</div>}
    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
    <span>{children}</span>
    {onClose && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </TouchableRipple>
);

/* ==========================================================================
   8. FAB (Floating Action Button)
   ========================================================================== */

export interface FABProps {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  onPress?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FAB: React.FC<FABProps> = ({
  icon: Icon,
  label,
  onPress,
  className = '',
  style,
}) => (
  <TouchableRipple
    onPress={onPress}
    className={`fixed bottom-20 right-4 z-30 shadow-xl bg-[#5E72E4] hover:bg-[#485ec4] text-white rounded-2xl flex items-center justify-center gap-2 p-3.5 sm:px-5 sm:py-3.5 cursor-pointer active:scale-95 transition-all ${className}`}
    style={style}
  >
    <Icon className="w-6 h-6" />
    {label && <span className="text-xs sm:text-sm font-bold tracking-tight">{label}</span>}
  </TouchableRipple>
);

/* ==========================================================================
   9. Surface
   ========================================================================== */

export const Surface: React.FC<{ children: React.ReactNode; elevation?: 0 | 1 | 2 | 3; className?: string }> = ({
  children,
  elevation = 1,
  className = '',
}) => {
  const elevationShadow =
    elevation === 0
      ? ''
      : elevation === 1
      ? 'shadow-xs border border-neutral-200/90 dark:border-neutral-800'
      : elevation === 2
      ? 'shadow-md border border-neutral-200/90 dark:border-neutral-800'
      : 'shadow-xl border border-neutral-200/90 dark:border-neutral-800';

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl ${elevationShadow} ${className}`}>
      {children}
    </div>
  );
};

/* ==========================================================================
   10. Badge
   ========================================================================== */

export const Badge: React.FC<{ children?: React.ReactNode; size?: number; className?: string }> = ({
  children,
  size = 18,
  className = '',
}) => (
  <span
    className={`inline-flex items-center justify-center font-black rounded-full bg-[#F5365C] text-white text-[10px] px-1.5 shadow-xs ${className}`}
    style={{ minWidth: size, height: size }}
  >
    {children}
  </span>
);

/* ==========================================================================
   11. Divider
   ========================================================================== */

export const Divider: React.FC<{ bold?: boolean; className?: string }> = ({
  bold = false,
  className = '',
}) => (
  <hr
    className={`border-0 w-full ${
      bold
        ? 'h-[2px] bg-neutral-300 dark:bg-neutral-700'
        : 'h-[1px] bg-neutral-200/80 dark:bg-neutral-800'
    } ${className}`}
  />
);

/* ==========================================================================
   12. SegmentedButtons
   ========================================================================== */

export interface SegmentedButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{ value: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  className?: string;
}

export const SegmentedButtons: React.FC<SegmentedButtonsProps> = ({
  value,
  onValueChange,
  buttons,
  className = '',
}) => (
  <div className={`inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 select-none ${className}`}>
    {buttons.map((btn) => {
      const isSelected = btn.value === value;
      const Icon = btn.icon;

      return (
        <TouchableRipple
          key={btn.value}
          onPress={() => onValueChange(btn.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isSelected
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          <span>{btn.label}</span>
        </TouchableRipple>
      );
    })}
  </div>
);

export default {
  Appbar,
  BottomNavigation,
  Card,
  Button,
  IconButton,
  Chip,
  FAB,
  Surface,
  Badge,
  Divider,
  SegmentedButtons,
  TouchableRipple,
  useTheme,
  MD3LightTheme,
  MD3DarkTheme,
};
