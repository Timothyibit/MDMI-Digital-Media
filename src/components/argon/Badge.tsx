import React from 'react';
import { ArgonButtonColor } from './Button';

export interface ArgonBadgeProps {
  color?: ArgonButtonColor;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const BADGE_COLOR_MAP: Record<string, string> = {
  primary: 'bg-[#5E72E4]/15 text-[#5E72E4] border-[#5E72E4]/30',
  brand: 'bg-[#84CC16]/20 text-[#4D7C0F] dark:text-[#A3E635] border-[#84CC16]/40',
  secondary: 'bg-[#F7FAFC] text-[#525F7F] border-[#CAD1D7] dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
  info: 'bg-[#11CDEF]/15 text-[#11CDEF] border-[#11CDEF]/30',
  success: 'bg-[#2DCE89]/15 text-[#2DCE89] border-[#2DCE89]/30',
  warning: 'bg-[#FB6340]/15 text-[#FB6340] border-[#FB6340]/30',
  error: 'bg-[#F5365C]/15 text-[#F5365C] border-[#F5365C]/30',
  default: 'bg-[#172B4D]/15 text-[#172B4D] border-[#172B4D]/30 dark:bg-white/10 dark:text-white',
};

export const ArBadge: React.FC<ArgonBadgeProps> = ({
  color = 'primary',
  size = 'sm',
  children,
  className = '',
  style,
}) => {
  const colorClass = BADGE_COLOR_MAP[color] || BADGE_COLOR_MAP.primary;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded border ${colorClass} ${sizeClass} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

export const Badge = ArBadge;
export default Badge;
