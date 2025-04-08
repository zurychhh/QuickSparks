import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@context': resolve(__dirname, './src/context'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@store': resolve(__dirname, './src/store'),
    },
  },
});