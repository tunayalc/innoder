import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:
          loadEnv(mode, process.cwd(), '').INNO_API_PROXY ||
          'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: { sourcemap: false },
}));
