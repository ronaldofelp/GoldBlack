import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // jsPDF optionally imports these via dynamic import() for its html() method.
      // This project only uses jsPDF for programmatic PDF generation (text + addImage),
      // so these are not needed and would otherwise drag in ~4,000 modules (core-js, etc).
      external: ['canvg', 'html2canvas', 'dompurify'],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
