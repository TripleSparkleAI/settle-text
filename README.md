<!-- settle-banner -->
```text
 ●● ●●● ●●● ●●● ●   ●●●     ●●● ●●● ● ● ●●●
●   ● · ·●  ·●  ●   ●        ●  ●   ● ●  ●
·●  ·· · ●   ●  ●   ●●  ●●●  ●  ●●   ●   ●
  ● ●·   ·   ●  ●   ●        ●  ●   ● ●  ●
·● ·●●●· ●   ●  ●●● ●●●      ●  ●●● ● ●  ●
↑↓↓↑↓↑↑↑↑↑ ●●●●●●●●
✦ text, images and vectors as a live settle of lights, in React
```

# settle-text

Render text, images and vectors as a live settle of lights, in React. You give it words and a font. It gives you
a grid of neon dots that comes out of noise into your words, keeps flickering, and every few seconds heats up,
scatters a little and settles back into the same words. No theory needed. Pass `still` when you want it to hold still.

![Render text as light, as a settle of pink lights](docs/hero-title.png)

## Quick start

```sh
npm install github:TripleSparkleAI/settle-text
```

That installs it from its public repository, `github.com/TripleSparkleAI/settle-text`, and settle-see from its own.
Nothing is on the npm registry (PUBLISHING.md). To run its tests, clone it: `git clone https://github.com/TripleSparkleAI/settle-text`,
`cd settle-text`, `npm install && npm test`.

```jsx
import 'settle-text/fonts.css';
import { SettleText } from 'settle-text/react';

<SettleText text="What?" />
```

That is the whole thing. The first line loads the eight faces the package ships (see Fonts); the words are drawn in
Inter unless you name another face. A few more lines cover the rest of the package:

```jsx
import { SettleHeading, SettleLink, SettleSequence, SettleImage, SettleVector, SettleBackground } from 'settle-text/react';

<SettleHeading level={2} text="Getting started" />
<SettleLink href="/docs" text="Docs" />
<SettleSequence items={['HELLO', 'BONJOUR', 'CIAO']} interval={2000} width={360} />
<SettleImage src="/photo.jpg" alt="a photo" dither colors="source" />
<SettleVector svg={markup} color="lime" alt="a logo" />
<SettleBackground src="/photo.jpg" fit="cover">your content</SettleBackground>
```

Every component is alive by default (the next section says exactly what that means and how to change it), and
`still` is the one flag that makes it static:

```jsx
<SettleText text="What?" still />
```

Try every recipe on one page: `bash examples/demo/run.sh` (serves on 5240; inside the SETTLE research
repository it borrows the site's `node_modules`, anywhere else it installs vite and React into `examples/demo` once). Recipes with their code:
[docs/RECIPES.md](docs/RECIPES.md); the runnable files are in [examples/](examples/).

## Fonts

The package ships eight free faces that read well as lights, in `fonts/`. Four are clean neo-grotesque sans faces,
close to Helvetica. Four are futuristic sci-fi faces. Every one is SIL Open Font License 1.1, which allows it to be
bundled and redistributed with your app, and each folder holds the font's `OFL.txt` and a README with its source and
sha256.

```jsx
import 'settle-text/fonts.css';                     // once, anywhere in your app
import { SettleText, fontOf, FONTS } from 'settle-text/react';

<SettleText text="Lights" />                        // Inter, the default
<SettleText text="Lights" font={fontOf('orbitron')} />
<SettleText text="Lights" font='"Exo 2", sans-serif' />
```

| key | face | kind | drawn at |
|---|---|---|---|
| `inter` | Inter | clean, the default | 700 |
| `geist` | Geist | clean | 700 |
| `archivo` | Archivo | clean | 700 |
| `space-grotesk` | Space Grotesk | clean | 700 |
| `orbitron` | Orbitron | sci-fi | 700 |
| `exo-2` | Exo 2 | sci-fi | 700 |
| `oxanium` | Oxanium | sci-fi | 700 |
| `audiowide` | Audiowide | sci-fi | 400, its one weight |

`fonts.css` declares one `@font-face` per file with `font-display: swap`, and a browser downloads a face only when
something is drawn in it. Without the import the default falls back to Helvetica Neue, Helvetica, then Arial. `FONTS`
lists the faces with their kind, CSS family stack, weight, file and licence; `fontOf(key or name)` gives the
`{ family, weight }` a `font` prop takes. Thirteen free faces were drawn as lights at 88, 40 and 22 px to choose
these; Inter reads best at prose size, so it is the default.

## Alive by default

Every component, from `SettleText` to `SettleBackground`, is alive unless you say otherwise. Three things make it so:
the simmer, THE ACTIVE HAZE (each piece re-settles on its own rotation, see the next section), and THE AMBIENT
SHIMMER (small effects between the re-settles).

1. **The simmer.** The lights rest at a warm `temperature` (0.6) and keep sweeping, so the edges of the words
   glitter and a few lights spark in the dark around them. A light on a letter's edge flips about 1 time in 40 a
   sweep at 0.6; at 0.45 it flips 1 time in 130, nearly still.
2. **The re-settle.** By default this is THE ACTIVE HAZE (the next section): every 8 to 15 s each piece heats
   into a haze and settles back. A `resettle` prop, when you give one and no `haze`, keeps its 0.5.0 meaning: on its
   clock the heat climbs for 400 ms, the words scatter a little (the temperature peaks near 1.3 to 1.8), and they
   cool back over 2.8 s into the same words, at the full 24 sweeps a second. Between re-settles the simmer runs at
   12 sweeps a second.

```jsx
<SettleText text="Settle" />                                              // alive: simmer, the active haze, the shimmer
<SettleText text="Settle" resettle={2000} />                              // every 2 s
<SettleText text="Settle" resettle={{ every: [6000, 14000], level: 0.8 }} />  // a long, uneven wait, a bigger scatter
<SettleText text="Settle" resettle={{ every: 4000, kind: 'shake' }} />    // shake the lights loose instead of heating
<SettleText text="Settle" resettle={(n) => (n < 3 ? 1500 : null)} />      // three quick re-settles, then none
<SettleText text="Settle" resettle={false} />                             // the simmer and the small shimmers, no re-settle
<SettleText text="Settle" rest />                                         // re-settles, but no frames in between
<SettleText text="Settle" still />                                        // static: drawn once, never moves
```

| prop | default | what it does |
|---|---|---|
| `haze` | `true` | THE ACTIVE HAZE, each piece's re-settle rotation (see the next section); an explicit `haze` wins over `resettle` |
| `resettle` | | read only when `haze` is not given (0.5.0's meaning): `true` (a card in the shimmer's deck), `false` (none), a number (an interval in ms: the 0.4.0 clock, and the deck then deals only the small effects), `{ every, jitter, level, kind, cool }` (with `every` a clock; without it, how strong the dealt re-settle is), or a function `(n) => ms` asked for the wait before re-settle `n` (return `null` to stop) |
| `resettle.every` | `9000` | ms between re-settles on the clock, or `[min, max]` (the clock runs when you set it, or with `ambient={false}`) |
| `resettle.jitter` | `0.35` | the wait varies by this share either way |
| `resettle.level` | `[0.4, 0.65]` | how far the heat climbs, 0 to 1; a number or a range drawn each time |
| `resettle.kind` | `'heat'` | `'heat'` (a ramp of temperature), `'shake'` (the lights shaken loose), `'mix'` (a shake every third time) |
| `resettle.cool` | `2800` | ms a re-settle takes to cool back to the simmer |
| `temperature` | `0.6` | the simmer: `0.45` calm, `0.6` alive, `0.8` wild (`0.45` under `rest`) |
| `rest` | `false` | cool and stop drawing between re-settles: the 0.3.0 resting picture, alive only on its schedule |
| `still` | `false` | the static flag: the lights are drawn once as the picture and never move; no frame work at all |
| `intro` | `1` | the heat at mount: `1` out of full noise, `0` the words there at once and then alive |
| `fps` | `24` | sweeps a second while settling |
| `simmerFps` | `12` | sweeps a second between re-settles (the page thins it, see below) |
| `onResettle` | none | `({ count, level, kind, haze })` at each re-settle; `haze` is `true` for a turn of the active haze |
| `breathe` | | 0.3.0's name for the schedule (seconds, or `{ every: [s, s], level }`), read as `resettle` when `resettle` is not given; `breathe={false}` turns the schedule off |

**The page thins itself, and never goes static.** Every alive settle on screen joins one page-wide conductor, and
counts by its size: one for every 16,000 lights, at least 1 and at most 4 (a word counts one, a paragraph of prose in
lights nearly three), because the draw grows with the lights. Up to a crowd of 8, each simmers at its `simmerFps`; up to 16, at three quarters of it and with re-settles 1.25 times as far
apart; up to 24, at half and 1.5 times; up to 40, at a third (never below 4 sweeps a second) and twice as far apart;
past 40, each rests between its re-settles. At most 4 re-settles run at once on a page (`maxConcurrent` on
`SettleTextDefaults`); one that finds the cap full waits 0.4 to 1.6 s and asks again. Off screen a settle pauses and
leaves the conductor; in a hidden tab nothing runs; under `prefers-reduced-motion` every component is still.

## The active haze

Every piece of text re-settles on its own rotation. On its turn the heat climbs over 600 ms to the mount's own heat
(a level of 0.9 to 1), the letters dissolve into a haze you can still read the shape of, and they settle back over
3 s into the same words. The default rotation is every 11.5 s with a jitter of 30% either way, so 8 to 15 s, and each
piece's first turn lands anywhere from a tenth of an interval to a whole one after it mounts, so the pieces on one
page never turn together.

```jsx
<SettleText text="Settle" />                                   // the default: every 8 to 15 s
<SettleText text="Settle" haze={5000} />                       // every 5 s, +/- 30%
<SettleText text="Settle" haze={{ every: [4000, 20000] }} />   // a wide, uneven rotation
<SettleText text="Settle" haze={{ every: 6000, jitter: 0 }} /> // exactly every 6 s
<SettleText text="Settle" haze={{ level: 0.6, cool: 2000 }} /> // a lighter haze, a quicker return
<SettleText text="Settle" haze={false} />                      // off: no re-settle at all
```

| prop | default | what it does |
|---|---|---|
| `haze` | `true` | `true` (the default rotation), `false` (off), a number (the interval in ms), or `{ every, jitter, level, ramp, cool, kind }` |
| `haze.every` | `11500` | ms between turns, or `[min, max]`; never under 2,000 |
| `haze.jitter` | `0.3` | each wait varies by this share either way |
| `haze.level` | `[0.9, 1]` | how far the heat climbs, 0 to 1 (1 is the mount's heat); a number or a range drawn each turn |
| `haze.ramp` | `600` | ms the heat takes to climb |
| `haze.cool` | `3000` | ms the haze takes to settle back |
| `haze.kind` | `'heat'` | `'heat'`, `'shake'` (the lights shaken loose) or `'mix'` (a shake every third turn) |

**Which clock runs.** An explicit `haze` wins. With no `haze`, a component given `resettle` or `breathe` keeps exactly
what those props meant in 0.5.0, so a page that set them does not change. `haze={false}` with no `resettle` turns the
full re-settle off everywhere, and the shimmer deck then deals only its small effects. With the haze on, the deck
deals no re-settle of its own. `SettleBackground` keeps its slower 11 to 17 s clock unless you give it a `haze`.

**When it stops.** Off screen the rotation stops (every component already watches its box with an
IntersectionObserver), in a hidden tab a turn is skipped and nothing runs, and under `prefers-reduced-motion` or
with `still` there is no haze at all. A turn asks the page's cap first: at most 4 re-settles run at once, and one that
finds the cap full asks again 0.4 to 1.6 s later. The box carries `data-settle-haze` (`'on'`, `'legacy'` or `'off'`)
and `data-settle-haze-turn` (the turns so far). The pure half exports the rotation as `createHazeClock`, on timers you
can pass in, with `HAZE`, `hazeOf`, `hazePlan`, `hazeDelay` and `hazeLevel`.

## The ambient shimmer

Every alive piece of text keeps its own small schedule. Each one deals SHIMMERS from its own deck of cards (a shuffle
bag: every card once a round, in a fresh order, never the same card twice in a row), on its own clock: its period is
the preset's gap times 0.75 to 1.25, drawn when it mounts, and its first shimmer lands anywhere from 0.15 to 1 period
in, so no two pieces move together. Most cards are small effects. With the active haze off and no `resettle`
clock, about 1 card in 10 is the full re-settle; with the haze on (the default) the haze is the re-settle and the deck
deals only the small effects. Each
effect is drawn by the settle itself, never by a CSS animation: a draw-only flash on chosen lights (the same flash
settle-see's edge crackle uses), a moment's change to the settle's own knobs (heat, lean, the soft read), or a local
melt (a region's lean toward the words turned down and back up through settle-see's per-light leans, so the field
scatters it and settles it home).

```jsx
<SettleText text="Settle" />                                         // the gentle preset, the default
<SettleText text="Settle" ambient="whisper" />                       // the quietest four
<SettleText text="Settle" ambient="glint" />                         // one effect, by name
<SettleText text="Settle" ambient={['glint', 'breath', 'resettle']} />  // a list (add 'resettle' to deal it 1 in 10)
<SettleText text="Settle" ambient={{ preset: 'lively', every: 2000, resettleShare: 0.2, strength: { glint: 0.8 } }} />
<SettleText text="Settle" ambient={false} />                         // no shimmer: 0.4.0's alive default
```

THE RANGE, from the faintest to the boldest (`AMBIENT_EFFECTS`, exported, so a page can list them):

| effect | what you see | default strength | length | how it is drawn |
|---|---|---|---|---|
| `twinkle` | A few lights blink brighter, here and there. | 0.4 | 1.0 s | draw-only flash |
| `glint` | A thin bright band slides across the letters, left to right. | 0.5 | 1.1 s | draw-only flash |
| `ripple` | A faint ring of light rolls out through the words. | 0.4 | 1.5 s | draw-only flash |
| `breath` | The words warm a little and cool again: a soft breath. | 0.4 | 2.0 s | weather knobs |
| `haze` | The glow softens and smears for a moment, then sharpens. | 0.5 | 1.8 s | weather knobs |
| `tilt` | The letters loosen for a moment and pull back into shape. | 0.5 | 1.6 s | weather knobs |
| `crackle` | The edges crackle with bright points for about a second. | 0.5 | 1.1 s | draw-only flash |
| `sparks` | A few sparks flicker just off the edges. | 0.5 | 1.0 s | draw-only flash |
| `glow` | The whole piece brightens once, softly, and fades. | 0.4 | 0.9 s | draw-only flash |
| `word` | One word scatters and settles back while the rest hold. | 0.6 | 1.8 s | local melt |
| `flurry` | A light flurry of noise across the piece, gone in a second. | 0.5 | 1.4 s | local melt |
| `line` | One line scatters and settles back. | 0.6 | 2.0 s | local melt |
| `resettle` | The full re-settle: the words heat up, scatter and settle back. | 1 | 3.2 s | the re-settle |

THE PRESETS (`AMBIENT_PRESETS`):

| preset | effects | about every | full re-settles | strength |
|---|---|---|---|---|
| `whisper` | `twinkle`, `glint`, `ripple`, `breath` | 5 s | 5% | x 0.8 |
| `gentle` | `twinkle`, `glint`, `ripple`, `breath`, `haze`, `tilt`, `crackle`, `glow`, `word` | 3.5 s | 10% | x 1 |
| `lively` | `twinkle`, `glint`, `ripple`, `breath`, `haze`, `tilt`, `crackle`, `sparks`, `glow`, `word`, `flurry`, `line` | 2.4 s | 12% | x 1.2 |

| prop | default | what it does |
|---|---|---|
| `ambient` | `true` | `true` (the `'gentle'` preset), `false` (none), a preset name, an effect name, a list of names, or `{ preset, every, jitter, resettleShare, effects, strength }` |
| `ambient.every` | the preset's | ms between shimmers on one piece, or `[min, max]`; never under 1,200 |
| `ambient.jitter` | `0.45` | each gap varies by this share either way |
| `ambient.resettleShare` | the preset's (`0.1`) | the share of the deck that is the full re-settle |
| `ambient.effects` | the preset's | a list of names, or a preset name |
| `ambient.strength` | the preset's | a number scales every effect's default strength; `{ name: 0..1 }` sets one |
| `shimmer` | | the same prop under its first name |
| `onShimmer` | none | `({ count, name, kind, strength })` at each shimmer |

`SettleBackground` deals `'whisper'` by default, and its re-settles keep their own slower clock. The box of every
component says which deck it deals (`data-settle-ambient`) and its last shimmer (`data-settle-shimmer`, `'<count>
<name>'`). **THE CROWD:** at most 6 small shimmers run at once on a page (`maxShimmers` on `SettleTextDefaults`), and
the re-settles keep their own cap of 4; a card that finds its cap full goes back on top of its deck and is asked again
in 0.3 to 1.4 s. A crowd waits its turn and never goes still. **THE LIMITS:** a flash effect lights each light at most
once a shimmer and at most 0.6 of the way to white, and one piece's shimmers are at least 1.2 s apart, so no light
flashes more than once in any 1.2 s (WCAG 2.3.1 asks for no more than three a second). Under `still` and reduced
motion there is no shimmer; off screen and in a hidden tab it pauses.

## SettleTextDefaults

One place to set the live props for a whole part of a page. Every component inside takes these values for any prop
it was not given; an inner provider overrides only the keys it names.

```jsx
import { SettleTextDefaults, SettleText } from 'settle-text/react';

<SettleTextDefaults value={{ palette: 'aurora', resettle: 3000, resolution: 'high' }}>
  <SettleText text="Settle" />
  <SettleText text="Settle" resolution="chunky" />   // its own prop wins
</SettleTextDefaults>
```

| key | what it sets |
|---|---|
| `temperature`, `settleTime`, `haze`, `resettle`, `rest`, `still`, `intro`, `fps`, `simmerFps` | the live props, as above |
| `font` | the face for every `SettleText` and `SettleHeading` inside that does not name one |
| `color`, `palette`, `dim`, `glow`, `resolution` | the look (a heading keeps the title tuning unless it is given a `resolution` or `pitch` of its own) |
| `maxConcurrent` | the page's cap on re-settles running at once (4) |

## Colours and palettes

Each component starts in its own colour from the SETTLE neon range: `SettleText` and `SettleHeading` HYPER PINK
`#ff2fa0`, `SettleLink` LASER GREEN `#30ff46`, `SettleSequence` CYAN `#22e6ff`, `SettleImage` HYPER PINK,
`SettleVector` LIME `#9dff3a`, `SettleBackground` VIOLET `#b26bff` (`PALETTE` in the pure half). `color` takes any CSS
colour or a neon word: `pink rose red orange amber lime green mint cyan ice indigo violet` (`NEON_RANGE`; `pink` and
`green` are the neons here, not CSS's pale pink and dark green).

`palette` chooses how the lights are coloured:

| `palette` | what you see |
|---|---|
| `'single'` (default) | every lit light in `color` |
| `'meaning'` | the hero's own colour code: a lit light that agrees with its lean in rose, one fighting it in orange, so a re-settle flares orange where the lights disagree |
| `'duo'` | lit in `color`, unlit in `offColor`, seen with `dim` |
| `'sunset'`, `'aurora'`, `'neon'`, `'ice'`, `'fire'` | a named gradient across the lights (`GRADIENTS`) |
| `['pink', '#00ffaa', ...]` | your own gradient, left to right |
| `{ colors, direction }` | a gradient along `'x'`, `'y'` or `'diagonal'` |

`dim` (0 to 1, default 0) lights the dark lights a little, so the whole grid shows, as in the SETTLE site's hero; with
0 only the lit lights are drawn and the lights sit on whatever is behind the box.

```jsx
<SettleText text="Settle" palette="sunset" />
<SettleText text="Settle" palette={{ colors: ['cyan', 'violet'], direction: 'diagonal' }} />
<SettleText text="Settle" color="amber" palette="duo" offColor="indigo" dim={0.2} />
<SettleText text="Settle" palette="meaning" resettle={3000} />
```

## SettleText

Words in your font. `size` is a font size, as in CSS (a capital stands at the face's cap height, about 0.7 of
it); the dots are `resolution` lights per em.

| prop | default | what it does |
|---|---|---|
| `text` | required | the words |
| `font` | Inter (`DEFAULT_FONT`) | a CSS font family list, or `{ family, weight }` (`fontOf('orbitron')`); it waits for `document.fonts` to load the face and re-measures; see Fonts |
| `weight` | `700` (`400` for kana, Han, Devanagari) | the face's weight |
| `size` | `64` | the font size in CSS px |
| `color` | `'#ff2fa0'` (HYPER PINK) | any CSS colour, or a neon word: `pink rose red orange amber lime green mint cyan ice indigo violet` |
| `palette`, `offColor`, `dim` | `'single'`, none, `0` | the colour mode (see Colours and palettes) |
| `background` | none | a CSS colour behind the lights; by default they sit on whatever is behind the box |
| `resolution` | `'auto'` | `'auto'` (the SETTLE site's title tuning: about 3.75 CSS px a light, 24 to 48 lights a letter box), `'chunky'` (8 lights per em), `'low'` (12), `'medium'` (20), `'high'` (32), or a number of lights per em (`'ultra'` is retired since 0.5.0 and reads as `'high'`) |
| `pitch` | none | CSS px per light; overrides `resolution` |
| `glow` | `0.7` (`0.5` wide scripts) | the bloom; `0` for raw dots, `1.5` for a sign |
| `align` | `'left'` | `'left'`, `'center'`, `'right'` |
| `wrap` | `true` | break at spaces (and after a hyphen) to fit the box; `false` shrinks to one line |
| `width` | the container's | a fixed width in CSS px, or `'fit'`: one line exactly as wide as its words (measured again when the font loads) |
| `temperature` | `0.6` | the simmer: `0.45` calm, `0.6` alive, `0.8` wild |
| `settleTime` | `1500` | ms from noise to words at mount |
| `haze` | `true` | THE ACTIVE HAZE, the re-settle rotation (see The active haze) |
| `resettle`, `rest`, `intro`, `fps`, `simmerFps`, `onResettle` | alive | the schedule and the rates (see Alive by default) |
| `ambient`, `onShimmer` | `true` | THE AMBIENT SHIMMER: the small effects each piece deals on its own clock (see The ambient shimmer) |
| `breathe` | | 0.3.0's name for `resettle` |
| `paused` | `false` | your own pause |
| `still` | `false` | the static flag: draw the words once as lights; no live settle, no frame work |
| `onSettled` | none | `({ overlap, lights, still })`, once per text, when the lights agree with the words |
| `label` | the text | the screen-reader words (a visually hidden span; the canvas is `aria-hidden`) |
| `decorative` | `false` | hide the whole thing from assistive tech |
| `transition` | `'morph'` | how a new `text` is shown: `'morph'` (the lights settle from the old words into the new), `'cut'` (the new words at once), or `{ kind, duration, frames }` |
| `duration` | `1200` | ms a morph takes, at the same pace on a fast machine and a slow one |
| `hover` | `false` | `true` (0.6) or a level 0 to 1: the lights take that heat and settle back when the pointer enters, or keyboard focus reaches, the link or button they sit in (else their own box); at most every 250 ms; never under reduced motion or `still` |
| `className`, `style` | | the outer box |

What it looks like: at `'auto'` a 72 px title is a 24-light box with a capital about 13 lights tall, the SETTLE site's
own headings (`SettleHeading` uses that tuning exactly), and a 96 px title stays at the hero's 3.75 px pitch where
`'medium'` would draw it at 4.8 px. Below 72 px `'auto'` and `'medium'` agree within a light. `'chunky'` is a coarse
dot-matrix sign, `'low'` a sign you can still read small, `'high'` reads like type with a glow.

### Changing the words: a morph or a cut

Give `SettleText` a new `text` and the lights do not start again from noise. They settle from the old words into
the new ones: every light that must change switches at its own moment, sooner on the left, so the new words sweep
in over about `duration` ms. That is settle-see's own morph, wrapped; nothing in this package copies it.

```jsx
const [playing, setPlaying] = useState(true);
<button onClick={() => setPlaying(!playing)}>toggle</button>
<SettleText text={playing ? 'PAUSE' : 'PLAY'} width={180} wrap={false} />          // morphs, 1.2 s
<SettleText text={playing ? 'PAUSE' : 'PLAY'} width={180} transition="cut" />     // swaps at once
<SettleText text={playing ? 'PAUSE' : 'PLAY'} width={180} duration={600} />       // a quicker morph
```

A morph needs the same grid on both sides. Fix the `width` (and keep the line count) so the old words and the new
ones share it; a text that needs a new grid (a wrapped text that gains a line, a box that changed width) settles
fresh out of noise, as at mount. Under `prefers-reduced-motion`, and with `still`, every change is a cut.

## SettleSequence

A list of texts, one after another, each settling out of the last. Every `SettleText` prop passes through
(`font`, `size`, `color`, `transition`, `duration`, ...).

```jsx
import { SettleSequence } from 'settle-text/react';

<SettleSequence items={['HELLO', 'BONJOUR', 'HALLO', 'CIAO']} interval={2000} width={360} align="center" />
<SettleSequence items={['3', '2', '1', 'GO']} interval={1000} loop={false} onDone={() => start()} />
```

| prop | default | what it does |
|---|---|---|
| `items` | required | the texts, in order |
| `interval` | `2500` | ms each text stays: a number, a list (one wait an item, the last repeated), or `(index) => ms` |
| `loop` | `true` | wrap to the first after the last; `false` stops on the last |
| `onStep` | none | `({ index, item, lap })` on every move after the first |
| `onDone` | none | `({ index, item, lap })` when a once sequence reaches its last text |
| `paused` | `false` | pause the stepping; the time left on the current text is kept |
| `label` | every item, joined | the screen-reader words; a step is never announced, so a loop never talks over the page |
| `color` | `'#22e6ff'` (CYAN) | |
| the rest | as `SettleText` | |

Off screen, and in a hidden tab, the clock pauses and keeps the time left. Under `prefers-reduced-motion` the
sequence still steps (the words are content), and each change is a cut, drawn still. Pass `paused` for no
automatic change at all.

## SettleHeading

A real heading, `<h1>` to `<h6>`, drawn as a settle. The level sets the element and the size; everything else is
`SettleText`.

```jsx
import { SettleHeading, fontOf } from 'settle-text/react';

<SettleHeading level={1} text="Render text as light" font={fontOf('orbitron')} />
<SettleHeading level={2}>Getting started</SettleHeading>
<SettleHeading level={3} color="cyan">Changing the words</SettleHeading>
```

| prop | default | what it does |
|---|---|---|
| `text` or children | required | the words (string or number children are joined) |
| `level` | `1` | `1` to `6` (or `'h3'`): the element, and the size on the scale below |
| `as` | the level's `h1`..`h6` | another element; one that is not a heading gets `role="heading"` and `aria-level` |
| `size` | the level's clamp | a number (px), any CSS length (`'3rem'`, `'clamp(...)'`), or `false` to let your stylesheet set it |
| `wrap` | `true` | a heading wider than its box breaks at spaces and the box grows a line |
| `pitch`, `resolution` | the heading tuning | as `SettleText`; either one replaces the tuning below |
| `label` | the text | the screen-reader words; `decorative` hides the whole heading, element and all |
| `id`, `className`, `style` | | the heading element |
| the rest | as `SettleText` | `font`, `weight`, `color`, `glow`, `align`, `transition`, `duration`, `resettle`, `temperature`, `palette`, `still`, `onSettled`, `width`, ... (alive by default) |

The scale is the SETTLE site's own: level 1 is its page title, level 2 its thin title, level 3 its section heading,
and 4 to 6 step down from there. Each is a CSS clamp, so a heading follows the screen without a line of your code:

| level | font size | at 390 px wide | at 1440 px wide |
|---|---|---|---|
| 1 | `clamp(44px, 6.4vw, 92px)` | 44 px | 92 px |
| 2 | `clamp(32px, 3.6vw, 52px)` | 32 px | 51.8 px |
| 3 | `clamp(27px, 2.3vw, 40px)` | 27 px | 33.1 px |
| 4 | `clamp(22px, 1.8vw, 30px)` | 22 px | 25.9 px |
| 5 | `clamp(19px, 1.4vw, 24px)` | 19 px | 20.2 px |
| 6 | `clamp(16px, 1.2vw, 20px)` | 16 px | 17.3 px |

The component reads the size the browser worked out and gives it lights with the site's title tuning: a letter box
of 1.25 em at about 3.75 px a light, never fewer than 24 lights a box and never more than 48. A small heading gets
finer dots, not fewer, so an `h6` stays as legible as an `h1`. Your own CSS can set the size instead
(`size={false}` and a class), and the lights follow it.

The heading is a real heading: the element is `h1`..`h6`, the words are in a visually hidden span inside it, and the
canvas is `aria-hidden`, so a screen reader hears the title and the page outline is right. Before the first
measurement (and in a server render) the heading holds its words as plain text in the same font. A new `text`
morphs, as in `SettleText`, when the old and new words share a grid (the same width and line count).

## SettleLink

A link whose words are lights, re-settling when it is pointed at or reached with Tab.

```jsx
import { SettleLink } from 'settle-text/react';

<nav>
  <SettleLink href="/docs" text="Docs" />
  <SettleLink href="/recipes" text="Recipes" color="cyan" size={28} />
</nav>
```

| prop | default | what it does |
|---|---|---|
| `href`, `text` | required | the link and its words; the words are its accessible name |
| `hover` | `0.7` | the re-settle on pointer and focus; `false` turns it off |
| `width` | `'fit'` | one line as wide as its words; a number of CSS px, or `null` to fill the container |
| `wrap` | `false` | |
| `size` | `24` | the font size in CSS px |
| `color` | `'#30ff46'` (LASER GREEN) | |
| `target`, `rel`, `onClick`, `id`, `title`, `download`, `aria-current`, `className`, `style` | | on the `<a>`; `target="_blank"` gets `rel="noopener noreferrer"` unless you give a `rel` |
| the rest | as `SettleText` | `font`, `weight`, `glow`, `resolution`, `transition`, `resettle`, `palette`, ... (alive by default) |

It is an `<a class="settle-link">` with `display: inline-block`, so a row of them sits like a row of words.

## SettleImage

A picture as lights, by brightness. Its `resolution` is lights across (a text's is a height).

| prop | default | what it does |
|---|---|---|
| `src` or `image` | required | a URL, an `<img>`, an `ImageBitmap`, a canvas or an `ImageData` |
| `alt` | | the screen-reader words; without it (and without `label`) the picture is decorative |
| `resolution` | `'auto'` | `'auto'` (about 3 CSS px a light, 96 to 384 across), `'chunky'` (40 across), `'low'` (64), `'medium'` (128), `'high'` (256), or a number (`'ultra'` reads as `'high'`) |
| `pitch` | none | CSS px per light; overrides `resolution` |
| `width`, `height` | the container's; the picture's aspect | CSS px |
| `fit` | `'contain'` | `'cover'` when a height is given |
| `threshold` | `0.5` | a light brighter than this is lit |
| `dither` | `false` | Floyd-Steinberg: greys become densities (a photo) |
| `invert` | `false` | dark becomes lit (a dark logo on a light ground) |
| `color` | `'#ff2fa0'` | one colour for every lit light |
| `colors` | none | `'source'`: every light keeps its own pixel's colour |
| `palette`, `offColor`, `dim` | `'single'` | the colour mode, as `SettleText` (a gradient or the meaning code over the picture) |
| `onError` | none | called with a message when the image cannot be read (a cross-origin image without CORS) |
| `glow`, `temperature`, `settleTime`, `resettle`, `rest`, `intro`, `fps`, `simmerFps`, `breathe`, `paused`, `still`, `onSettled`, `onResettle`, `label`, `decorative`, `hover`, `className`, `style` | as `SettleText` | alive by default; `still` is the static flag |

## SettleVector

An SVG as lights, by coverage: a light is lit wherever the ink covers it, whatever the ink's colour.

| prop | default | what it does |
|---|---|---|
| `svg` | | SVG markup, a path `d` string, or a URL ending in `.svg` |
| `paths` | | a list of path `d` strings (an alternative to `svg`) |
| `viewBox` | `[0, 0, 100, 100]` | for a path or paths; markup carries its own |
| `stroke` | none (filled) | a stroke width in viewBox units, for a path |
| `alt` | | the screen-reader words |
| `color` | `'#9dff3a'` (LIME) | |
| the rest | as `SettleImage` | `resolution`, `pitch`, `width`, `height`, `fit`, `threshold`, `dither`, `invert`, `colors`, `palette`, `offColor`, `dim`, `onError`, and the live props (alive by default) |

## SettleBackground

A full-bleed settle behind your content, from a picture, an SVG or words.

| prop | default | what it does |
|---|---|---|
| `src` / `image`, `svg` / `paths`, `text` + `font` | one of them | the source |
| `fit` | `'cover'` | or `'contain'` |
| `opacity` | `1` | the whole layer |
| `still` | `false` | alive by default since 0.4.0, like every component; `true` draws it once, settles once, then no frame work: the CPU-lovely mode |
| `resettle` | every 11 to 17 s | slower than a text's, because a background is behind reading |
| `rest` | `false` | re-settle on the schedule but draw nothing in between |
| `resolution` | `'auto'` | lights across |
| `color` | `'#b26bff'` (VIOLET) | |
| `children` | | your content, drawn on top |
| the rest | as the source component | `colors`, `glow`, `threshold`, `dither`, `invert`, `temperature`, `settleTime`, `palette`, `offColor`, `dim`, `intro`, `fps`, `simmerFps`, `paused`, `className`, `style` |

Give the box a height (`style={{ minHeight: 360 }}`) or let the children size it.

## How it works, in one paragraph

Every dot is a light with a coin in it. Each light has a lean: toward on where your word is, toward off where it
is not. Each light also listens to its four neighbours and leans toward agreeing with them. At the start the
coins are hot and the lights flip at random, so you see noise. The temperature falls, the coins calm down, and
each light settles where its lean and its neighbours pull it: your word appears out of the noise. The temperature
does not fall all the way: it stays warm, so the lights on the edges keep flipping and the word stays alive. Every
few seconds the temperature climbs again, the coins get hot, the word scatters a little and settles back. That is
all the physics there is, and it is settle-see's (the SETTLE project's drawing library); this package only
decides the grid, the font, the colour, the temperature and when to re-settle. With `still` the engine draws the
word once and then does nothing at all.

## Performance

**Alive, on a real page (0.4.0).** Measured 2026-10-06 03:44 to 03:54 AEDT on an Apple M5 Max (macOS 26.5, high
power mode, load 2.9 on 18 cores at both ends), headless Chromium, on the SETTLE site's `#/settletext` (207 settles,
every one alive but one still card), at seven scroll positions, each read for 4 s after 2.5 s to settle in, the
alive page and the same page with every settle in `rest` interleaved, the minimum over 3 rounds. CPU ms a second is
settle-see's own meter summed over the settle-text settles on the page (physics + draw).

| width | on screen | alive: CPU ms a second | alive: ms a frame | rest: CPU ms a second |
|---|---|---|---|---|
| 1440 | 6 to 18 | 62.7 to 106.2 (6 to 11% of one core) | 0.37 to 1.63 | 9.4 to 76.2 |
| 390 | 6 to 16 | 48.1 to 95.5 (5 to 10% of one core) | 0.30 to 1.07 | 11.0 to 48.3 |

The busiest screen at 1440 (the recipes: a neon sign, changing words, six hover tiles) costs 106 ms of CPU a second
alive. The page thins itself by a weighted crowd: in a run taken before the weighting (load 31 falling to 3), a screen
of prose paragraphs read 133 ms a second; in the two runs after it (load 16 falling to 6, then 2.9) it read 81. The whole renderer, everything the page does (its background, its footer,
the settles), read 206 to 281 ms a second alive against 157 to 263 resting. The rounds and the script that took
them are kept with the SETTLE site, not in this package; the table above is their summary.

**Per preset, the live phase (0.3.0's table).** Measured 2026-10-03 14:54 AEST on an Apple M5 Max (macOS 26.5, high power mode, load 8.15 on 18 cores during
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
mostly fixed compositing cost. Treat the numbers as a ceiling for one frame. In 0.3.0 a settled picture rested and
cost nothing between breaths; since 0.4.0 it keeps simmering, and the alive table above prices that.

**Still mode** (`still`): after the flip, every settle on the ladder drew **0
frames in 5 seconds**. The whole cost is the one draw.

Re-checked 2026-10-05 13:05 AEDT on the same machine, but in low power mode with a load of 265 on 18 cores (the
box was running many other jobs), so those numbers are confounded and do not replace the table: every cost read
about twice the table's (physics 0.09 to 0.32 ms, draw 2.30 to 4.83 ms a frame), and every claim above held. The
physics stayed under a third of a millisecond at every preset, the draw stayed a few milliseconds and was lowest at
`'high'`, and still mode drew 0 frames in 5 seconds at every preset. Re-take the table on a quiet box before quoting
it as current.

Re-measure on your machine: start the demo, then `python3 tools/perf_check.py --base http://localhost:5240`.

## Access

The words are real text: `<SettleText>` puts `label` (default `text`) in a visually hidden span and marks the
canvas `aria-hidden`, so a search engine reads the words and a screen reader says them. `<SettleHeading>` puts that
inside a real `<h1>`..`<h6>`, so the page outline is right too. A picture or a vector
names itself with `alt`; without one it is decorative. `prefers-reduced-motion: reduce` turns every component
into its still form: the picture is simply there, with no simmer and no re-settle. A re-settle changes a light at
most a few times a second and never flashes the whole picture (WCAG 2.3.1).

## Licence

MIT. The text is in `LICENSE`, and `package.json` says `"license": "MIT"`. settle-see, the engine this package wraps,
carries the same licence, as do settle-mcp, SETTLE and KANERVA.

## Naming

The package is **settle-text**: the thing it does is render text (and pictures) as a settle. The other name
considered was **settle-sdm-text**. The effect is a settle of p-bits (lights with coins, leans and pulls); it
does not use a sparse distributed memory, so "sdm" in the name would promise a mechanism that is not here.

## Tests

`npm test` runs the pure half in node: the grid and the wrap, the presets, the picture samplers against small
known inputs (a diagonal, a flat grey under dither, a black shape by coverage, source colours), the colour words,
the heat curve and its ramp, the alive schedule in every form and the page's thinning and conductor, the active
haze (its default rotation, every form of the prop, which clock a component runs, the random phase and the jitter,
and the rotation on a fake clock through a hidden tab, a full cap and a stop), the eight faces (each file, its
licence, its README's sha256, the stylesheet that declares them, the default), the ambient
shimmer (its range, its presets, its deck's one-in-ten re-settle, each piece's own phase, the effects' limits), the palette and
its gradients, the transition and the sequence clock (on a fake timer), the heading scale and the lights each
heading size gets, the hover level and gate, the one-line width a `'fit'` text needs, and the package's shape (the exports, wrap-never-fork, the public API staying simple, this
README's sections and the defaults it states). The components themselves need a browser: the demo renders every
one of them.

## Layout

```
settle-text/
  package.json         name settle-text · exports ., ./react and ./fonts.css · react peer · settle-see dependency · private
  src/                 the pure half: presets, layout, colour, palette, raster, heat, alive, haze, ambient, fonts,
                       transition, heading, hover (node runs it)
  fonts/               the eight faces: one folder each (the woff2, OFL.txt, README.md), fonts.css, README.md
  react/               the React half: Lights (the one place settle-see is mounted), the four components,
                       SettleSequence, SettleHeading, SettleLink, SettleTextDefaults and the page conductor, hooks
  tests/               node --test
  docs/RECIPES.md      eight recipes with their code
  examples/            the recipes as runnable files, and demo/ (a Vite app of all of them)
  tools/perf_check.py  the cost of each preset, read from settle-see's meter in a real browser
  PUBLISHING.md        what publishing would take
  RELEASE_CHECKLIST.md what is checked before a release, and how
  CHANGELOG.md
```

The engine is settle-see, wrapped and never forked: its own repository is `github.com/TripleSparkleAI/settle-see`
(public), and in the SETTLE research repository it is the sibling folder `../settle-see`, a `file:`
dependency that the export turns into `github:TripleSparkleAI/settle-see`.
