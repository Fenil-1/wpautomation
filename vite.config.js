import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Dev-only proxy so the frontend can reach the backend without CORS and
    // without any backend changes. Used by the /dev/session debug console.
    // The browser calls same-origin (/api/...) and Vite forwards to the API.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
