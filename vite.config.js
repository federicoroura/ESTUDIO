import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → el build (carpeta dist/) funciona abierto desde cualquier carpeta
// o servidor estático, sin backend. Todo corre en el navegador.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 1500 }, // pdf.js pesa ~1 MB; es esperable
});
