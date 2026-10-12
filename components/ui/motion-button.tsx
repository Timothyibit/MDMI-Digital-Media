'use client';

import React, { forwardRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export type MotionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'ministry-green'
  | 'ministry-red'
  | 'dark'
  | 'outline'
  | 'ghost'
  | 'white';

export type MotionButtonSize = 'sm' | 'md' | 'lg' | 'default' | 'full';

export interface MotionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label?: string;
  children?: React.ReactNode;
  variant?: MotionButtonVariant;
  classes?: string;
  className?: string;
  animate?: boolean;
  delay?: number;
  size?: MotionButtonSize;
  icon?: React.ReactNode;
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * High-contrast, theme-responsive button variant styling
 *
 * Rules strictly enforced:
 * 1. Buttons on green, dark-green, red, amber, dark navy ALWAYS have PURE WHITE text (#FFFFFF)
 *    in unhovered, hovered, and clicked states across BOTH light (white) theme and dark theme.
 * 2. Secondary, outline, and ghost buttons have DEEP DARK text (#172B4D) on light theme,
 *    and PURE WHITE text (#FFFFFF) on dark theme.
 * 3. Smooth, fluid hover and click transitions without contrast drop or layout jumps.
 */
const variantStyles: Record<
  MotionButtonVariant,
  {
    container: string;
    circle: string;
    iconBox: string;
    iconColor: string;
    text: string;
  }
> = {
  // Discipleship Green (MDMI primary) - Pure white text in all states & themes
  primary: {
    container:
      'bg-[#65A30D] hover:bg-[#558B0A] active:bg-[#4D7C0F] dark:bg-[#65A30D] dark:hover:bg-[#72B013] dark:active:bg-[#4D7C0F] text-white border border-[#558B0A]/60 dark:border-[#72B013]/60 shadow-xs hover:shadow-md focus-visible:ring-[#65A30D]',
    circle:
      'bg-[#4D7C0F] dark:bg-[#4D7C0F] group-hover:bg-[#3E630C] group-active:bg-[#365314]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    iconColor: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },

  // Deep Ministry Forest Green - Pure white text in all states & themes
  'ministry-green': {
    container:
      'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] dark:bg-[#166534] dark:hover:bg-[#15803D] dark:active:bg-[#14532D] text-white border border-[#166534]/70 dark:border-[#22C55E]/40 shadow-xs hover:shadow-md focus-visible:ring-[#166534]',
    circle:
      'bg-[#14532D] dark:bg-[#14532D] group-hover:bg-[#052E16] group-active:bg-[#052E16]',
    iconBox:
      'bg-white/20 group-hover:bg-white/30 group-active:bg-white/35 text-white',
    iconColor: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },

  // Cross Red (Danger) - Pure white text in all states & themes
  danger: {
    container:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] dark:bg-[#DC2626] dark:hover:bg-[#EF4444] dark:active:bg-[#B91C1C] text-white border border-[#B91C1C]/60 dark:border-[#EF4444]/50 shadow-xs hover:shadow-md focus-visible:ring-[#DC2626]',
    circle:
      'bg-[#B91C1C] dark:bg-[#B91C1C] group-hover:bg-[#991B1B] group-active:bg-[#7F1D1D]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    iconColor: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },

  // Cross Red (Ministry Red) - Pure white text in all states & themes
  'ministry-red': {
    container:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] dark:bg-[#DC2626] dark:hover:bg-[#EF4444] dark:active:bg-[#B91C1C] text-white border border-[#B91C1C]/60 dark:border-[#EF4444]/50 shadow-xs hover:shadow-md focus-visible:ring-[#DC2626]',
    circle:
      'bg-[#B91C1C] dark:bg-[#B91C1C] group-hover:bg-[#991B1B] group-active:bg-[#7F1D1D]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    iconColor: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },

  // Deep Dark Navy / Master Charcoal - Pure white text in all states & themes
  dark: {
    container:
      'bg-[#172B4D] hover:bg-[#0F172A] active:bg-black dark:bg-[#1E293B] dark:hover:bg-[#0F172A] dark:active:bg-black text-white border border-[#0F172A]/50 dark:border-neutral-700 shadow-xs hover:shadow-md focus-visible:ring-[#172B4D]',
    circle:
      'bg-black/40 dark:bg-black/50 group-hover:bg-black/60 group-active:bg-black/70',
    iconBox:
      'bg-white/15 group-hover:bg-white/25 group-active:bg-white/30 text-white',
    iconColor: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },

  // Warning / Amber - Pure white text in all states & themes
  warning: {
    container:
      'bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] dark:bg-[#D97706] dark:hover:bg-[#F59E0B] dark:active:bg-[#B45309] text-white border border-[#B45309]/60 dark:border-[#F59E0B]/50 shadow-xs hover:shadow-md focus-visible:ring-[#D97706]',
    circle:
      'bg-[#B45309] dark:bg-[#B45309] group-hover:bg-[#92400E] group-active:bg-[#78350F]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    iconColor: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },

  // Secondary - Deep Dark in light theme, Pure White in dark theme
  secondary: {
    container:
      'bg-neutral-100 hover:bg-neutral-200/90 active:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 text-[#172B4D] dark:text-white border border-neutral-300/90 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 shadow-xs hover:shadow-sm focus-visible:ring-neutral-400',
    circle:
      'bg-neutral-300/80 dark:bg-neutral-700/80 group-hover:bg-neutral-400/80 dark:group-hover:bg-neutral-600',
    iconBox:
      'bg-neutral-200/90 dark:bg-neutral-700 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600 text-[#172B4D] dark:text-white',
    iconColor: 'text-[#172B4D] dark:text-white',
    text: 'text-[#172B4D] dark:text-white group-hover:text-black dark:group-hover:text-white group-active:text-black dark:group-active:text-white font-bold',
  },

  // Outline - Deep Dark in light theme, Pure White in dark theme
  outline: {
    container:
      'bg-transparent hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800/80 dark:active:bg-neutral-700/80 text-[#172B4D] dark:text-white border-2 border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 dark:hover:border-neutral-400 shadow-xs focus-visible:ring-neutral-400',
    circle:
      'bg-neutral-200/70 dark:bg-neutral-700/70 group-hover:bg-neutral-300/80 dark:group-hover:bg-neutral-600/80',
    iconBox:
      'bg-neutral-100 dark:bg-neutral-800 text-[#172B4D] dark:text-white',
    iconColor: 'text-[#172B4D] dark:text-white',
    text: 'text-[#172B4D] dark:text-white group-hover:text-black dark:group-hover:text-white font-bold',
  },

  // Ghost - Deep Dark in light theme, Pure White in dark theme
  ghost: {
    container:
      'bg-transparent hover:bg-neutral-100 active:bg-neutral-200/90 dark:hover:bg-neutral-800/80 dark:active:bg-neutral-700/80 text-[#172B4D] dark:text-white border border-transparent shadow-none focus-visible:ring-neutral-400',
    circle:
      'bg-neutral-200/50 dark:bg-neutral-700/50 group-hover:bg-neutral-300/70 dark:group-hover:bg-neutral-600/70',
    iconBox: 'bg-transparent text-[#172B4D] dark:text-white',
    iconColor: 'text-[#172B4D] dark:text-white',
    text: 'text-[#172B4D] dark:text-white group-hover:text-black dark:group-hover:text-white font-bold',
  },

  // White Card / Surface Accent - Deep Dark text on pure white card
  white: {
    container:
      'bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#172B4D] border border-white/80 shadow-md hover:shadow-lg focus-visible:ring-white',
    circle: 'bg-neutral-100 group-hover:bg-neutral-200',
    iconBox: 'bg-neutral-100 text-[#172B4D]',
    iconColor: 'text-[#172B4D]',
    text: 'text-[#172B4D] group-hover:text-black font-bold',
  },
};

/**
 * Responsive size tokens with rock-solid pixel geometry
 * Prevents any position shifting, wrapping, or layout jitter across small and large screens.
 */
const sizeStyles = {
  sm: {
    btn: 'h-8 sm:h-9 px-1.5 text-xs',
    circleInitial: 'w-6 h-6 sm:w-7 sm:h-7',
    iconBox: 'w-6 h-6 sm:w-7 sm:h-7',
    iconSize: 'w-3.5 h-3.5',
    textPadding: 'px-2 text-xs font-bold',
  },
  md: {
    btn: 'h-9 sm:h-10 px-1.5 text-xs sm:text-sm',
    circleInitial: 'w-7 h-7 sm:w-8 sm:h-8',
    iconBox: 'w-7 h-7 sm:w-8 sm:h-8',
    iconSize: 'w-4 h-4',
    textPadding: 'px-2.5 sm:px-3 text-xs sm:text-sm font-bold',
  },
  default: {
    btn: 'h-10 sm:h-11 px-2 text-xs sm:text-sm',
    circleInitial: 'w-7.5 h-7.5 sm:w-8.5 sm:h-8.5',
    iconBox: 'w-7.5 h-7.5 sm:w-8.5 sm:h-8.5',
    iconSize: 'w-4 h-4',
    textPadding: 'px-3 sm:px-3.5 text-xs sm:text-sm font-bold',
  },
  lg: {
    btn: 'h-11 sm:h-12 px-2 text-sm sm:text-base',
    circleInitial: 'w-8.5 h-8.5 sm:w-9.5 sm:h-9.5',
    iconBox: 'w-8.5 h-8.5 sm:w-9.5 sm:h-9.5',
    iconSize: 'w-4.5 h-4.5 sm:w-5 sm:h-5',
    textPadding: 'px-3.5 sm:px-4 text-sm sm:text-base font-bold',
  },
  full: {
    btn: 'w-full h-10 sm:h-11 px-2 text-xs sm:text-sm justify-between',
    circleInitial: 'w-7.5 h-7.5 sm:w-8.5 sm:h-8.5',
    iconBox: 'w-7.5 h-7.5 sm:w-8.5 sm:h-8.5',
    iconSize: 'w-4 h-4',
    textPadding: 'px-2 text-xs sm:text-sm font-bold flex-1 text-center',
  },
};

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      label,
      children,
      variant = 'primary',
      classes,
      className,
      size = 'default',
      icon,
      onClick,
      onPress,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const currentVariant = variantStyles[variant] || variantStyles.primary;
    const currentSize = sizeStyles[size] || sizeStyles.default;
    const buttonLabel = label || children;
    const isIconOnly = !buttonLabel;

    // Detect full-width usage to guarantee proper centering on all screen sizes
    const isExplicitJustifyStart =
      className?.includes('justify-start') || classes?.includes('justify-start');

    const isFull =
      (size === 'full' ||
        className?.includes('w-full') ||
        classes?.includes('w-full')) &&
      !isExplicitJustifyStart;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (onClick) onClick(e);
      if (onPress) onPress(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          // Base structure: stable flex layout with zero layout shifts on small or large screens
          'group relative inline-flex items-center cursor-pointer rounded-full overflow-hidden select-none whitespace-nowrap',
          // Fluid transition for all states (unhovered, hovered, clicked, focus)
          'transition-all duration-300 ease-out transform-gpu origin-center',
          // Tactile responsive click feedback without moving siblings
          'active:scale-[0.98]',
          // Accessible outline focus ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950',
          // Disabled state
          'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 disabled:shadow-none',
          // Sizing safety across breakpoints
          isIconOnly
            ? 'aspect-square justify-center p-0 shrink-0'
            : isFull
            ? 'w-full justify-between'
            : 'justify-start shrink-0',
          currentVariant.container,
          currentSize.btn,
          classes,
          className
        )}
        {...props}
      >
        {/*
          Smooth expanding circle background overlay.
          Uses absolute positioning with transform to prevent subpixel layout shifts on resize or hover.
        */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out',
            isIconOnly
              ? 'inset-0.5 w-auto h-auto'
              : cn(
                  currentSize.circleInitial,
                  'group-hover:left-0 group-hover:w-full group-hover:h-full group-hover:rounded-full group-focus-visible:left-0 group-focus-visible:w-full group-focus-visible:h-full group-active:left-0 group-active:w-full group-active:h-full'
                ),
            currentVariant.circle
          )}
        />

        {/* Leading Icon Badge with smooth scale and slide */}
        <span
          className={cn(
            'relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-out group-hover:scale-105 group-active:scale-95 pointer-events-none',
            currentSize.iconBox,
            currentVariant.iconBox
          )}
        >
          {icon ? (
            <span
              className={cn(
                currentVariant.iconColor,
                'shrink-0 flex items-center justify-center transition-colors duration-300'
              )}
            >
              {icon}
            </span>
          ) : (
            <ArrowRight
              className={cn(
                currentVariant.iconColor,
                currentSize.iconSize,
                'transition-colors duration-300'
              )}
            />
          )}
        </span>

        {/*
          High-contrast, fluid-color label:
          - Pure white text for primary, ministry-green, danger, ministry-red, dark, warning in ALL states
          - Deep dark text for secondary, outline, ghost on white theme, fluid to pure white in dark theme
        */}
        {buttonLabel && (
          <span
            className={cn(
              'button-text relative z-10 font-display-scripture tracking-tight transition-colors duration-300 ease-out truncate min-w-0',
              currentSize.textPadding,
              isFull && 'flex-1 text-center',
              currentVariant.text
            )}
          >
            {buttonLabel}
          </span>
        )}

        {/* Right optical balance spacer when full width to maintain perfect centering */}
        {isFull && buttonLabel && (
          <span
            aria-hidden="true"
            className={cn('shrink-0 pointer-events-none opacity-0', currentSize.iconBox)}
          />
        )}
      </button>
    );
  }
);

MotionButton.displayName = 'MotionButton';

export default MotionButton;
