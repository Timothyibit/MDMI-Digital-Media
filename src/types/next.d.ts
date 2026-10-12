declare module 'next/image' {
  import React from 'react';

  export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    fill?: boolean;
    priority?: boolean;
  }

  const Image: React.FC<ImageProps>;
  export default Image;
}
