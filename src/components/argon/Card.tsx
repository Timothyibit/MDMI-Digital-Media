import React from 'react';
import { argonTheme } from '../../constants/Theme';

export interface ArgonCardItem {
  title?: string;
  image?: string;
  cta?: string;
  subtitle?: string;
  tag?: string;
  date?: string;
  [key: string]: any;
}

export interface ArgonCardProps {
  item?: ArgonCardItem;
  horizontal?: boolean;
  full?: boolean;
  ctaColor?: string;
  imageStyle?: string;
  onPress?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const ArCard: React.FC<ArgonCardProps> = ({
  item,
  horizontal = false,
  full = false,
  ctaColor = argonTheme.COLORS.ACTIVE,
  imageStyle = '',
  onPress,
  className = '',
  style,
  children,
}) => {
  const cardContainerClass = `
    group bg-white dark:bg-neutral-900
    rounded-lg border border-[#E9ECEF] dark:border-neutral-800
    shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(50,50,93,0.12)]
    transition-all duration-200 overflow-hidden
    ${horizontal ? 'flex flex-col sm:flex-row' : 'flex flex-col'}
    ${onPress ? 'cursor-pointer' : ''}
    ${className}
  `;

  const renderImage = () => {
    if (!item?.image) return null;

    if (horizontal) {
      return (
        <div className={`relative sm:w-2/5 shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 min-h-[140px] ${imageStyle}`}>
          <img
            src={item.image}
            alt={item.title || 'Devotional'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {item.tag && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#5E72E4] text-white shadow-sm">
              {item.tag}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={`relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 ${full ? 'h-56 sm:h-64' : 'h-40 sm:h-48'} ${imageStyle}`}>
        <img
          src={item.image}
          alt={item.title || 'Devotional'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {item.tag && (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#5E72E4] text-white shadow-sm">
            {item.tag}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onPress}
      className={cardContainerClass}
      style={style}
    >
      {renderImage()}

      <div className={`p-4 sm:p-5 flex-1 flex flex-col justify-between ${horizontal ? 'sm:w-3/5' : 'w-full'}`}>
        {children || (
          <>
            <div>
              {item?.subtitle && (
                <p className="text-[11px] font-semibold text-[#525F7F] dark:text-neutral-400 mb-1 tracking-wide uppercase">
                  {item.subtitle}
                </p>
              )}
              {item?.title && (
                <h4 className="text-base sm:text-lg font-bold text-[#172B4D] dark:text-white line-clamp-2 leading-snug">
                  {item.title}
                </h4>
              )}
            </div>

            {item?.cta && (
              <div className="mt-4 pt-2 flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-wider group-hover:translate-x-0.5 transition-transform"
                  style={{ color: ctaColor }}
                >
                  {item.cta} →
                </span>
                {item?.date && (
                  <span className="text-[11px] text-[#ADB5BD] font-medium">
                    {item.date}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const Card = ArCard;
export default Card;
