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
        description: '把健身 Excel 变成可学习、可搜索、可追溯的课程工作台',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
});
