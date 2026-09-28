import React from 'react';
import { argonTheme } from '../../constants/Theme';

export interface ArgonInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  iconContent?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  success?: boolean;
  error?: boolean;
  shadowless?: boolean;
  placeholderTextColor?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ArInput: React.FC<ArgonInputProps> = ({
  iconContent,
  iconPosition = 'left',
  success = false,
  error = false,
  shadowless = false,
  onChangeText,
  onChange,
  className = '',
  style,
  placeholderTextColor,
  value,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeText?.(e.target.value);
    onChange?.(e);
  };

  const borderClass = error
    ? 'border-[#FCB3A4] focus:border-[#F5365C] focus:ring-1 focus:ring-[#F5365C]'
    : success
    ? 'border-[#7BDEB2] focus:border-[#2DCE89] focus:ring-1 focus:ring-[#2DCE89]'
    : 'border-[#CAD1D7] dark:border-neutral-700 focus:border-[#5E72E4] focus:ring-1 focus:ring-[#5E72E4]';

  const shadowClass = shadowless
    ? ''
    : 'shadow-[0_1px_3px_rgba(50,50,93,0.06),0_1px_0_rgba(0,0,0,0.02)]';

  return (
    <div
      className={`relative flex items-center h-11 w-full rounded-lg bg-white dark:bg-neutral-900 border transition-colors ${borderClass} ${shadowClass} ${className}`}
      style={style}
    >
      {iconContent && iconPosition === 'left' && (
        <div className="pl-3.5 pr-2 flex items-center justify-center text-[#ADB5BD] pointer-events-none">
          {iconContent}
        </div>
      )}

      <input
        value={value}
        onChange={handleChange}
        className={`w-full h-full bg-transparent px-3 text-xs text-[#172B4D] dark:text-white placeholder-[#ADB5BD] outline-none font-medium ${
          iconContent && iconPosition === 'left' ? 'pl-0' : ''
        } ${iconContent && iconPosition === 'right' ? 'pr-0' : ''}`}
        {...props}
      />

      {iconContent && iconPosition === 'right' && (
        <div className="pr-3.5 pl-2 flex items-center justify-center text-[#ADB5BD] pointer-events-none">
          {iconContent}
        </div>
      )}
    </div>
  );
};

export const Input = ArInput;
export default Input;
