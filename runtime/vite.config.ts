import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    __BUILD_ID__: JSON.stringify(execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()),
    __OUTFILE_DEPLOY_PATH__: JSON.stringify('/_r/runtime/'),
  },
  build: {
    rolldownOptions: {
      input: {
        common: resolve(fileURLToPath(new URL('./', import.meta.url)), './src/bootstrap/common.ts'),
        elements: resolve(fileURLToPath(new URL('./', import.meta.url)), './src/bootstrap/elements.ts'),
        'contact-email': resolve(fileURLToPath(new URL('./', import.meta.url)), './src/bootstrap/contact-email.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'staticassets/[name]-[hash].js',
        assetFileNames: (assetInfo) => (assetInfo.names?.some(name => name.endsWith('.css'))) ? 'style.css' : 'staticassets/[name]-[hash][extname]',
      },
    },
    sourcemap: !false,
    emptyOutDir: true,
    minify: true,
    cssCodeSplit: false,
  },
  base: './',
})
