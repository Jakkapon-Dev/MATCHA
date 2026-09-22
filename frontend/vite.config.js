import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
// Vite server config - re-indexed assets
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        // React กับ router แทบไม่เปลี่ยนระหว่าง deploy — แยกไว้ให้เบราว์เซอร์เก็บ cache ยาว ๆ
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor': ['lenis', 'motion']
        }
      }
    }
  },
  test: {
    // The admin hooks are the thing under test and they touch state, effects
    // and AbortController, so they need a DOM rather than a bare Node scope.
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/public/images/**']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
