import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        // Do not rewrite: we want /api/* to pass through to worker route /parse-excel etc.
        // If your worker expects no /api prefix, uncomment the next line
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
