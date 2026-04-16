import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/proizvodnja/' : '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5174,
  },
}));
