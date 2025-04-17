// vite.config.ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import unocss from 'unocss/vite'

export default defineConfig(({ mode }) => {
  const isDevelopment = ['development', 'preview'].includes(mode);

  return {
    plugins: [
      react(),
      unocss()
    ],
    server: {
      port: 3333
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src'),
        '@': resolve(__dirname, 'src'),
      }
    },
    build: {
      sourcemap: isDevelopment, // Enable source map generation only in development
      minify: !isDevelopment ? "terser" : false, // Enable minification only in production
      mode: isDevelopment ? 'development' : 'production',
      terserOptions: {
        compress: {
          drop_console: !isDevelopment, // Remove console logs in production
          drop_debugger: !isDevelopment, // Remove debugger statements in production
        },
        format: {
          comments: isDevelopment, // Remove comments in production
        },
        mangle: !isDevelopment, // Mangle variable names in production
      },
    },
    exclude: ['node_modules/.cache'],
  }
})
