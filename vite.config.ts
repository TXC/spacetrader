import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    testTimeout: 120_000,
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/tests/**/*.test.{ts,tsx}'],
          // The recorded suite drives the real page and checks canvas pixels, so it needs a real browser.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        // Plain tests of the game rules; no page needed.
        test: { name: 'rules', include: ['src/game/**/*.test.ts'], environment: 'node' },
      },
    ],
  },
})
