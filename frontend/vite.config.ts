import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/v1': process.env.DEV_PROXY || 'http://localhost:8000',
      '/auth': process.env.DEV_PROXY || 'http://localhost:8000',
    },
  },
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true, filename: "dist/stats.html" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
