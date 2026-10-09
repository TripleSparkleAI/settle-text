# Changelog

## 0.5.0 (2026-10-07)

- **THE AMBIENT SHIMMER.** Every alive piece of text keeps its own small schedule: it deals SHIMMERS from its own
  deck (THE DECK RULE: every card once a round, never twice in a row), on its own period (the preset's gap times 0.75
  to 1.25) and its own phase (the first shimmer 0.15 to 1 period after mount), so no two pieces move together. About
  1 card in 10 is the full re-settle; the rest are small effects. Measured why 0.4.0 looked still on #/settletext
  (`SETTLE/runs/stxshimmer/MEASURED.md`): every settle was alive and drawing, but the simmer changed about 2% of the
  lit lights a look and the one visible event, the re-settle, came every 9 to 13 s per piece.
- THE RANGE, `AMBIENT_EFFECTS` (exported): `twinkle`, `glint`, `ripple`, `breath`, `haze`, `tilt`, `crackle`,
  `sparks`, `glow`, `word`, `flurry`, `line` and `resettle`, from the faintest to the boldest, each with a one-line
  description, a default strength and a length. Every effect is drawn by the settle itself: settle-see's draw-only
  flash, its weather knobs (heat, lean, soften), or a local melt through its per-light leans. None is a CSS animation.
- THE PRESETS, `AMBIENT_PRESETS`: `'whisper'` (four effects, about every 5 s, 5% re-settles), `'gentle'` (the default:
  nine, about every 3.5 s, 10%), `'lively'` (all twelve, about every 2.4 s, 12%, a little stronger).
- New props on every component: `ambient` (`true`, `false`, a preset, an effect name, a list, or `{ preset, every,
  jitter, resettleShare, effects, strength }`), its alias `shimmer`, and `onShimmer`. `SettleBackground` deals
  `'whisper'`. `SettleTextDefaults` takes `ambient` and `maxShimmers`.
- THE RE-SETTLE: with the shimmer on (the default) the re-settle is a card in the deck. A `resettle` given as an
  interval, `{ every }` or a function keeps 0.4.0's clock, and the deck then deals only the small effects;
  `resettle={false}` takes it out; `ambient={false}` is 0.4.0's alive default exactly.
- THE CROWD: at most 6 small shimmers run at once on a page (`maxShimmers`), the re-settles keep their cap of 4, and a
  card that finds its cap full waits its turn. A crowd never goes still.
- THE LIMITS (WCAG 2.3.1): a flash effect lights each light at most once a shimmer, at most 0.6 of the way to white,
  and one piece's shimmers are at least 1.2 s apart. Still and reduced motion: no shimmer. Off screen and in a hidden
  tab: paused.
- The box of every component carries `data-settle-ambient` (its deck) and `data-settle-shimmer` (`'<count> <name>'`);
  `globalThis.__settleTextAmbient()` reads the page's tally. `useAmbient` is exported from `settle-text/react`, and the
  SETTLE site's own page titles use it.
- RESOLUTION: `'ultra'` is retired (the navigator: "we don't need ultra mode for the resolution"). `'high'` is the top
  of both ladders; a caller passing `'ultra'` gets `'high'` and, outside a production build, one console warning per
  page (`RETIRED_RESOLUTIONS`, `retiredResolution`). `'auto'` keeps its own bounds.

## 0.4.0 (2026-10-06)

- **ALIVE BY DEFAULT.** Every component (`SettleText`, `SettleHeading`, `SettleLink`, `SettleSequence`,
  `SettleImage`, `SettleVector`, `SettleBackground`) now simmers and re-settles unless told otherwise. 0.3.0 settled
  once, rested at an exact cold and drew zero frames until a breath every 7 to 11 s; 0.4.0 keeps the lights at a warm
  `temperature` (0.6, was 0.45) and keeps sweeping (12 a second), and on a schedule the heat ramps up over 400 ms, the
  words scatter a little and cool back over 2.8 s at 24 sweeps a second.
- `resettle` sets the schedule: `true` (every 6 to 12 s, the first one 2 to 9 s after mount), `false`, an interval in
  ms, `{ every, jitter, level, kind, cool }` (`kind` `'heat'`, `'shake'` or `'mix'`), or `(n) => ms`. `breathe` still
  works and is read as `resettle` when `resettle` is not given.
- `still` is the one static flag (it was already the reduced-motion still): drawn once, never moves, no frame work.
  `SettleBackground` was still by default and is now alive like the rest, on a slower schedule (11 to 17 s).
- `rest` keeps the re-settles but draws nothing between them (0.3.0's resting picture). `intro` sets the heat at
  mount (`0`: the words there at once, then alive). `fps` and `simmerFps` set the sweep rates. `onResettle` fires at
  each re-settle.
- THE PAGE THINS ITSELF: an alive settle on screen joins a page-wide conductor, counted by its size (one per 16,000
  lights, 1 to 4, `weightOf`); with a bigger crowd on screen the simmer slows
  (to a floor of 4 sweeps a second) and the re-settles spread out, at most 4 run at once, and past 40 on screen each
  rests between its re-settles. It never turns static. Off screen and in a hidden tab nothing runs; reduced motion is
  still.
- `<SettleTextDefaults value>`: set any live or look prop once for a whole subtree (and `maxConcurrent`, the page's
  cap).
- COLOURS: each component has its own default from the SETTLE neon range (`PALETTE`: text and heading HYPER PINK,
  link LASER GREEN, sequence CYAN, image HYPER PINK, vector LIME, background VIOLET); `pink` and `green` are new
  neon words. `palette` chooses `'single'`, `'meaning'` (the hero's colour code), `'duo'` (with `offColor`), a named
  gradient (`sunset`, `aurora`, `neon`, `ice`, `fire`), a list of colours or `{ colors, direction }`. `dim` lights the
  dark lights so the whole grid shows.
- RESOLUTION: the default is `'auto'`, the SETTLE site's title tuning (about 3.75 CSS px a light, the hero's pitch;
  24 to 48 lights a letter box) for text and about 3 px a light (96 to 384 across) for a picture. Measured against
  the hero, `'medium'` drew a 96 px title at 4.8 px a light and a 600 px picture at 4.7. New presets `'chunky'` (8 per
  em, 40 across) and `'ultra'` (48 per em, 384 across).
- The pure half gains `src/alive.js` (`ALIVE`, `resettleOf`, `resettleDelay`, `resettleLevel`, `thinFor`,
  `simmerFpsFor`, `weightOf`, `createConductor`) and `src/palette.js` (`NEON_RANGE`, `PALETTE`, `GRADIENTS`, `paletteOf`,
  `gradientStops`, `gradientPaint`); `createHeat`'s `kick` takes a ramp and its own cooling time.
- Tests: 91 (was 68), each new one proven able to fail by an aimed mutation (`SETTLE/runs/stxalive/mutate_check.py`).

## 0.3.0 (2026-10-05)

- `<SettleHeading level text>`: a real `<h1>` to `<h6>` drawn as a settle, with the words as its accessible name
  (a visually hidden span; the canvas is `aria-hidden`). `level` sets the element and the size; `as` renders another
  element with `role="heading"` and `aria-level`; `size` takes px, any CSS length, or `false` for your own CSS;
  `wrap` is on; every `SettleText` prop passes through, so a new text morphs.
- The six levels are CSS clamps, the SETTLE site's own headings at the top (1: 44 to 92 px, 2: 32 to 52 px, 3: 27 to
  40 px) and smaller at every width down to level 6 (16 to 20 px). The lights follow the size the browser works out
  with the site's title tuning: a 1.25 em letter box at about 3.75 px a light, 24 to 48 lights a box.
- `hover` on `SettleText`, `SettleHeading`, `SettleImage` and `SettleVector` (and `SettleSequence` through its text):
  `true` (0.6) or a level 0 to 1. The lights take that heat, the same kick as a breath, when the pointer enters or
  keyboard focus reaches the link, button, summary or label they sit in (else their own box); at most once per
  250 ms; never under reduced motion or `still`. Off by default.
- `width="fit"` on `SettleText`: one line exactly as wide as its words in the face, measured again when the font
  loads (`fitWidth` in the pure half).
- `<SettleLink href text>`: an `<a class="settle-link">`, inline-block, holding one `SettleText` with hover 0.7, width
  `'fit'` and no wrap; the anchor props go on the `<a>`, `target="_blank"` gets `rel="noopener noreferrer"`; the
  accessible name is the text. An eighth recipe, `examples/LinksThatSettle.jsx`.
- The pure half (`HEADING`, `headingLevel`, `headingCss`, `headingFontPx`, `headingSize`, `headingPitch`,
  `headingLights`, `headingElement`, `headingText`) is exported from `settle-text` and tested in node.
- A seventh recipe and example, `examples/Headings.jsx`; the demo now renders the headings and the changing-words
  recipes too (it was missing `ChangingWords`).
- Release checks: `RELEASE_CHECKLIST.md`; a README Licence section with the open question marked as a placeholder;
  `examples/demo/.npmignore` keeps a built demo out of a pack; tests that hold the version, the CHANGELOG and the
  lock together, and every example in the demo and in the recipes.
- The demo runs outside this repository: `examples/demo/package.json` names its dependencies, `run.sh` installs
  them when there is no SETTLE site to borrow from, and the vite config finds settle-see in the package's
  `node_modules` when there is no sibling folder. Checked on an export: tests 62 of 62, the demo builds.
- Corrected: `size` is a font size (a capital stands at the face's cap height, about 0.7 of it), not the capitals'
  height; SettleImage's medium is 128 lights across, as the README said; the README's link to settle-see works
  outside this repository too.

## 0.2.0 (2026-10-04)

- A new `text` on `SettleText` MORPHS: the lights settle from the old words into the new ones (settle-see's own
  morph, wrapped). `transition` (`'morph'` default, `'cut'`, or `{ kind, duration, frames }`) and `duration` (ms,
  1200) choose how. A text that needs a new grid settles fresh; under reduced motion every change is a cut.
- `<SettleSequence items interval loop onStep onDone paused>`: a list of texts on a timer, once or looping, each
  settling out of the last. Paused off screen and in a hidden tab, keeping the time left.
- The pure clock behind it (`transitionOf`, `createSequencer`, `sequenceAt`, `intervalFor`) is exported and runs
  in node with an injectable timer.
- A sixth recipe, `examples/ChangingWords.jsx`.

## 0.1.0 (2026-10-03)

The first cut: the fourth SETTLE package, for designers and programmers who want the effect and not the theory.

- `<SettleText>`: words in your font as a live settle of lights. Props for the colour, the size, the resolution
  (lights per em: low 12, medium 20, high 32, or a pitch in px), the glow, the alignment, the wrap, the rest
  temperature, the settle time, the idle breath, a still mode and an `onSettled` event. Screen readers hear the
  words; the canvas is decorative.
- `<SettleImage>`: a picture as lights, by brightness, with a threshold or a Floyd-Steinberg dither, one colour or
  the picture's own colours per light (`colors="source"`).
- `<SettleVector>`: an SVG (markup, a path d, a list of paths, or a URL) as lights, by ink coverage.
- `<SettleBackground>`: a full-bleed settle behind children, from any of the three, still by default (drawn once,
  settled once, then no frame work).
- The defaults are the SETTLE site's measured title tuning: a letter box of 1.25 em, a 3.75 px pitch clamped
  between 24 and 48 lights a box (restated as 20 lights per em), glow 0.7, wide scripts at 1.6 times the lights and
  weight 400.
- The engine is settle-see, wrapped and never forked; the package exposes no films, audio, pulse bus or master
  beat.
- A node test suite over the pure half (the grid, the wrap, the presets, the samplers, the colour words, the heat
  curve) and the package's shape; a Vite demo of every recipe; a perf tool that reads settle-see's own meter.
