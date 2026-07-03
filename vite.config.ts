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
      strategies: 'injectManifest',
      filename: 'sw.js',
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      manifest: {
        name: "AgroTensor - Offline Farm Records",
        short_name: "AgroTensor",
        description:
          "Track your farm projects, operations, and finances offline. Secure, private, and always available.",
        theme_color: "#3d6b4f",
        background_color: "#f5f2eb",
        display: "standalone",
        orientation: "portrait",
        id: "/",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/assets/landing/logo.png", sizes: "16x16", type: "image/png" },
          { src: "/assets/landing/logo.png", sizes: "32x32", type: "image/png" },
          { src: "/assets/landing/logo.png", sizes: "48x48", type: "image/png" },
          { src: "/assets/landing/logo.png", sizes: "180x180", type: "image/png" },
          { src: "/assets/landing/logo.png", sizes: "192x192", type: "image/png" },
          { src: "/assets/landing/logo.png", sizes: "512x512", type: "image/png" },
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
        globIgnores: ["**/service-worker.js"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigationPreload: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
