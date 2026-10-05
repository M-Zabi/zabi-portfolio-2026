import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

import { sitePlugin } from './plugins/vite-plugin-site'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), sitePlugin(), mode === 'development' && vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // three.js (~575 kB raw / ~145 kB gzip) is its own chunk, fetched on demand by the hero
    // after first paint — it never sits on the critical path, so it may exceed the default.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Keep the heavy, rarely-changing vendors in their own long-cached chunks.
        // three.js is only reached through a dynamic import, so it never blocks first paint.
        advancedChunks: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion-v|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'vue-core', test: /node_modules[\\/](@vue|vue|vue-router|pinia)[\\/]/ },
          ],
        },
      },
    },
  },
}))
