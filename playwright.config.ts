import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke tests against the real production build (`vite preview`), on a desktop
 * and a phone viewport. Locally they use the installed Chrome (no browser download); in CI,
 * run `npx playwright install --with-deps chromium` first.
 *
 * The build uses `--mode staging` so the suite can run while placeholder content remains.
 */
const PORT = 4173
const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...(CI ? {} : { channel: 'chrome' }),
    // Software WebGL so the hero scene renders headless instead of falling back.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build-only:staging && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
})
