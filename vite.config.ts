import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
         includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
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
