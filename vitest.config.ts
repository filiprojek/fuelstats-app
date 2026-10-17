import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

import pkg from './package.json'

// Separate from vite.config.ts so PWA / devtools plugins stay out of tests
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['src/**/__tests__/*.spec.ts'],
    restoreMocks: true,
    env: {
      VITE_API: 'http://api.test/api/v1',
      VITE_API_BASE: '',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts', 'src/main.ts'],
    },
  },
})
