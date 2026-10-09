# Publishing settle-text (notes; nothing is published)

Nothing here is published, by the LOCAL-ONLY LAW of `sites/CLAUDE.md`: no npm, no registry, no public URL.
`package.json` carries `"private": true`, which makes `npm publish` refuse. This file records what publishing
would take, so the day it is wanted the work is a list and not a discovery.

## What works today, from this repository

- The SETTLE site imports it by name (`settle-text`, `settle-text/react`) through vite aliases that point at this
  folder (`SETTLE/settle-site/vite.config.js`).
- The demo (`examples/demo`) does the same through its own `vite.config.js`. Its own `package.json` names vite, the
  React plugin and React; inside this repository `run.sh` borrows the site's `node_modules` through a symlink
  instead, and in the package's standalone repository it installs them once. settle-see comes from the sibling
  folder here and from the package's `node_modules` there.
- `npm test` runs the pure half in node. `npm install` in this folder links `settle-see` from the sibling folder
  (`"settle-see": "file:../settle-see"`).

## What publishing would take

1. **settle-see first.** settle-text depends on settle-see, which is also unpublished and `private`. Either publish
   settle-see (then `"settle-see": "^0.1.0"` here) or vendor it (copy `settle-see/src` and `settle-see/react` into
   this package under `vendor/` and rewrite its three imports: `react/Lights.jsx`, `react/picture.js` and
   `react/SettleText.jsx`; `tests/colour.test.mjs` imports it too). A peer dependency would be wrong: a consumer should
   not have to know the engine exists.
2. **A licence.** settle-see declares none (no `license` field, no LICENSE file) and settle-rs has none either;
   settle-mcp is MIT. This package follows settle-see today and declares none. A published package needs one, and
   the choice is the navigator's; MIT would match settle-mcp and the upstream ds4 engine this project rests on.
3. **A build.** The sources are plain ES modules and JSX. Consumers' bundlers handle JSX only when told to, so a
   published package ships compiled JavaScript: `react/*.jsx` through esbuild or Babel into `dist/react/`, with
   `exports` pointing at `dist/`. Keep the source in `files` too, for source maps and for readers.
4. **Types.** A `types/index.d.ts` for the seven components and the pure exports, hand-written (the props tables in
   the README are the spec), with `"types"` in `exports`.
5. **The React range.** `peerDependencies` says `react >=18`; it is tested on 18.3.1 only (the site's React and the
   demo's). Test on 19 before claiming it. Note that `npm install` in this folder pulls a React 19 in as an
   automatic peer; nothing here runs React in node, so the tests do not exercise it.
6. **The name.** `settle-text` is the chosen name; `settle-sdm-text` was the alternative the navigator offered and
   is recorded in the README's naming note. Check the registry for a clash before the first publish.
7. **The examples' assets.** `examples/demo/public/galileo-moon.png` is Galileo's 1610 drawing (public domain);
   `hero-hot.jpg` is this project's own BRAND frame. Both may ship.
8. **The demo's dependencies.** Done in 0.3.0: `examples/demo/package.json` names vite, `@vitejs/plugin-react`, react
   and react-dom as devDependencies, and `run.sh` installs them when it has no SETTLE site to borrow from.

## What a pack holds today

`npm pack --dry-run` (2026-10-05, version 0.3.0): 43 files, 272 kB packed. `examples/demo/.npmignore` keeps a built
demo (`dist/`, made by `run.sh --build`) out of it; without that file a pack made after a demo build carried the
294 kB bundle and its copies of the pictures. `node_modules` never ships.

## The fence

The one-way dependency law of this repository holds: the SETTLE site may depend on this package; this package
depends on nothing in the site. `tests/package.test.mjs` checks it imports settle-see by name and forks none of it.
