// vite.config.ts

import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ======================================================
  // ===== TAMBAHKAN BLOK INI UNTUK MEMPERBAIKI ROUTING 👇 =====
  // ======================================================
  server: {
    historyApiFallback: true,
  },
})