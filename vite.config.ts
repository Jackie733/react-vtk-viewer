import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { createRequire } from 'node:module';
import tailwindcss from '@tailwindcss/vite';

function resolveNodeModulePath(moduleName: string) {
  const require = createRequire(import.meta.url);
  let modulePath = normalizePath(require.resolve(moduleName));
  while (!modulePath.endsWith(moduleName)) {
    const newPath = path.posix.dirname(modulePath);
    if (newPath === modulePath) {
      throw new Error(`Could not resolve ${moduleName}`);
    }
    modulePath = newPath;
  }
  return modulePath;
}

function resolvePath(...args: string[]) {
  return normalizePath(path.resolve(...args));
}

const rootDir = resolvePath(__dirname);
const distDir = resolvePath(rootDir, 'dist');

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8080,
  },
  build: {
    outDir: distDir,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('vtk.js')) {
            return 'vtk.js';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
    sourcemap: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: resolvePath(
            resolveNodeModulePath('itk-wasm'),
            'dist/pipeline/web-workers/bundles/itk-wasm-pipeline.min.worker.js',
          ),
          dest: 'itk',
        },
        {
          src: resolvePath(
            resolveNodeModulePath('@itk-wasm/image-io'),
            'dist/pipelines/*{.wasm,.js,.zst}',
          ),
          dest: 'itk/image-io',
        },
        {
          src: resolvePath(
            resolveNodeModulePath('@itk-wasm/dicom'),
            'dist/pipelines/*{.wasm,.js,.zst}',
          ),
          dest: 'itk/pipelines',
        },
        {
          src: resolvePath(
            rootDir,
            'src/io/itk-dicom/emscripten-build/**/dicom*',
          ),
          dest: 'itk/pipelines',
        },
        {
          src: resolvePath(
            rootDir,
            'src/io/resample/emscripten-build/**/resample*',
          ),
          dest: 'itk/pipelines',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['itk-wasm'],
  },
});
