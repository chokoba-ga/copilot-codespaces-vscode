import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '学校イベント会計 - Event POS',
        short_name: 'Event POS',
        description: '学校イベント専用のPOSレジ・会計アプリ',
        theme_color: '#111827',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // APIレスポンスはIndexedDB側のオフラインキャッシュ層で扱うため、SWの事前キャッシュ対象外にする。
        // 日本語フォント(PDF生成用)は約6.5MBあり、PDF出力時のみ動的importされるため
        // 事前キャッシュ対象から除外し、初回オフライン化のダウンロード量を抑える。
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/notoSansJpBase64-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/__/],
        runtimeCaching: [
          {
            // PDF生成時に日本語フォントが読み込まれたら、以降はランタイムキャッシュに保存し
            // 2回目以降のPDF作成はオフラインでも可能にする
            urlPattern: /notoSansJpBase64.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jp-font-cache',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
