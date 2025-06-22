import React, { lazy, Suspense, ComponentType } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
    <CircularProgress />
  </Box>
);

// Simple lazy load component wrapper
// eslint-disable-next-line react-refresh/only-export-components
export const lazyLoad = <T,>(importFunc: () => Promise<{ default: ComponentType<T> }>) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: T) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};
