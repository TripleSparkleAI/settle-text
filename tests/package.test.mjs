// settle-text · the package's shape: an npm-shaped manifest, the two entry points, the React layer wrapping
// settle-see and never forking it, the docs and examples the README promises, and the prop defaults the README
// states.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const pkg = JSON.parse(read('package.json'));

test('package.json: the name, the two exports, a React peer, settle-see as the one dependency, private, no publish', () => {
  assert.equal(pkg.name, 'settle-text');
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.private, true, 'nothing is published (the LOCAL-ONLY LAW); PUBLISHING.md says what it would take');
  assert.deepEqual(pkg.exports, { '.': './src/index.js', './react': './react/index.js' });
  assert.deepEqual(Object.keys(pkg.peerDependencies), ['react', 'react-dom']);
  assert.deepEqual(Object.keys(pkg.dependencies), ['settle-see']);
  assert.equal(pkg.sideEffects, false);
  for (const f of pkg.files) assert.ok(existsSync(join(ROOT, f)), `files: ${f}`);
  assert.ok(!pkg.scripts.publish && !pkg.scripts.prepublishOnly, 'no publish script');
});

test('the entry points resolve and the pure half runs in node', async () => {
  const m = await import('../src/index.js');
  for (const k of ['textGrid', 'wrapLines', 'textSpec', 'sampleLights', 'sampleCoverage', 'sourcePaint', 'createHeat', 'textPitch', 'imagePitch', 'parseColour']) assert.equal(typeof m[k], 'function', k);
  // the React entry names the four components, the sequence and the heading (not imported here: react is a peer, and node has no DOM)
  const idx = read('react/index.js');
  for (const c of ['SettleText', 'SettleImage', 'SettleVector', 'SettleBackground', 'SettleSequence', 'SettleHeading', 'SettleLink']) assert.match(idx, new RegExp(`export \\{ ${c} \\}`));
});

test('WRAP, NEVER FORK: the React layer imports settle-see by name and this package carries no copy of its engine', () => {
  const files = readdirSync(join(ROOT, 'react')).filter((f) => /\.(jsx?|mjs)$/.test(f));
  const srcs = files.map((f) => read(`react/${f}`)).join('\n');
  assert.match(srcs, /from 'settle-see\/react'/, 'the Settle component comes from settle-see/react');
  assert.match(srcs, /from 'settle-see'/, 'makeCanvas comes from settle-see');
  // nothing here redefines the physics: no Gibbs sweep, no renderer, no ticker
  for (const name of ['createField', 'createRenderer', 'addTick', 'fillCells', 'glrender']) assert.ok(!srcs.includes(name), `${name} is settle-see's, not ours`);
  for (const f of readdirSync(join(ROOT, 'src'))) assert.ok(!/field|render|ticker|mount/.test(f), `src/${f} would be a fork`);
  // exactly one place mounts <Settle>: Lights.jsx
  const mounts = files.filter((f) => /<Settle\b/.test(read(`react/${f}`)));
  assert.deepEqual(mounts, ['Lights.jsx']);
});

test('the public API stays simple: no films, audio, pulse bus, master beat or drag in any component prop list', () => {
  const srcs = ['SettleText.jsx', 'SettleImage.jsx', 'SettleVector.jsx', 'SettleBackground.jsx', 'SettleSequence.jsx', 'SettleHeading.jsx', 'SettleLink.jsx', 'Lights.jsx'].map((f) => read(`react/${f}`)).join('\n');
  // the prop NAMES (a default value may say 'morph': SettleText's transition is 'morph' by default, a word for the
  // reader, while settle-see's morph machinery stays behind Lights)
  const names = srcs.match(/export function \w+\(\{([\s\S]*?)\}\)/g).join('\n').split('\n').map((l) => (l.match(/^\s*(?:\.\.\.)?(\w+)/) || [])[1]).filter(Boolean);
  for (const word of ['film', 'audio', 'trueTime', 'emitPulse', 'masterBeat', 'drag', 'morph']) {
    assert.ok(!names.includes(word), `${word} is not a prop`);
  }
  // and the engine is told to keep its hands off the picture
  const lights = read('react/Lights.jsx');
  assert.match(lights, /poke=\{false\}/, 'the pointer does not scribble on text');
  assert.match(lights, /background="transparent"/, 'no plate: the lights sit on the page');
  assert.match(lights, /quality=\{false\}/);
  assert.match(lights, /still=\{frozen \|\| undefined\}/, 'reduced motion and still mode use settle-see\'s still');
  assert.match(lights, /rest=\{restNow \|\| frozen\}/, 'settle-see\'s rest in rest mode, under the page\'s thinning, and always when still (a still settle must draw nothing after its one picture)');
  assert.match(lights, /paused=\{paused \|\| !onScreen\}/, 'off screen it pauses');
});

test('the README documents each component with a props table, the quick start, the one-paragraph how, and measured performance', () => {
  const md = read('README.md');
  for (const h of ['## Quick start', '## SettleText', '## SettleSequence', '## SettleHeading', '## SettleLink', '## SettleImage', '## SettleVector', '## SettleBackground', '## How it works, in one paragraph', '## Performance', '## Access', '## Licence', '## Naming']) assert.ok(md.includes(h), h);
  assert.match(md, /npm install github:TripleSparkleAI\/settle-text/, 'the install line names its repository (lane REPOSPUSH)');
  assert.match(md, /\| prop \| default \| what it does \|/, 'a props table');
  assert.ok(!/\\(frac|sum|beta)|\$\$/.test(md), 'no equations in the README');
  assert.doesNotMatch(md, /[–—]/, 'no en or em dashes');
  for (const f of ['docs/RECIPES.md', 'PUBLISHING.md', 'CHANGELOG.md', 'examples/HeroTitle.jsx', 'examples/NeonSign.jsx', 'examples/LogoFromSvg.jsx', 'examples/PhotoAsLights.jsx', 'examples/PageBackground.jsx', 'examples/ChangingWords.jsx', 'examples/Headings.jsx', 'examples/LinksThatSettle.jsx', 'RELEASE_CHECKLIST.md', 'examples/demo/App.jsx', 'examples/demo/run.sh']) assert.ok(existsSync(join(ROOT, f)), f);
});

test('the prop defaults the README states are the ones the components carry', () => {
  const text = read('react/SettleText.jsx');
  assert.match(text, /size = 64,/);
  assert.match(text, /resolution = pick\(resolution, 'resolution', ctx, 'auto'\);/, 'resolution defaults to auto');
  assert.match(text, /align = 'left',/);
  assert.match(text, /wrap = true,/);
  assert.match(text, /defaultColor = PALETTE\.text,/);
  // THE ALIVE DEFAULT: no component pins still or breathe in its signature; Lights resolves them, and still is false
  for (const f of ['SettleText.jsx', 'SettleImage.jsx', 'SettleVector.jsx', 'SettleBackground.jsx']) {
    const src = read(`react/${f}`);
    assert.doesNotMatch(src, /still = true,/, `${f}: alive by default, never still by default`);
    assert.doesNotMatch(src, /breathe = (true|false),/, `${f}: breathe folds into resettle`);
    assert.match(src, /\bresettle\b/, `${f}: takes the re-settle schedule`);
  }
  const lights = read('react/Lights.jsx');
  assert.match(lights, /pick\(still, 'still', ctx, false\)/, 'still is the one opt-out, false by default');
  assert.match(lights, /pick\(rest, 'rest', ctx, false\)/, 'rest is off by default: the field keeps sweeping');
  assert.match(lights, /resting \? HEAT\.cold : ALIVE\.temperature/, 'the simmer temperature is the alive default');
  const bg = read('react/SettleBackground.jsx');
  assert.match(bg, /resettle = BACKGROUND\.resettle,/, 'a background re-settles on a slower schedule');
  assert.match(bg, /fit = 'cover',/);
  const img = read('react/SettleImage.jsx');
  assert.match(img, /threshold = 0\.5,/);
  assert.match(img, /dither = false,/);
  assert.match(img, /fit = 'contain',/);
  assert.match(img, /resolution = pick\(resolution, 'resolution', ctx, 'auto'\);/);
});

test('every example file is in the demo, and every recipe in docs/RECIPES.md names a file that exists', () => {
  const app = read('examples/demo/App.jsx');
  const examples = readdirSync(join(ROOT, 'examples')).filter((f) => f.endsWith('.jsx'));
  assert.ok(examples.length >= 7, examples.join(', '));
  for (const f of examples) assert.match(app, new RegExp(`from '\\.\\./${f.replace('.', '\\.')}'`), `the demo imports ${f}`);
  const recipes = read('docs/RECIPES.md');
  const named = [...recipes.matchAll(/^## .*\(`(examples\/[A-Za-z]+\.jsx)`\)$/gm)].map((m) => m[1]);
  assert.equal(named.length, examples.length, 'one recipe per example file');
  for (const f of named) assert.ok(existsSync(join(ROOT, f)), f);
  const count = recipes.match(/^(\w+) things people make/m)[1];
  const words = { five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  assert.equal(words[count.toLowerCase()], named.length, 'the recipe count in the first line is the real count');
});

// THE LICENCE (the navigator, 2026-10-09: MIT for all): the field, the file and the README agree, and no placeholder is left
test('the licence is MIT: the package.json field, the LICENSE file and the README say so, and no placeholder is left', () => {
  assert.equal(pkg.license, 'MIT');
  assert.match(read('LICENSE'), /^MIT License\n\nCopyright \(c\) 2026 /);
  assert.match(read('README.md'), /## Licence\n\nMIT\./);
  assert.doesNotMatch(read('README.md'), /PLACEHOLDER/);
  assert.doesNotMatch(read('RELEASE_CHECKLIST.md'), /OPEN: the licence/);
});

test('the package version, the CHANGELOG\'s top entry and the lock agree', () => {
  const top = read('CHANGELOG.md').match(/^## (\d+\.\d+\.\d+) /m)[1];
  assert.equal(top, pkg.version);
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
});

test('a pack never carries a built demo: examples/demo/.npmignore names dist/', () => {
  assert.match(read('examples/demo/.npmignore'), /^dist\/$/m);
  assert.ok(pkg.files.includes('examples'), 'the examples ship, so the ignore file is what keeps the build out');
});

test('the demo runs outside this repository: its own manifest, an install fallback in run.sh, settle-see from node_modules', () => {
  const demo = JSON.parse(read('examples/demo/package.json'));
  assert.equal(demo.private, true);
  assert.deepEqual(Object.keys(demo.devDependencies).sort(), ['@vitejs/plugin-react', 'react', 'react-dom', 'vite']);
  const run = read('examples/demo/run.sh');
  assert.match(run, /ln -sfn "\$SITE\/node_modules"/, 'inside the research repository it borrows the site');
  assert.match(run, /npm install --no-audit --no-fund/, 'anywhere else it installs');
  assert.match(read('examples/demo/vite.config.js'), /node_modules\/settle-see\//);
});
