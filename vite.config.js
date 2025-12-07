import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      // Redirige las llamadas del frontend a /api -> backend local en 8000
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Mantener el prefijo /api porque el backend expone /api/... también
        // rewrite: (path) => path.replace(/^\/api/, ''), // si tu backend NO tiene prefijo /api, descomenta esta línea
      },
    },
  },
  preview: {
    port: 3000
  }
})
