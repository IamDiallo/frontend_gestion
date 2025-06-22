// Re-export from componentLoader for backward compatibility
import { lazyLoadComponent } from './lazyLoader';
import { LoadingFallback } from './componentLoader';

// Re-export with previous name for backward compatibility
export const lazyLoad = lazyLoadComponent;
export { LoadingFallback };
