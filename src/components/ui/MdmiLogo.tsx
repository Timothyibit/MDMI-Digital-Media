import React from 'react';

interface MdmiLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
}

export const MdmiLogo: React.FC<MdmiLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.svg"
        alt="The Master's Discipleship Ministries Int'l Logo"
        style={{ width: dimension, height: dimension }}
        className="shrink-0 object-contain rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-neutral-200/50 dark:border-neutral-700/50 bg-white"
      />
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-black tracking-widest text-[#84CC16] uppercase">
            Discipling to Serve
          </span>
          <span className="text-sm font-extrabold text-[#172B4D] dark:text-white">
            MDMI Devotionals
          </span>
        </div>
      )}
    </div>
  );
};
