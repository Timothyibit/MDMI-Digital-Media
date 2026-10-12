import React from 'react';

export interface NextImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
}

export const NextImage: React.FC<NextImageProps> = ({
  src,
  alt = '',
  width,
  height,
  fill,
  className = '',
  style,
  ...props
}) => {
  const fillStyle: React.CSSProperties = fill
    ? { position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover' }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ ...fillStyle, ...style }}
      loading={props.loading || 'lazy'}
      {...props}
    />
  );
};

export default NextImage;
