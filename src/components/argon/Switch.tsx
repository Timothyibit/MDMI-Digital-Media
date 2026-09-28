import React from 'react';
import { argonTheme } from '../../constants/Theme';

export interface ArgonSwitchProps {
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  onChange?: (val: boolean) => void;
  color?: string;
  className?: string;
  accessibilityLabel?: string;
}

export const ArSwitch: React.FC<ArgonSwitchProps> = ({
  value = false,
  onValueChange,
  onChange,
  color,
  className = '',
  accessibilityLabel = 'Toggle setting',
}) => {
  const handleToggle = () => {
    const nextVal = !value;
    onValueChange?.(nextVal);
    onChange?.(nextVal);
  };

  const activeBg = color ? color : '#5E72E4';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={accessibilityLabel}
      onClick={handleToggle}
      style={{ backgroundColor: value ? activeBg : undefined }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        !value ? 'bg-[#D4D9DD] dark:bg-neutral-700' : ''
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const Switch = ArSwitch;
export default Switch;
