// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './comprehensive-tests',
  timeout: 60000, // Increased timeout for real backend connections
  expect: {
    timeout: 10000  // Increased for real backend responses
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add 1 retry for flaky tests even in development
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'test-reports/playwright-report.json' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: { mode: 'only-on-failure', fullPage: true },
    video: 'on-first-retry',
    actionTimeout: 15000, // Increase action timeout for real backends
    navigationTimeout: 30000, // Longer navigation timeout
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true, // For self-signed certs in test environments
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=IsolateOrigins', '--disable-site-isolation-trials']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        browserName: 'firefox',
        launchOptions: {
          firefoxUserPrefs: {
            'browser.cache.disk.enable': false,
            'browser.cache.memory.enable': false
          }
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        browserName: 'webkit',
        launchOptions: {
          // WebKit specific settings
        }
      },
    },
    // Mobile viewport testing
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        browserName: 'webkit',
        ...devices['iPhone 12'],
      },
    },
  ],
  webServer: {
    url: 'http://localhost:3001/pdfspark/',
    reuseExistingServer: true,
    timeout: 60000, // Longer timeout for server startup
  },
});