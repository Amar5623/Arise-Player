import { defineConfig, devices } from '@playwright/test';

/** Screens and e2e run against a production build: no dev-server dependency reloads mid-test. */
const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
  },
  webServer: {
    command: `npx vite build --logLevel warn && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'e2e', testMatch: /e2e\/.*\.spec\.ts/, use: { viewport: { width: 390, height: 844 } } },
    { name: 'shots', testMatch: /shots\/.*\.shots\.ts/ },
  ],
});
