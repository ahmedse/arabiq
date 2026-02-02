'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  /**
   * How much of the element must be visible before it loads (0-1)
   */
  threshold?: number;
  /**
   * Margin around the root for early loading
   */
  rootMargin?: string;
  /**
   * Fallback content to show while loading
   */
  fallback?: ReactNode;
  /**
   * Minimum height to prevent layout shift
   */
  minHeight?: string;
  /**
   * Disable lazy loading (for above-fold content)
   */
  disabled?: boolean;
}

/**
 * Lazy loading wrapper for below-fold sections.
 * Uses IntersectionObserver to defer rendering until visible.
 */
export function LazySection({
  children,
  className,
  threshold = 0.1,
  rootMargin = '200px',
  fallback,
  minHeight = '200px',
  disabled = false,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(disabled);
  const [hasLoaded, setHasLoaded] = useState(disabled);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, disabled, hasLoaded]);

  // Default fallback skeleton
  const defaultFallback = (
    <div 
      className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
      style={{ minHeight }}
    />
  );

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
}

/**
 * Skeleton loader for lazy sections
 */
export function SectionSkeleton({ 
  height = '300px',
  className,
}: { 
  height?: string;
  className?: string;
}) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg ${className || ''}`}
      style={{ height }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}

/**
 * Card skeleton for grid layouts
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="animate-pulse bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-full mb-1" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Stats skeleton
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="animate-pulse text-center p-6"
        >
          <div className="h-10 bg-gray-200 rounded w-20 mx-auto mb-2" />
          <div className="h-4 bg-gray-100 rounded w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}
