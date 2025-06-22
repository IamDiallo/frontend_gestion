import React, { lazy, Suspense } from 'react';
import { LoadingFallback } from './componentLoader';

// Dynamic import function for component lazy loading with proper typing
export function lazyLoadComponent(
  importFunc: () => Promise<{ default: React.ComponentType }>
): React.ComponentType {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    React.createElement(Suspense, { fallback: React.createElement(LoadingFallback) }, 
      React.createElement(LazyComponent, props)
    )
  );
}
