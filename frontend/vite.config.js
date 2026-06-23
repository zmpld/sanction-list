import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Strip /api so /api/automation/* -> localhost:5000/automation/*
        // Matches Vercel routePrefix "/api" on the backend service
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
