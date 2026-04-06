import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/slots': 'http://localhost:5000',
      '/accept': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
})
