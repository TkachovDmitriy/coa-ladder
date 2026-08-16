import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// GitHub Pages project sites are served at /<repository>/, while local Vite
// development is served from /. GitHub Actions supplies GITHUB_REPOSITORY.
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1]
const base = process.env.GITHUB_ACTIONS && repository ? `/${repository}/` : "/"

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
