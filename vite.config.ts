import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd())
  
  const isProd = mode === 'production'
  
  return {
    plugins: [
      react(),
      // Enable gzip compression for production builds
      isProd && viteCompression({
        verbose: true,
        algorithm: 'gzip',
        ext: '.gz',
      })
    ],
    // Base path for production deployment
    // Change this if you're not deploying to the root of your domain
    base: isProd ? '/' : '/',    build: {
      outDir: 'dist',
      // Improve production build
      minify: isProd ? 'terser' : false,
      sourcemap: !isProd,
      // Skip TypeScript checking during build
      rollupOptions: {
        external: [],
        output: {
          // Split chunks to improve caching
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid', '@mui/x-date-pickers'],
            charts: ['chart.js', 'react-chartjs-2', 'recharts']
          }
        }
      }
    },
    // Skip TypeScript errors during build
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    server: {
      port: 3000,
      host: 'localhost', // Use localhost for development
      // Enable proxy for API requests in development
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
