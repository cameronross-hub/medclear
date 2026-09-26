import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const apiCache = (name: string, pattern: RegExp) => ({
  urlPattern: pattern,
  handler: 'NetworkFirst' as const,
  options: { cacheName: name, networkTimeoutSeconds: 6, expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 }, cacheableResponse: { statuses: [0, 200] } },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/medclear/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'MedClear: medication list explainer',
        short_name: 'MedClear',
        description: 'Plain-language medicine explanations, FDA warnings and recalls, and questions for your next appointment.',
        theme_color: '#1f4e9c',
        background_color: '#f5f6f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/medclear/',
        scope: '/medclear/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          apiCache('rxnav', /^https:\/\/rxnav\.nlm\.nih\.gov\//),
          apiCache('openfda', /^https:\/\/api\.fda\.gov\//),
          apiCache('medlineplus', /^https:\/\/connect\.medlineplus\.gov\//),
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
})
