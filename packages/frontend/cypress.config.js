import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});