import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Builds src/sw.ts into sw.js with the list of the build's files, and writes the
    // manifest that lets the game be installed.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // src/offline.ts registers the worker, in production builds only.
      injectRegister: false,
      // Everything the build makes, and the page's icon. The other PWA pictures are
      // only for installing and are fetched when needed.
      injectManifest: { globPatterns: ['*.html', 'assets/**', 'favicon-32x32.png'] },
      manifest: {
        name: 'Space Trader',
        short_name: 'Space Trader',
        start_url: '.',
        // Keeps the phone's clock and battery in view.
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'PWAImages/android/android-launchericon-192-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'PWAImages/android/android-launchericon-512-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    testTimeout: 120_000,
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/tests/**/*.test.{ts,tsx}'],
          setupFiles: ['src/tests/flows/setup.ts'],
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
