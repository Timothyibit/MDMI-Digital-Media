import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        'next/image': path.resolve(import.meta.dirname, 'src/lib/next-image.tsx'),
        '@untitledui/icons': path.resolve(import.meta.dirname, 'src/lib/untitledui-icons.tsx'),
        'react-native': path.resolve(import.meta.dirname, 'src/lib/react-native.tsx'),
        'react-native-paper': path.resolve(import.meta.dirname, 'src/lib/react-native-paper.tsx'),
        'lucide-react-native': 'lucide-react',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
