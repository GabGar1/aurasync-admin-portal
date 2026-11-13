import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3333",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  build: {
    sourcemap: false,
    // The "charts" chunk (recharts + d3, ~550 kB) only loads with the dashboard.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Only leaf libraries get their own chunk. Splitting React-dependent libraries apart
        // from React creates circular chunks ("Cannot read properties of undefined (reading
        // 'forwardRef')" at startup); the rest is left to Rollup's dependency-aware split.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id)) return "charts";
          if (/[\\/]date-fns[\\/]/.test(id)) return "dates";
          return undefined;
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
