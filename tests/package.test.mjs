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
  // the React entry names the four components (not imported here: react is a peer, and node has no DOM)
  const idx = read('react/index.js');
  for (const c of ['SettleText', 'SettleImage', 'SettleVector', 'SettleBackground']) assert.match(idx, new RegExp(`export \\{ ${c} \\}`));
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
  const srcs = ['SettleText.jsx', 'SettleImage.jsx', 'SettleVector.jsx', 'SettleBackground.jsx', 'Lights.jsx'].map((f) => read(`react/${f}`)).join('\n');
  for (const word of ['film', 'audio', 'trueTime', 'emitPulse', 'masterBeat', 'drag', 'morph']) {
    const props = srcs.match(/export function \w+\(\{([\s\S]*?)\}\)/g).join('\n');
    assert.ok(!new RegExp(`\\b${word}\\b`).test(props), `${word} is not a prop`);
  }
  // and the engine is told to keep its hands off the picture
  const lights = read('react/Lights.jsx');
  assert.match(lights, /poke=\{false\}/, 'the pointer does not scribble on text');
  assert.match(lights, /background="transparent"/, 'no plate: the lights sit on the page');
  assert.match(lights, /quality=\{false\}/);
  assert.match(lights, /still=\{frozen \|\| undefined\}/, 'reduced motion and still mode use settle-see\'s still');
  assert.match(lights, /paused=\{paused \|\| !onScreen\}/, 'off screen it pauses');
});

test('the README documents each component with a props table, the quick start, the one-paragraph how, and measured performance', () => {
  const md = read('README.md');
  for (const h of ['## Quick start', '## SettleText', '## SettleImage', '## SettleVector', '## SettleBackground', '## How it works, in one paragraph', '## Performance', '## Naming']) assert.ok(md.includes(h), h);
  assert.match(md, /npm install github:triplesparkle\/settle-text/, 'the install line names its repository (lane REPOSPUSH)');
  assert.match(md, /\| prop \| default \| what it does \|/, 'a props table');
  assert.ok(!/\\(frac|sum|beta)|\$\$/.test(md), 'no equations in the README');
  assert.doesNotMatch(md, /[–—]/, 'no en or em dashes');
  for (const f of ['docs/RECIPES.md', 'PUBLISHING.md', 'CHANGELOG.md', 'examples/HeroTitle.jsx', 'examples/NeonSign.jsx', 'examples/LogoFromSvg.jsx', 'examples/PhotoAsLights.jsx', 'examples/PageBackground.jsx', 'examples/demo/App.jsx', 'examples/demo/run.sh']) assert.ok(existsSync(join(ROOT, f)), f);
});

test('the prop defaults the README states are the ones the components carry', () => {
  const text = read('react/SettleText.jsx');
  assert.match(text, /size = 64,/);
  assert.match(text, /resolution = 'medium',/);
  assert.match(text, /align = 'left',/);
  assert.match(text, /wrap = true,/);
  assert.match(text, /breathe = true,/);
  assert.match(text, /still = false,/);
  const bg = read('react/SettleBackground.jsx');
  assert.match(bg, /still = true,/, 'a background is still by default: the CPU-lovely mode');
  assert.match(bg, /resolution = 'medium',/);
  assert.match(bg, /fit = 'cover',/);
  assert.match(bg, /breathe = false,/);
  const img = read('react/SettleImage.jsx');
  assert.match(img, /threshold = 0\.5,/);
  assert.match(img, /dither = false,/);
  assert.match(img, /fit = 'contain',/);
});
