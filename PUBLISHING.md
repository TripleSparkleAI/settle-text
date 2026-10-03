# Publishing settle-text (notes; nothing is published)

Nothing here is published, by the LOCAL-ONLY LAW of `sites/CLAUDE.md`: no npm, no registry, no public URL.
`package.json` carries `"private": true`, which makes `npm publish` refuse. This file records what publishing
would take, so the day it is wanted the work is a list and not a discovery.

## What works today, from this repository

- The SETTLE site imports it by name (`settle-text`, `settle-text/react`) through vite aliases that point at this
  folder (`sites/settle-site/vite.config.js`).
- The demo (`examples/demo`) does the same through its own `vite.config.js`, and borrows the site's `node_modules`
  for vite, the React plugin and React through a symlink that `run.sh` makes.
- `npm test` runs the pure half in node. `npm install` in this folder links `settle-see` from the sibling folder
  (`"settle-see": "file:../settle-see"`).

## What publishing would take

1. **settle-see first.** settle-text depends on settle-see, which is also unpublished and `private`. Either publish
   settle-see (then `"settle-see": "^0.1.0"` here) or vendor it (copy `settle-see/src` and `settle-see/react` into
   this package under `vendor/` and rewrite the five imports). A peer dependency would be wrong: a consumer should
   not have to know the engine exists.
2. **A licence.** settle-see declares none (no `license` field, no LICENSE file) and settle-rs has none either;
   settle-mcp is MIT. This package follows settle-see today and declares none. A published package needs one, and
   the choice is the navigator's; MIT would match settle-mcp and the upstream ds4 engine this project rests on.
3. **A build.** The sources are plain ES modules and JSX. Consumers' bundlers handle JSX only when told to, so a
   published package ships compiled JavaScript: `react/*.jsx` through esbuild or Babel into `dist/react/`, with
   `exports` pointing at `dist/`. Keep the source in `files` too, for source maps and for readers.
4. **Types.** A `types/index.d.ts` for the four components and the pure exports, hand-written (the props tables in
   the README are the spec), with `"types"` in `exports`.
5. **The React range.** `peerDependencies` says `react >=18`; it is tested on 18.3 only (the site's React). Test on
   19 before claiming it.
6. **The name.** `settle-text` is the chosen name; `settle-sdm-text` was the alternative the navigator offered and
   is recorded in the README's naming note. Check the registry for a clash before the first publish.
7. **The examples' assets.** `examples/demo/public/galileo-moon.png` is Galileo's 1610 drawing (public domain);
   `hero-hot.jpg` is this project's own BRAND frame. Both may ship.
8. **The demo's dependencies.** `examples/demo` would get its own `package.json` with vite, `@vitejs/plugin-react`,
   react and react-dom as devDependencies, in place of the symlink `run.sh` makes.

## The fence

The one-way dependency law of this repository holds: the SETTLE site may depend on this package; this package
depends on nothing in the site. `tests/package.test.mjs` checks it imports settle-see by name and forks none of it.
