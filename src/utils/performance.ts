import { useEffect, useRef, useCallback } from 'react';
import { config } from '../services/config';

/**
 * Custom hook to create a debounced version of a function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
}

/**
 * Custom hook to create a throttled version of a function
 * @param fn The function to throttle
 * @param limit The time limit in milliseconds
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= limit) {
        lastRun.current = now;
        fn(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          fn(...args);
        }, limit - (now - lastRun.current));
      }
    },
    [fn, limit]
  );
}

/**
 * Memoization helper for expensive calculations
 */
export function memoize<T extends (...args: readonly unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, unknown>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result as ReturnType<T>;
  };
}

/**
 * Performance measurement utility
 */
export const performanceUtil = {
  measure: <T>(name: string, fn: () => T): T => {
    if (!config.debug) {
      return fn();
    }
    
    const start = window.performance.now();
    const result = fn();
    const end = window.performance.now();
    
    // Only log in development environment
    if (config.enableLogs) {
      console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },
};
