import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      manifest: {
        name: "AgroTensor — Smart Farm Intelligence",
        short_name: "AgroTensor",
        description:
          "The intelligent, offline-first command center for modern farms. Unify livestock, crops, operations and finance—secure, private, and always available.",
        theme_color: "#3d6b4f",
        background_color: "#f5f2eb",
        display: "standalone",
        orientation: "portrait",
        id: "/",
        scope: "/",
        start_url: "/",
        icons: [
          // FIX: Cleaned up icons. Browsers reject manifest icons if the declared 
          // "sizes" don't match the actual image dimensions. Since you are using 
          // a single logo.png file, only declare the sizes it actually supports.
          {
            src: "/assets/landing/logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/landing/logo.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/landing/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,webmanifest,json,woff2}"],
        
        // FIX: Added "**/sw.js" to the ignore list. 
        // Previously, it only ignored "**/service-worker.js". Because your filename 
        // is "sw.js", Workbox was trying to precache the service worker itself, 
        // causing a hash mismatch and silently failing the installation.
        globIgnores: ["**/sw.js", "**/service-worker.js"],
        
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigationPreload: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "html-navigations",
              networkTimeoutSeconds: 4,
              precacheFallback: { fallbackURL: "/index.html" },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin &&
              ["script", "style", "worker", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // FIX: Corrected invalid Regex syntax. The unescaped forward slashes 
            // (//) were acting as JS comments, breaking the build.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // FIX: Corrected invalid Regex syntax for gstatic fonts as well.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
