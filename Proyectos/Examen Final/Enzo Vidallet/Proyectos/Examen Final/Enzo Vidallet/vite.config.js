import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 5000,
    open: false
  },
  build: {
    outDir: "../dist",
    sourcemap: true
  },
  resolve: {
    alias: { '@': '/src' }
  }
});