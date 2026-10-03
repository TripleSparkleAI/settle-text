# settle-text

Render text, images and vectors as a live settle of lights, in React. You give it words and a font. It gives you
a grid of neon dots that comes out of noise into your words, rests, and breathes now and then. No theory needed.

![Render text as light, as a settle of pink lights](docs/hero-title.png)

## Quick start

```sh
npm install github:triplesparkle/settle-text
```

That installs it from its repository, `github.com/triplesparkle/settle-text`, and settle-see from its own. Both
repositories are private for now, so the install needs access until they are made public. Nothing is on the npm
registry (PUBLISHING.md). To run its tests, clone it: `git clone https://github.com/triplesparkle/settle-text`,
`cd settle-text`, `npm install && npm test`.

```jsx
import { SettleText } from 'settle-text/react';

<SettleText text="What?" font='"Space Grotesk", sans-serif' />
```

That is the whole thing. Three more lines cover the rest of the package:

```jsx
import { SettleImage, SettleVector, SettleBackground } from 'settle-text/react';

<SettleImage src="/photo.jpg" alt="a photo" dither colors="source" />
<SettleVector svg={markup} color="lime" alt="a logo" />
<SettleBackground src="/photo.jpg" fit="cover">your content</SettleBackground>
```

Try every recipe on one page: `bash examples/demo/run.sh` (serves on 5240). Recipes with their code:
[docs/RECIPES.md](docs/RECIPES.md); the runnable files are in [examples/](examples/).

## SettleText

Words in your font. The capitals stand about `size` tall; the dots are `resolution` lights per em.

| prop | default | what it does |
|---|---|---|
| `text` | required | the words |
| `font` | `'sans-serif'` | a CSS font family list, or `{ family, weight }`; it waits for `document.fonts` to load the face and re-measures |
| `weight` | `700` (`400` for kana, Han, Devanagari) | the face's weight |
| `size` | `64` | the font size in CSS px |
| `color` | `'#ff2fa0'` | any CSS colour, or a neon word: `rose indigo amber cyan orange lime violet ice mint red` |
| `background` | none | a CSS colour behind the lights; by default they sit on whatever is behind the box |
| `resolution` | `'medium'` | `'low'` (12 lights per em), `'medium'` (20), `'high'` (32), or a number of lights per em |
| `pitch` | none | CSS px per light; overrides `resolution` |
| `glow` | `0.7` (`0.5` wide scripts) | the bloom; `0` for raw dots, `1.5` for a sign |
| `align` | `'left'` | `'left'`, `'center'`, `'right'` |
| `wrap` | `true` | break at spaces (and after a hyphen) to fit the box; `false` shrinks to one line |
| `width` | the container's | a fixed width in CSS px |
| `temperature` | `0.45` | how noisy the lights are at rest: `0.3` frozen, `0.45` a faint waver, `0.8` restless |
| `settleTime` | `1500` | ms from noise to words |
| `breathe` | `true` | the idle re-settle: `true` (every 7 to 11 s), `false`, a number of seconds, or `{ every: [s, s], level }` |
| `paused` | `false` | your own pause |
| `still` | `false` | draw the words once as lights; no live settle, no frame work |
| `onSettled` | none | `({ overlap, lights, still })`, once per text, when the lights agree with the words |
| `label` | the text | the screen-reader words (a visually hidden span; the canvas is `aria-hidden`) |
| `decorative` | `false` | hide the whole thing from assistive tech |
| `className`, `style` | | the outer box |

What it looks like: at `'medium'` a 72 px title is a 25-light box with a 15-light capital, the SETTLE site's own
headings. `'low'` is a chunky dot-matrix sign; `'high'` reads like type with a glow.

## SettleImage

A picture as lights, by brightness. Its `resolution` is lights across (a text's is a height).

| prop | default | what it does |
|---|---|---|
| `src` or `image` | required | a URL, an `<img>`, an `ImageBitmap`, a canvas or an `ImageData` |
| `alt` | | the screen-reader words; without it (and without `label`) the picture is decorative |
| `resolution` | `'medium'` | `'low'` (64 across), `'medium'` (128), `'high'` (256), or a number |
| `pitch` | none | CSS px per light; overrides `resolution` |
| `width`, `height` | the container's; the picture's aspect | CSS px |
| `fit` | `'contain'` | `'cover'` when a height is given |
| `threshold` | `0.5` | a light brighter than this is lit |
| `dither` | `false` | Floyd-Steinberg: greys become densities (a photo) |
| `invert` | `false` | dark becomes lit (a dark logo on a light ground) |
| `color` | `'#ff2fa0'` | one colour for every lit light |
| `colors` | none | `'source'`: every light keeps its own pixel's colour |
| `onError` | none | called with a message when the image cannot be read (a cross-origin image without CORS) |
| `glow`, `temperature`, `settleTime`, `breathe`, `paused`, `still`, `onSettled`, `label`, `decorative`, `className`, `style` | as `SettleText` | |

## SettleVector

An SVG as lights, by coverage: a light is lit wherever the ink covers it, whatever the ink's colour.

| prop | default | what it does |
|---|---|---|
| `svg` | | SVG markup, a path `d` string, or a URL ending in `.svg` |
| `paths` | | a list of path `d` strings (an alternative to `svg`) |
| `viewBox` | `[0, 0, 100, 100]` | for a path or paths; markup carries its own |
| `stroke` | none (filled) | a stroke width in viewBox units, for a path |
| `alt` | | the screen-reader words |
| the rest | as `SettleImage` | `resolution`, `pitch`, `width`, `height`, `fit`, `threshold`, `dither`, `invert`, `color`, `colors`, `onError`, and the live props |

## SettleBackground

A full-bleed settle behind your content, from a picture, an SVG or words.

| prop | default | what it does |
|---|---|---|
| `src` / `image`, `svg` / `paths`, `text` + `font` | one of them | the source |
| `fit` | `'cover'` | or `'contain'` |
| `opacity` | `1` | the whole layer |
| `still` | `true` | drawn once, settled once, then no frame work: the CPU-lovely mode. `false` for a live one |
| `breathe` | `false` | for a live one |
| `resolution` | `'medium'` | lights across |
| `children` | | your content, drawn on top |
| the rest | as the source component | `color`, `colors`, `glow`, `threshold`, `dither`, `invert`, `temperature`, `settleTime`, `paused`, `className`, `style` |

Give the box a height (`style={{ minHeight: 360 }}`) or let the children size it.

## How it works, in one paragraph

Every dot is a light with a coin in it. Each light has a lean: toward on where your word is, toward off where it
is not. Each light also listens to its four neighbours and leans toward agreeing with them. At the start the
coins are hot and the lights flip at random, so you see noise. The temperature falls, the coins calm down, and
each light settles where its lean and its neighbours pull it: your word appears out of the noise. Once it is cold
and still, the engine stops doing anything at all. A breath warms it a little and the word re-settles. That is
all the physics there is, and it is settle-see's (the SETTLE project's drawing library); this package only
decides the grid, the font, the colour and when to breathe.

## Performance

Measured 2026-10-03 14:54 AEST on an Apple M5 Max (macOS 26.5, high power mode, load 8.15 on 18 cores during
the run, so other work was present), headless Chromium through Playwright, the demo's 960 px column, a 64 px line
of text, the minimum over 3 rounds of the live phase (settle-see's own meter, `handle.perf`). Numbers are per
picture, per frame; the last column multiplies by 24 fps.

| preset | grid | lights | physics ms/frame | draw ms/frame | at 24 fps |
|---|---|---|---|---|---|
| text, low | 180x30 | 5,400 | 0.05 | 2.01 | 49 ms of CPU a second (4.9% of one core) |
| text, medium | 300x48 | 14,400 | 0.06 | 2.47 | 61 ms of CPU a second (6.1% of one core) |
| text, high | 480x76 | 36,480 | 0.17 | 1.17 | 32 ms of CPU a second (3.2% of one core) |
| image, medium, 480 px, dithered, source colours | 128x70 | 8,960 | 0.07 | 1.56 | 39 ms of CPU a second (3.9% of one core) |

Two things the table shows. The physics is cheap at every preset (a Gibbs sweep over 36,480 lights is 0.17 ms);
the draw is where the time goes, and it is a few milliseconds at most. And the draw cost does not climb with the
preset here, because the renderer writes one pixel per light and lets the GPU scale it, so a 1 to 2 ms draw is
mostly fixed compositing cost. Treat the numbers as a ceiling for the live phase: once settled the picture rests
and costs nothing, and the live phase lasts about `settleTime` after a mount or a breath.

**Still mode** (`still`, the default for a background): after the flip, every settle on the ladder drew **0
frames in 5 seconds**. The whole cost is the one draw.

Re-measure on your machine: start the demo, then `python3 tools/perf_check.py --base http://localhost:5240`.

## Access

The words are real text: `<SettleText>` puts `label` (default `text`) in a visually hidden span and marks the
canvas `aria-hidden`, so a heading built on it has its name and a search engine reads it. A picture or a vector
names itself with `alt`; without one it is decorative. `prefers-reduced-motion: reduce` turns every component
into its still form: the picture is simply there.

## Naming

The package is **settle-text**: the thing it does is render text (and pictures) as a settle. The navigator's
alternative was **settle-sdm-text**. The effect is a settle of p-bits (lights with coins, leans and pulls); it
does not use a sparse distributed memory, so "sdm" in the name would promise a mechanism that is not here. If the
navigator prefers the longer name anyway, it is one line in `package.json` and the site's aliases.

## Tests

`npm test` runs the pure half in node: the grid and the wrap, the presets, the picture samplers against small
known inputs (a diagonal, a flat grey under dither, a black shape by coverage, source colours), the colour words,
the heat curve, and the package's shape (the exports, wrap-never-fork, the public API staying simple, this
README's sections and the defaults it states).

## Layout

```
settle-text/
  package.json         name settle-text · exports . and ./react · react peer · settle-see dependency · private
  src/                 the pure half: presets, layout, colour, raster, heat (node runs it)
  react/               the React half: Lights (the one place settle-see is mounted), the four components, hooks
  tests/               node --test
  docs/RECIPES.md      five recipes with their code
  examples/            the recipes as runnable files, and demo/ (a Vite app of all of them)
  tools/perf_check.py  the cost of each preset, read from settle-see's meter in a real browser
  PUBLISHING.md        what publishing would take
  CHANGELOG.md
```

The engine is [settle-see](../settle-see/) (`../settle-see`, a `file:` dependency), wrapped and never forked.
