import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
 testDir: './tests',
 timeout: 120_000,
 expect: { timeout: 5_000 },
 fullyParallel: true,
 retries: process.env.CI ? 2 : 0,
 reporter: [['list'], process.env.CI ? ['github'] : ['html', { open: 'never' }]],
 use: {
 baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
 trace: 'on-first-retry',
 screenshot: 'only-on-failure',
 video: 'retain-on-failure'
 },
 projects: [
 { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
 { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
 { name: 'webkit', use: { ...devices['Desktop Safari'] } },
 { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
 ],
 webServer: {
 // Use npx next dev to avoid running npm lifecycle hooks that may prompt interactively
 command: 'npx next dev -p 3000',
 url: 'http://localhost:3000',
 reuseExistingServer: !process.env.CI,
 timeout: 120_000
 }
});
