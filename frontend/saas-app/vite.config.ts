import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 8888,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8899',
        changeOrigin: true,
        timeout: 600000,
      },
    },
  },
})
