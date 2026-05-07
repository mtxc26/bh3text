import { defineConfig } from 'rolldown'

export default defineConfig([{
  input: {
    common: 'src/bootstrap/common.ts',
  },
  output: {
    dir: 'dist',
    minify: true,
    format: 'esm',
    sourcemap: true,
  },
  moduleTypes: {
    '.svg': 'text',
  },
}])
