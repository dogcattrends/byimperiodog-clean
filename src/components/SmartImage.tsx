'use client';

import Image from 'next/image';
import type { ImgHTMLAttributes } from 'react';
import {useMemo, useState} from 'react';

type SmartImageProps = {
 src: string;
 alt: string;
 width: number;
 height: number;
 className?: string;
 sizes?: string;
 priority?: boolean;
 fetchPriority?: 'high' | 'low' | 'auto';
 unoptimized?: boolean;
 placeholder?: 'blur' | 'empty';
 blurDataURL?: string;
 decoding?: 'async' | 'sync' | 'auto';
 draggable?: boolean;
 referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>['referrerPolicy'];
 crossOrigin?: ImgHTMLAttributes<HTMLImageElement>['crossOrigin'];
};

export default function SmartImage({
 src,
 alt,
 width,
 height,
 className,
 sizes,
 priority,
 fetchPriority,
 unoptimized,
 placeholder,
 blurDataURL,
 decoding,
 draggable,
 referrerPolicy,
 crossOrigin,
}: SmartImageProps) {
 const [failed, setFailed] = useState(false);

 const normalizedSrc = useMemo(() => {
 const trimmed = (src ?? '').trim();
 if (trimmed.startsWith('//')) return `https:${trimmed}`;
 return trimmed;
 }, [src]);

 const canRender = useMemo(() => {
 if (!normalizedSrc) return false;
 if (normalizedSrc.startsWith('/')) return true;
 return normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://');
 }, [normalizedSrc]);

 const preferPlainImg = Boolean(unoptimized) && /^https?:\/\//i.test(normalizedSrc);

 const aspectClassName = useMemo(() => {
 if (!width || !height) return 'aspect-[16/9]';
 const ratio = width / height;
 // Mantém previsibilidade visual sem overfitting
 if (ratio > 1.6 && ratio < 1.9) return 'aspect-[16/9]';
 if (ratio > 1.2 && ratio < 1.5) return 'aspect-[4/3]';
 return 'aspect-[1/1]';
 }, [width, height]);

 if (failed) {
 return (
 <div
 className={`w-full ${aspectClassName} flex items-center justify-center bg-surface-subtle text-xs text-text-muted ${
 className ?? ''
 }`}
 role="img"
 aria-label={alt}
 >
 Imagem indisponível
 </div>
 );
 }

 if (!canRender) {
 return (
 <div
 className={`w-full ${aspectClassName} flex items-center justify-center bg-surface-subtle text-xs text-text-muted ${
 className ?? ''
 }`}
 role="img"
 aria-label={alt}
 >
 Imagem indisponível
 </div>
 );
 }

 if (preferPlainImg) {
 return (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={normalizedSrc}
 alt={alt}
 width={width}
 height={height}
 className={className}
 decoding={decoding}
 draggable={draggable}
 referrerPolicy={referrerPolicy}
 crossOrigin={crossOrigin}
 loading={priority ? 'eager' : 'lazy'}
 fetchPriority={fetchPriority}
 onError={() => setFailed(true)}
 />
 );
 }

 return (
 <Image
 src={normalizedSrc}
 alt={alt}
 width={width}
 height={height}
 className={className}
 sizes={sizes}
 priority={priority}
 fetchPriority={fetchPriority}
 unoptimized={unoptimized}
 placeholder={placeholder}
 blurDataURL={blurDataURL}
 decoding={decoding}
 draggable={draggable}
 referrerPolicy={referrerPolicy}
 crossOrigin={crossOrigin}
 onError={() => setFailed(true)}
 />
 );
}
