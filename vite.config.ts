import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js is lazy-loaded into its own chunk; both chunks are ~135–180 kB gzipped
    chunkSizeWarningLimit: 700,
  },
});
