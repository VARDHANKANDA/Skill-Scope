import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const basePath = process.env.BASE_PATH || '/';

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig(async ({ command }) => {
  const isServer = command === 'serve' || command === 'preview';
  const rawPort = process.env.PORT;

  if (isServer && !rawPort) {
    throw new Error(
      'PORT environment variable is required but was not provided.',
    );
  }

  const port = Number(rawPort || 0);

  if (isServer && (Number.isNaN(port) || port <= 0)) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss({ optimize: false }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf', 'html2canvas'],
            'vendor-clerk': ['@clerk/react'],
            'vendor-query': ['@tanstack/react-query'],
          },
        },
      },
    },
    server: isServer
      ? {
          port,
          strictPort: true,
          host: '0.0.0.0',
          allowedHosts: true,
          fs: {
            strict: true,
          },
        }
      : undefined,
    preview: isServer
      ? {
          port,
          host: '0.0.0.0',
          allowedHosts: true,
        }
      : undefined,
  };
});
