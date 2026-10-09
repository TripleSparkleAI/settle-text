// The demo's vite config. The package is imported by its real name through aliases, exactly as a consumer would
// import it after `npm i settle-text`. settle-see comes from the sibling folder inside the SETTLE research repository
// (the package's file: dependency), or from the package's own node_modules in its standalone repository.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TEXT = fileURLToPath(new URL('../../', import.meta.url));
const SIBLING = fileURLToPath(new URL('../../../settle-see/', import.meta.url));
const SEE = existsSync(`${SIBLING}package.json`) ? SIBLING : `${TEXT}node_modules/settle-see/`;

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
