import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Project page served under https://<user>.github.io/coa-ladder/
export default defineConfig({
  base: "/coa-ladder/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
