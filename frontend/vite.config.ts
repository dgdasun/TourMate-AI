import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// The React app runs on PORT (default 4000) and forwards /api calls to the Spring Boot API at API_URL.
const port = Number(process.env.PORT || 4000)
const apiUrl = process.env.API_URL || 'http://localhost:9090'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port,
    // fail loudly if the port is taken instead of silently moving to another one
    strictPort: true,
    proxy: { '/api': apiUrl }
  },
  preview: {
    port,
    strictPort: true,
    proxy: { '/api': apiUrl }
  }
})
