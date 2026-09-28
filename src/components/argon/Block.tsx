import React from 'react';

export interface ArgonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  row?: boolean;
  flex?: boolean;
  center?: boolean;
  middle?: boolean;
  space?: 'between' | 'around' | 'evenly';
  card?: boolean;
  shadow?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ArBlock: React.FC<ArgonBlockProps> = ({
  row = false,
  flex = false,
  center = false,
  middle = false,
  space,
  card = false,
  shadow = false,
  children,
  className = '',
  style,
  ...props
}) => {
  const classes = [
    'flex',
    row ? 'flex-row' : 'flex-col',
    flex ? 'flex-1' : '',
    center ? 'items-center' : '',
    middle ? 'justify-center' : '',
    space === 'between' ? 'justify-between' : '',
    space === 'around' ? 'justify-around' : '',
    space === 'evenly' ? 'justify-evenly' : '',
    card
      ? 'bg-white dark:bg-neutral-900 rounded-lg border border-[#E9ECEF] dark:border-neutral-800'
      : '',
    shadow
      ? 'shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(50,50,93,0.12)] transition-shadow'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} {...props}>
      {children}
    </div>
  );
};

export const Block = ArBlock;
export default Block;
