import { defineConfig, devices } from '@playwright/test';

const PORT = 8123;

/**
 * End-to-end tests against the real app.
 *
 * Every claim in `docs/PHASE-*.md` about how the running app behaves came from driving
 * a browser by hand. This suite is those flows made repeatable, so a reviewer can
 * re-run the verification instead of taking it on trust — and so a regression in
 * scroll restoration or filter persistence fails a build rather than being noticed
 * months later.
 *
 * The viewport is 375×667 because that is the size the design is held to.
 */
export default defineConfig({
  testDir: './e2e',
  // The app is stateful across a test (storage, navigation), so files run in
  // parallel but tests within one do not.
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    ...devices['iPhone SE'],
    // devices[] sets isMobile/hasTouch, which react-native-web is happy with, but
    // pin the viewport explicitly so the 375px commitment is what actually runs.
    viewport: { width: 375, height: 667 },
    /**
     * Escape hatch for sandboxes that ship a preinstalled Chromium at a fixed path
     * rather than the revision this Playwright expects. Unset in CI, where
     * `playwright install` provides the matching build.
     */
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },

  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],

  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Metro bundles on first request; a cold start is genuinely slow.
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
