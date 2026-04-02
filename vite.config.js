import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const pwaManifest = {
  name: "EduLink Teacher",
  short_name: "EduLink T",
  description: "Teacher portal for attendance, messaging, ATP tracking, and schoolwork management.",
  theme_color: "#198754",
  background_color: "#f0fdf4",
  display: "standalone",
  scope: "/",
  start_url: "/",
  orientation: "portrait",
  icons: [
    { src: "pwa/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "pwa/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};

export default defineConfig({
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    assetsDir: "assets",
  },
  publicDir: "public",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["pwa/apple-touch-icon.png"],
      manifest: pwaManifest,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/firebase-messaging-sw\.js$/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        globIgnores: ["**/firebase-messaging-sw.js"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/sanctum/"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === "style" || request.destination === "script" || url.hostname === "cdn.jsdelivr.net",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "teacher-static", expiration: { maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 } },
          },
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: { cacheName: "teacher-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "teacher-images", expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
