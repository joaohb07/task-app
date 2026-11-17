import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command = 'serve' } = {}) => ({
  base: command === 'build' ? './' : '/',
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}))