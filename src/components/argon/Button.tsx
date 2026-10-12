import React from 'react';
import { ArrowRight } from 'lucide-react';

export type ArgonButtonColor =
  | 'primary'
  | 'brand'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'default'
  | 'dark'
  | string;

export interface ArgonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ArgonButtonColor;
  small?: boolean;
  shadowless?: boolean;
  round?: boolean;
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  textStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * High-contrast, theme-responsive button variant styling
 *
 * Rules:
 * 1. Buttons on green, dark-green, red, amber, dark navy ALWAYS have PURE WHITE text (#FFFFFF)
 *    in unhovered, hovered, and clicked states across BOTH light (white) theme and dark theme.
 * 2. Secondary/neutral buttons have DEEP DARK text (#172B4D) on light theme,
 *    and PURE WHITE text (#FFFFFF) on dark theme.
 */
const COLOR_VARIANTS: Record<
  string,
  {
    container: string;
    circle: string;
    iconBox: string;
    icon: string;
    text: string;
  }
> = {
  primary: {
    container:
      'bg-[#65A30D] hover:bg-[#558B0A] active:bg-[#4D7C0F] dark:bg-[#65A30D] dark:hover:bg-[#72B013] dark:active:bg-[#4D7C0F] text-white border border-[#558B0A]/60 dark:border-[#72B013]/60 shadow-xs hover:shadow-md focus-visible:ring-[#65A30D]',
    circle:
      'bg-[#4D7C0F] dark:bg-[#4D7C0F] group-hover:bg-[#3E630C] group-active:bg-[#365314]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  brand: {
    container:
      'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] dark:bg-[#166534] dark:hover:bg-[#15803D] dark:active:bg-[#14532D] text-white border border-[#166534]/70 dark:border-[#22C55E]/40 shadow-xs hover:shadow-md focus-visible:ring-[#166534]',
    circle:
      'bg-[#14532D] dark:bg-[#14532D] group-hover:bg-[#052E16] group-active:bg-[#052E16]',
    iconBox:
      'bg-white/20 group-hover:bg-white/30 group-active:bg-white/35 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  secondary: {
    container:
      'bg-neutral-100 hover:bg-neutral-200/90 active:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600 text-[#172B4D] dark:text-white border border-neutral-300/90 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 shadow-xs hover:shadow-sm focus-visible:ring-neutral-400',
    circle:
      'bg-neutral-300/80 dark:bg-neutral-700/80 group-hover:bg-neutral-400/80 dark:group-hover:bg-neutral-600',
    iconBox:
      'bg-neutral-200/90 dark:bg-neutral-700 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600 text-[#172B4D] dark:text-white',
    icon: 'text-[#172B4D] dark:text-white',
    text: 'text-[#172B4D] dark:text-white group-hover:text-black dark:group-hover:text-white group-active:text-black dark:group-active:text-white font-bold',
  },
  info: {
    container:
      'bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white border border-[#0369A1]/60 shadow-xs hover:shadow-md focus-visible:ring-[#0284C7]',
    circle: 'bg-[#0369A1] group-hover:bg-[#075985]',
    iconBox: 'bg-black/20 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  success: {
    container:
      'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white border border-[#166534]/60 shadow-xs hover:shadow-md focus-visible:ring-[#15803D]',
    circle: 'bg-[#14532D] group-hover:bg-[#052E16]',
    iconBox: 'bg-black/20 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  warning: {
    container:
      'bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] dark:bg-[#D97706] dark:hover:bg-[#F59E0B] dark:active:bg-[#B45309] text-white border border-[#B45309]/60 dark:border-[#F59E0B]/50 shadow-xs hover:shadow-md focus-visible:ring-[#D97706]',
    circle:
      'bg-[#B45309] dark:bg-[#B45309] group-hover:bg-[#92400E] group-active:bg-[#78350F]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  error: {
    container:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] dark:bg-[#DC2626] dark:hover:bg-[#EF4444] dark:active:bg-[#B91C1C] text-white border border-[#B91C1C]/60 dark:border-[#EF4444]/50 shadow-xs hover:shadow-md focus-visible:ring-[#DC2626]',
    circle:
      'bg-[#B91C1C] dark:bg-[#B91C1C] group-hover:bg-[#991B1B] group-active:bg-[#7F1D1D]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  danger: {
    container:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] dark:bg-[#DC2626] dark:hover:bg-[#EF4444] dark:active:bg-[#B91C1C] text-white border border-[#B91C1C]/60 dark:border-[#EF4444]/50 shadow-xs hover:shadow-md focus-visible:ring-[#DC2626]',
    circle:
      'bg-[#B91C1C] dark:bg-[#B91C1C] group-hover:bg-[#991B1B] group-active:bg-[#7F1D1D]',
    iconBox:
      'bg-black/20 group-hover:bg-black/30 group-active:bg-black/40 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  default: {
    container:
      'bg-[#172B4D] hover:bg-[#0F172A] active:bg-black dark:bg-[#1E293B] dark:hover:bg-[#0F172A] dark:active:bg-black text-white border border-[#0F172A]/50 dark:border-neutral-700 shadow-xs hover:shadow-md focus-visible:ring-[#172B4D]',
    circle:
      'bg-black/40 dark:bg-black/50 group-hover:bg-black/60 group-active:bg-black/70',
    iconBox:
      'bg-white/15 group-hover:bg-white/25 group-active:bg-white/30 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
  dark: {
    container:
      'bg-[#172B4D] hover:bg-[#0F172A] active:bg-black dark:bg-[#1E293B] dark:hover:bg-[#0F172A] dark:active:bg-black text-white border border-[#0F172A]/50 dark:border-neutral-700 shadow-xs hover:shadow-md focus-visible:ring-[#172B4D]',
    circle:
      'bg-black/40 dark:bg-black/50 group-hover:bg-black/60 group-active:bg-black/70',
    iconBox:
      'bg-white/15 group-hover:bg-white/25 group-active:bg-white/30 text-white',
    icon: 'text-white',
    text: 'text-white group-hover:text-white group-active:text-white font-bold',
  },
};

/**
 * Separates explicit or inline icons from label text
 */
function extractIconAndText(children: React.ReactNode, explicitIcon?: React.ReactNode) {
  if (explicitIcon) {
    return { iconNode: explicitIcon, textNodes: children ? [children] : [] };
  }

  let iconNode: React.ReactNode = null;
  const textNodes: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && !iconNode) {
      const childProps = child.props as any;
      const isIconElement =
        child.type === 'svg' ||
        (typeof child.type === 'function' &&
          (child.type.name?.toLowerCase().includes('icon') ||
            (childProps?.className &&
              (childProps.className.includes('w-') ||
                childProps.className.includes('h-') ||
                childProps.className.includes('size-'))))) ||
        (childProps && ('strokeWidth' in childProps || 'size' in childProps));

      if (isIconElement) {
        iconNode = child;
        return;
      }
    }
    textNodes.push(child);
  });

  return { iconNode, textNodes };
}

export const ArButton: React.FC<ArgonButtonProps> = ({
  color = 'primary',
  small = false,
  shadowless = false,
  round = true,
  onPress,
  onClick,
  className = '',
  style,
  textStyle,
  icon,
  children,
  disabled,
  type = 'button',
  ...props
}) => {
  const variant = COLOR_VARIANTS[color] || COLOR_VARIANTS.primary;
  const { iconNode, textNodes } = extractIconAndText(children, icon);
  const hasText = (textNodes && textNodes.length > 0) || typeof children === 'string';

  const isFull = className.includes('w-full');

  const sizeStyles = small
    ? {
        btn: 'h-8 sm:h-9 px-1.5 text-xs',
        circleInitial: 'w-6 h-6 sm:w-7 sm:h-7',
        iconBox: 'w-6 h-6 sm:w-7 sm:h-7',
        iconSize: 'w-3.5 h-3.5',
        textPadding: 'px-2 text-xs font-bold',
      }
    : {
        btn: 'h-9 sm:h-10 px-1.5 text-xs sm:text-sm',
        circleInitial: 'w-7 h-7 sm:w-8 sm:h-8',
        iconBox: 'w-7 h-7 sm:w-8 sm:h-8',
        iconSize: 'w-4 h-4',
        textPadding: 'px-2.5 sm:px-3 text-xs sm:text-sm font-bold',
      };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={(e) => {
        onPress?.(e);
        onClick?.(e);
      }}
      className={`group relative inline-flex items-center cursor-pointer ${
        round ? 'rounded-full' : 'rounded-xl'
      } overflow-hidden select-none whitespace-nowrap transition-all duration-300 ease-out transform-gpu origin-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${
        isFull ? 'w-full justify-between' : 'justify-start shrink-0'
      } ${variant.container} ${sizeStyles.btn} ${className}`}
      style={style}
      {...props}
    >
      {/* Animated expanding circle background (ABSOLUTE: zero layout shift on resize/hover/click) */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out group-hover:left-0 group-hover:w-full group-hover:h-full group-hover:rounded-full group-focus-visible:left-0 group-focus-visible:w-full group-focus-visible:h-full group-active:left-0 group-active:w-full group-active:h-full ${sizeStyles.circleInitial} ${variant.circle}`}
      />

      {/* Leading Icon Badge with tactile feedback */}
      <span
        className={`relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-out group-hover:scale-105 group-active:scale-95 pointer-events-none ${sizeStyles.iconBox} ${variant.iconBox}`}
      >
        {iconNode ? (
          <span className={`${variant.icon} shrink-0 flex items-center justify-center transition-colors duration-300`}>
            {iconNode}
          </span>
        ) : (
          <ArrowRight className={`${variant.icon} ${sizeStyles.iconSize} transition-colors duration-300`} />
        )}
      </span>

      {/* Button Text: pure white on green/red/dark, deep dark on light */}
      {hasText && (
        <span
          className={`button-text relative z-10 transition-colors duration-300 ease-out tracking-tight truncate min-w-0 font-display-scripture ${sizeStyles.textPadding} ${
            isFull ? 'flex-1 text-center' : ''
          } ${variant.text}`}
          style={textStyle}
        >
          {textNodes && textNodes.length > 0 ? textNodes : children}
        </span>
      )}

      {/* Optical balance spacer for full width */}
      {isFull && hasText && (
        <span aria-hidden="true" className={`shrink-0 pointer-events-none opacity-0 ${sizeStyles.iconBox}`} />
      )}
    </button>
  );
};

export const Button = ArButton;
export { ArButton as MotionButton };
export default Button;
