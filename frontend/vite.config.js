import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { compression } from "vite-plugin-compression2";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip for universal server support
    compression({
      algorithm: "gzip",
      exclude: [/\.(png|jpg|webp|gif|svg|ico|woff2?)$/],
    }),
    // Brotli for modern browsers (~20% smaller than gzip)
    compression({
      algorithm: "brotliCompress",
      exclude: [/\.(png|jpg|webp|gif|svg|ico|woff2?)$/],
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://3.25.65.255.nip.io:3000",
        changeOrigin: true,
        rewrite: (path) => path,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js ecosystem — keep in its own async chunk, never in critical path
          if (
            id.includes("@react-three") ||
            id.includes("postprocessing") ||
            id.includes("three")
          ) {
            return "three-vendor";
          }
          // GSAP — large but deferred via requestIdleCallback; keep isolated
          if (id.includes("gsap")) {
            return "gsap-vendor";
          }
          // Markdown — only used in AIChatPanel (lazy loaded)
          if (
            id.includes("react-markdown") ||
            id.includes("remark-gfm") ||
            id.includes("mdast") ||
            id.includes("micromark") ||
            id.includes("unified")
          ) {
            return "markdown-vendor";
          }
          // Redux
          if (
            id.includes("@reduxjs/toolkit") ||
            id.includes("react-redux") ||
            id.includes("immer") ||
            id.includes("redux")
          ) {
            return "redux-vendor";
          }
          // React core — always keep tight
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("react/")
          ) {
            return "react-vendor";
          }
          // Axios + smooth scroll
          if (id.includes("axios") || id.includes("lenis")) {
            return "utils-vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    target: "esnext",
    // esbuild is fastest; use terser only if you need advanced tree-shaking passes
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    // Reduce module preload link injection (avoids waterfall of <link rel=modulepreload>)
    modulePreload: { polyfill: false },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "gsap",
      "react-redux",
      "use-sync-external-store/shim/with-selector.js",
      "use-sync-external-store/shim/index.js",
    ],
    needsInterop: [
      "use-sync-external-store/shim/with-selector.js",
      "use-sync-external-store/shim/index.js",
    ],
  },
});
