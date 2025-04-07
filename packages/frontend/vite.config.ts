import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Custom plugin to inject Google verification tag
const injectGoogleVerification = () => {
  return {
    name: 'vite-plugin-inject-google-verification',
    transformIndexHtml(html) {
      // Check if tag already exists
      if (html.includes('google-site-verification')) return html;
      
      // Inject the meta tag after the viewport meta tag
      return html.replace(
        /<meta name="viewport".*?>/,
        '$&\n    <meta name="google-site-verification" content="WIKscPK-LpMMM63OZiE66Gsg1K0LXmXSt5z6wP4AqwQ" />'
      );
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    injectGoogleVerification(),
  ],
  
  // Use /pdfspark/ path for deployment
  base: '/pdfspark/',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Upewnij się, że wszystkie zasoby mają odpowiednie ścieżki
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    
    // Zapewnij, że wszystkie zasoby mają odpowiednie przedrostki ścieżek
    rollupOptions: {
      output: {
        // Customowy format ścieżek dla skryptów i zasobów
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          zustand: ['zustand'],
        },
        // Customowy format ścieżek dla zasobów
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/img/[name].[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});