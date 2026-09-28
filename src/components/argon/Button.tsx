import React from 'react';
import { argonTheme } from '../../constants/Theme';

export type ArgonButtonColor =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'default'
  | string;

export interface ArgonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ArgonButtonColor;
  small?: boolean;
  shadowless?: boolean;
  round?: boolean;
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  textStyle?: React.CSSProperties;
  children: React.ReactNode;
}

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string }> = {
  primary: {
    bg: 'bg-[#5E72E4]',
    text: 'text-white',
    hover: 'hover:bg-[#485ec4] active:bg-[#3c50ad]',
  },
  brand: {
    bg: 'bg-[#84CC16]',
    text: 'text-neutral-900',
    hover: 'hover:bg-[#74b810] active:bg-[#65a30d]',
  },
  secondary: {
    bg: 'bg-[#F7FAFC] border border-[#E9ECEF] dark:bg-neutral-800 dark:border-neutral-700',
    text: 'text-[#172B4D] dark:text-white',
    hover: 'hover:bg-[#edf2f7] dark:hover:bg-neutral-700',
  },
  info: {
    bg: 'bg-[#11CDEF]',
    text: 'text-white',
    hover: 'hover:bg-[#0da5c0] active:bg-[#0a8c9e]',
  },
  success: {
    bg: 'bg-[#2DCE89]',
    text: 'text-white',
    hover: 'hover:bg-[#24a46d] active:bg-[#1d8a5c]',
  },
  warning: {
    bg: 'bg-[#FB6340]',
    text: 'text-white',
    hover: 'hover:bg-[#e04f2f] active:bg-[#c94225]',
  },
  error: {
    bg: 'bg-[#F5365C]',
    text: 'text-white',
    hover: 'hover:bg-[#d82548] active:bg-[#b81b3a]',
  },
  default: {
    bg: 'bg-[#172B4D]',
    text: 'text-white',
    hover: 'hover:bg-[#0f1d34] active:bg-[#0a1322]',
  },
};

export const ArButton: React.FC<ArgonButtonProps> = ({
  color = 'primary',
  small = false,
  shadowless = false,
  round = false,
  onPress,
  onClick,
  className = '',
  style,
  textStyle,
  children,
  disabled,
  ...props
}) => {
  const isPreset = color in COLOR_MAP;
  const colorConfig = isPreset ? COLOR_MAP[color] : null;

  const baseClasses =
    'cursor-pointer inline-flex items-center justify-center font-bold tracking-wide uppercase transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeClasses = small
    ? 'text-xs px-3.5 py-2 min-h-[38px] min-w-[76px] rounded-lg'
    : 'text-xs px-5 py-3 min-h-[44px] min-w-[120px] rounded-lg';

  const roundClasses = round ? 'rounded-full' : '';

  const shadowClasses = shadowless
    ? ''
    : 'shadow-[0_2px_8px_rgba(50,50,93,0.08)] hover:shadow-[0_4px_14px_rgba(50,50,93,0.12)]';

  const colorClasses = colorConfig
    ? `${colorConfig.bg} ${colorConfig.text} ${colorConfig.hover}`
    : 'text-white';

  const customStyle: React.CSSProperties = {
    ...(!isPreset && color ? { backgroundColor: color } : {}),
    ...style,
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        onPress?.(e);
        onClick?.(e);
      }}
      className={`${baseClasses} ${sizeClasses} ${roundClasses} ${shadowClasses} ${colorClasses} ${className}`}
      style={customStyle}
      {...props}
    >
      <span style={textStyle}>{children}</span>
    </button>
  );
};

export const Button = ArButton;
export default Button;
