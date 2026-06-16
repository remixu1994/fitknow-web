import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FitKnow 健身知识库',
        short_name: 'FitKnow',
        description: '按目标学习饮食、训练、工具和动作知识',
        theme_color: '#16724f',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'zh-CN',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: [
          'index.html',
          'registerSW.js',
          'manifest.webmanifest',
          'pwa-icon.svg',
          'assets/index-*.{js,css}'
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/generated/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fitknow-generated-assets',
              expiration: {
                maxEntries: 48,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        maximumFileSizeToCacheInBytes: 512 * 1024
      }
    })
  ]
});
