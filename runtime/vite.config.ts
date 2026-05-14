import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    rolldownOptions: {
      input: {
        common: resolve(fileURLToPath(new URL('./', import.meta.url)), './src/bootstrap/common.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'staticassets/[name]-[hash].js',
        assetFileNames: 'staticassets/[name]-[hash][extname]',
      },
    },
    sourcemap: false,
    emptyOutDir: true,
    minify: true,
  },
  base: './',
})
