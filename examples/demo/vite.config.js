// The demo's vite config. The package is imported by its real name through aliases, exactly as a consumer would
// import it after `npm i settle-text`; settle-see comes from the sibling folder (the package's file: dependency).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const TEXT = fileURLToPath(new URL('../../', import.meta.url));
const SEE = fileURLToPath(new URL('../../../settle-see/', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^settle-text\/react$/, replacement: `${TEXT}react/index.js` },
      { find: /^settle-text$/, replacement: `${TEXT}src/index.js` },
      { find: /^settle-see\/react$/, replacement: `${SEE}react/index.js` },
      { find: /^settle-see$/, replacement: `${SEE}src/index.js` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: ['.', TEXT, SEE] } },
});
