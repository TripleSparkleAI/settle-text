// settle-text · THE FACES (src/fonts.js and fonts/, 0.6.0): eight free faces, four clean and four sci-fi, each
// shipped with its licence and a README recording its source and its sha256 (THE PROVENANCE RULE), declared once in
// fonts/fonts.css, and Inter the default every component draws in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { FONTS, FONT_KINDS, DEFAULT_FONT, DEFAULT_FONT_KEY, fontOf } from '../src/index.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(join(ROOT, p))).digest('hex');

test('THE LIST: eight faces, four clean and four sci-fi, unique keys and names, Inter first and the default', () => {
  assert.equal(FONTS.length, 8);
  assert.deepEqual(FONT_KINDS, ['clean', 'scifi']);
  assert.deepEqual(FONTS.filter((f) => f.kind === 'clean').map((f) => f.name), ['Inter', 'Geist', 'Archivo', 'Space Grotesk']);
  assert.deepEqual(FONTS.filter((f) => f.kind === 'scifi').map((f) => f.name), ['Orbitron', 'Exo 2', 'Oxanium', 'Audiowide']);
  assert.equal(new Set(FONTS.map((f) => f.key)).size, 8);
  assert.equal(DEFAULT_FONT_KEY, 'inter');
  assert.equal(FONTS[0].key, 'inter');
  assert.match(DEFAULT_FONT, /^"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif$/, 'Inter, then the Helvetica family a page with no faces falls back to');
  for (const f of FONTS) assert.match(f.family, new RegExp(`^"${f.name}", `), `${f.key}: its stack starts with its own name`);
});

test('EVERY FACE carries its file (a real woff2), its OFL licence and a README with its source, date and sha256', () => {
  for (const f of FONTS) {
    assert.ok(existsSync(join(ROOT, f.file)), `${f.key}: ${f.file}`);
    const head = readFileSync(join(ROOT, f.file)).subarray(0, 4).toString('latin1');
    assert.equal(head, 'wOF2', `${f.key}: the file is a woff2`);
    assert.equal(f.licence, 'OFL-1.1', `${f.key}: a licence that allows redistribution and embedding`);
    assert.ok(existsSync(join(ROOT, f.licenceFile)), `${f.key}: ${f.licenceFile}`);
    assert.match(read(f.licenceFile), /SIL OPEN FONT LICENSE Version 1\.1/i, `${f.key}: the licence file is the OFL`);
    assert.match(read(f.licenceFile), /^Copyright /, `${f.key}: the licence names its copyright holders`);
    const md = read(f.readme);
    assert.match(md, /SIL Open Font License 1\.1/, `${f.key}: README names the licence`);
    assert.match(md, /\| fetched on \| 20\d\d-\d\d-\d\d \|/, `${f.key}: README dates the fetch`);
    assert.match(md, /https:\/\/fonts\.gstatic\.com\/\S+\.woff2/, `${f.key}: README gives the source URL`);
    assert.ok(md.includes(sha(f.file)), `${f.key}: README records the file's sha256`);
    assert.ok(md.includes(sha(f.licenceFile)), `${f.key}: README records the licence file's sha256`);
    assert.doesNotMatch(md, /[–—]/, `${f.key}: no en or em dashes`);
  }
});

test('NOTHING UNLISTED ships: every folder in fonts/ is a listed face, and every woff2 is a listed file', () => {
  const dirs = readdirSync(join(ROOT, 'fonts'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  assert.deepEqual(dirs, FONTS.map((f) => f.key).sort());
  for (const d of dirs) {
    for (const file of readdirSync(join(ROOT, 'fonts', d))) {
      if (file.endsWith('.woff2')) assert.ok(FONTS.some((f) => f.file === `fonts/${d}/${file}`), `fonts/${d}/${file} is listed`);
      else assert.ok(['OFL.txt', 'README.md'].includes(file), `fonts/${d}/${file} is a licence or a README`);
    }
  }
});

test('fonts.css declares exactly the listed faces, from the package\'s own files, with font-display: swap', () => {
  const css = read('fonts/fonts.css');
  const faces = [...css.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(faces.length, FONTS.length);
  for (const f of FONTS) {
    const block = faces.find((b) => b.includes(`font-family: '${f.name}';`));
    assert.ok(block, `${f.name} is declared`);
    assert.ok(block.includes(`url('./${f.file.slice('fonts/'.length)}') format('woff2')`), `${f.name} loads its own file`);
    assert.match(block, /font-display: swap;/);
    assert.ok(block.includes(`font-weight: ${f.weights};`), `${f.name}: the weights in the file`);
  }
  assert.doesNotMatch(css, /https?:\/\//, 'no face is fetched from a CDN at run time');
  assert.doesNotMatch(css, /[–—]/);
});

test('THE WEIGHT a face is drawn at is one its file has, so a canvas never fakes a bold', () => {
  for (const f of FONTS) {
    const [lo, hi] = f.weights.split(' ').map(Number);
    assert.ok(f.weight >= lo && f.weight <= (hi ?? lo), `${f.key}: ${f.weight} in ${f.weights}`);
  }
  assert.equal(fontOf('audiowide').weight, 400, 'Audiowide has one weight');
});

test('THE BUDGET: a face is a latin subset under 64 kB, and all eight together are under 256 kB', () => {
  let total = 0;
  for (const f of FONTS) {
    const n = statSync(join(ROOT, f.file)).size;
    assert.ok(n < 64 * 1024, `${f.key}: ${n} B`);
    total += n;
  }
  assert.ok(total < 256 * 1024, `${total} B`);
});

test('fontOf finds a face by key or name, ignoring case, and returns null for any other', () => {
  assert.deepEqual(fontOf('orbitron'), { family: FONTS.find((f) => f.key === 'orbitron').family, weight: 700 });
  assert.deepEqual(fontOf('Exo 2'), fontOf('exo-2'));
  assert.deepEqual(fontOf('INTER'), { family: DEFAULT_FONT, weight: 700 });
  assert.equal(fontOf('Comic Sans'), null);
  assert.equal(fontOf(undefined), null);
});

test('THE DEFAULT: SettleText and SettleHeading draw in Inter unless given a font, and SettleTextDefaults can set one', () => {
  for (const f of ['SettleText.jsx', 'SettleHeading.jsx']) {
    const src = read(`react/${f}`);
    assert.match(src, /pick\(fontProp, 'font', (ctx|useSettleTextDefaults\(\)), DEFAULT_FONT\)/, `${f}: the default font is DEFAULT_FONT`);
    assert.doesNotMatch(src, /font = 'sans-serif'/, `${f}: no bare sans-serif default`);
  }
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.exports['./fonts.css'], './fonts/fonts.css', 'a page imports the faces with one line');
  assert.ok(pkg.files.includes('fonts'), 'the faces ship with the package');
});
