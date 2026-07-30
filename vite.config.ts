import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: mode !== 'production',
        type: 'module'
      },
      includeAssets: ['app-logo.png', 'offline.html'],
      manifest: {
        id: '/',
        name: 'BiasSense AI',
        short_name: 'BiasSense',
        description: 'Private local laboratory document analysis.',
        theme_color: '#090716',
        background_color: '#090716',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        categories: ['medical', 'health', 'productivity'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: mode === 'production' ? {
        // Navigation requests must load the React app shell. Using the static
        // offline page here makes an installed PWA appear broken after the
        // service worker takes control on a later launch.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/],
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      } : undefined
    })
  ]
}))
