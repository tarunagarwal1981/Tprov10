/**
 * Performance Optimization Utilities
 * 
 * Helper functions for improving performance and Core Web Vitals
 */

/**
 * Lazy load component with Suspense
 * Usage: const LazyComponent = lazyLoad(() => import('./Component'))
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc);
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): IntersectionObserverEntry | null {
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry && setEntry(entry),
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return entry;
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch page for faster navigation
 */
export function prefetchPage(href: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Measure performance metrics
 */
export function measurePerformance(name: string, callback: () => void) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  const start = performance.now();
  callback();
  const end = performance.now();
  
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(metric: any) {
  console.log('[Web Vitals]', metric);
  
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * Request Idle Callback wrapper
 */
export function runWhenIdle(callback: () => void) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Optimize images for Core Web Vitals
 */
export const imageOptimization = {
  // Blur placeholder for LCP improvement
  blurDataURL: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=',
  
  // Standard sizes for responsive images
  sizes: {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
  },
  
  // Priority images (above fold)
  priority: true,
  
  // Lazy load below fold
  loading: 'lazy' as const,
};

/**
 * CSS containment helper
 * Improves rendering performance
 */
export const cssContainment = {
  layout: { contain: 'layout' },
  paint: { contain: 'paint' },
  size: { contain: 'size' },
  strict: { contain: 'strict' },
  content: { contain: 'content' },
};

/**
 * Memoization helper
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Check if device has slow connection
 */
export function hasSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  return connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

/**
 * Dynamically import and execute script
 */
export async function loadScript(src: string, async = true, defer = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
}

/**
 * Bundle size check helper
 */
export function logBundleSize(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Bundle] ${componentName} loaded`);
  }
}

// Add React import
import React from 'react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}



