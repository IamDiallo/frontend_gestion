
/**
 * This utility helps preload critical assets and data to improve performance
 */

// List of critical assets to preload
const CRITICAL_ASSETS = [
  // Add paths to your most important images, fonts, etc.
  '/assets/logo.svg', 
  '/assets/fonts/main.woff2'
];

// Preload critical assets
export function preloadAssets() {
  CRITICAL_ASSETS.forEach(assetPath => {
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = assetPath;
      
      // Set appropriate as attribute based on asset type
      if (assetPath.endsWith('.woff2') || assetPath.endsWith('.woff') || assetPath.endsWith('.ttf')) {
        link.as = 'font';
        link.crossOrigin = 'anonymous'; // Required for fonts
      } else if (assetPath.endsWith('.svg') || assetPath.endsWith('.png') || assetPath.endsWith('.jpg') || assetPath.endsWith('.webp')) {
        link.as = 'image';
      } else if (assetPath.endsWith('.css')) {
        link.as = 'style';
      } else if (assetPath.endsWith('.js')) {
        link.as = 'script';
      }
      
      document.head.appendChild(link);
    } catch (error) {
      console.warn(`Failed to preload asset: ${assetPath}`, error);
    }
  });
}

// Prefetch API data
export async function prefetchCriticalData(): Promise<void> {
  try {
    // Make requests to prefetch critical data
    // Example: const userDataPromise = apiClient.get('/api/user-profile');
    
    // Wait for all requests to complete
    // const [userData] = await Promise.all([userDataPromise]);
    
    // Store in app state or cache
    // return { userData };
  } catch (error) {
    console.warn('Failed to prefetch critical data', error);
  }
}

// Initialize preloading
export function initPreloading(): void {
  // Preload assets immediately
  preloadAssets();
  
  // Prefetch data after initial render
  setTimeout(() => {
    prefetchCriticalData();
  }, 100);
}
