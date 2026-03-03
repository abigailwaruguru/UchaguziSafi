/**
 * UCHAGUZI SAFI — Vite Configuration
 * ====================================
 * React 18 build tool with proxy to FastAPI backend (port 8000).
 * The proxy rewrites /api requests to the backend during development,
 * matching the route structure defined in backend/app/main.py.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@store": path.resolve(__dirname, "./src/store"),
    },
  },

  server: {
    port: 3000,
    open: true,

    // Proxy API requests to FastAPI backend during development.
    // Routes map to the 6 Uchaguzi Safi modules:
    //   /api/v1/auth            → M6 Usimamizi (Admin & Auth)
    //   /api/v1/candidates      → M4 Tafuta (Search & Registry)
    //   /api/v1/contributions   → M1 Fedha Dashboard
    //   /api/v1/expenditures    → M1 Fedha Dashboard
    //   /api/v1/incidents       → M3 Ripoti Ubadhirifu (Misuse Tracker)
    //   /api/v1/visualisation   → M2 Taswira (Data Visualisation)
    //   /api/v1/alerts          → M5 Tahadhari (Alert System)
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    // Target modern browsers — Kenya's mobile internet users
    // predominantly use Chrome on Android (mobile-first design)
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          maps: ["react-map-gl", "mapbox-gl"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
