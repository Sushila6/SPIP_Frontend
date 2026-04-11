import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': 'http://localhost:8080',
      '/signup': 'http://localhost:8080',
      '/me': 'http://localhost:8080',
      '/plots': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
      '/payments': 'http://localhost:8080',
      '/notifications': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    }
  }
})
