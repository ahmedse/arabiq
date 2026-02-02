'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

/**
 * Optimized image component with proper handling for Strapi URLs,
 * error fallbacks, and responsive sizing.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  placeholder,
  blurDataURL,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle Strapi relative URLs
  const imageUrl = (() => {
    if (!src || hasError) return PLACEHOLDER_IMAGE;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/uploads/')) return `${STRAPI_URL}${src}`;
    if (src.startsWith('/')) return src;
    return `${STRAPI_URL}/${src}`;
  })();

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Common image props
  const imageProps = {
    src: imageUrl,
    alt: alt || '',
    priority,
    quality,
    sizes,
    onError: handleError,
    onLoad: handleLoad,
    placeholder: placeholder,
    blurDataURL: blurDataURL,
  };

  // Loading state overlay class
  const loadingClass = isLoading ? 'animate-pulse bg-gray-200' : '';

  if (fill) {
    return (
      <div className={`relative ${loadingClass} ${className || ''}`}>
        <Image
          {...imageProps}
          fill
          className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      width={width || 800}
      height={height || 600}
      className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className || ''}`}
    />
  );
}

/**
 * Hero image with priority loading for LCP optimization
 */
export function HeroImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      className={className}
      sizes="100vw"
      quality={90}
    />
  );
}

/**
 * Thumbnail image for cards and lists
 */
export function ThumbnailImage({
  src,
  alt,
  className,
  size = 'md',
}: {
  src: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimensions = {
    sm: { width: 64, height: 64 },
    md: { width: 128, height: 128 },
    lg: { width: 256, height: 256 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions[size].width}
      height={dimensions[size].height}
      className={className}
      sizes={`${dimensions[size].width}px`}
    />
  );
}

/**
 * Avatar image with circular styling
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className || ''}`}
      sizes={`${size}px`}
    />
  );
}
