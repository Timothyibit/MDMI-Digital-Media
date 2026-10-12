import React, { useState } from 'react';

interface TjTechLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const TjTechLogo: React.FC<TjTechLogoProps> = ({
  className = '',
  size = 28,
  showText = true,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2 group ${className}`}>
      {/* 
        T-J Tech Official Logo Emblem 
        Using the exact official logo asset from /tj-tech-logo.svg
      */}
      <div 
        className="relative shrink-0 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-900 shadow-2xs border border-neutral-200/90 dark:border-neutral-700/60 transition-transform duration-300 group-hover:scale-105 overflow-hidden p-0.5"
        style={{ width: size, height: size }}
      >
        {!imgError ? (
          <img
            src="/tj-tech-logo.svg"
            alt="T-J Tech Official Logo"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 500 500"
            width="100%"
            height="100%"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-contain"
          >
            <defs>
              <linearGradient id="tj-meta-left" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A4A4A" />
                <stop offset="50%" stopColor="#6B6B6B" />
                <stop offset="100%" stopColor="#333333" />
              </linearGradient>
              <linearGradient id="tj-solid-black" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#181818" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>
              <linearGradient id="tj-mesh-line" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#222222" />
                <stop offset="100%" stopColor="#444444" />
              </linearGradient>
            </defs>
            <g stroke="url(#tj-mesh-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
              <path d="M 215 88 L 138 135 L 75 160 L 95 245 L 78 320 L 105 385 L 180 435" />
              <path d="M 138 135 L 175 160 L 215 88" />
              <path d="M 75 160 L 140 185 L 138 135" />
            </g>
            <path d="M 250 20 L 250 68 L 195 130 L 170 102 Z" fill="url(#tj-meta-left)" />
            <path d="M 250 20 L 330 102 L 305 130 L 250 68 Z" fill="url(#tj-solid-black)" />
            <path d="M 170 252 L 212 205 L 212 400 L 170 445 Z" fill="url(#tj-meta-left)" />
            <path d="M 288 205 L 330 252 L 330 380 L 344 380 L 344 415 L 262 482 L 262 418 L 292 390 L 292 205 Z" fill="url(#tj-solid-black)" />
            <rect x="245" y="235" width="10" height="150" rx="1" fill="#111111" />
            <rect x="218" y="278" width="64" height="10" rx="1" fill="#111111" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5 font-black text-sm tracking-tight text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            <span>T-J Tech</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              Partner
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Engineering &amp; Solutions
          </span>
        </div>
      )}
    </div>
  );
};
export default TjTechLogo;
