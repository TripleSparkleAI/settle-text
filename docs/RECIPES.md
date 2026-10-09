# Recipes

Eight things people make with settle-text. Every one is a runnable file in `../examples/`, and `../examples/demo`
renders them all on one page (`bash examples/demo/run.sh`).

## A hero title (`examples/HeroTitle.jsx`)

The main use: one line, your words, your font. The title comes out of noise in about a second and a half, keeps
flickering, and every six to twelve seconds heats up, scatters a little and settles back into the same words.

```jsx
import { SettleText } from 'settle-text/react';

<SettleText text="Render text as light" font='"Space Grotesk", sans-serif' size={72} color="#ff2fa0" />
```

What to turn: `size` is the font size in CSS px. `resolution` is how fine the dots are (`"low"`, `"medium"`,
`"high"`, or a number of lights per em). `wrap` is on, so a long title breaks at spaces to fit its box. For a
heading that must be read by assistive tech, the words are already there: a visually hidden span carries `text`
(or `label`), and the canvas is `aria-hidden`.

## A neon sign (`examples/NeonSign.jsx`)

A serif face at weight 400, a neon word for the colour, more glow, more noise at rest so the tube hums, a breath
every four seconds, centred on a dark plate.

```jsx
<SettleText
  text="OPEN ALL NIGHT"
  font='Georgia, "Times New Roman", serif'
  weight={400}
  size={56}
  color="cyan"
  glow={1.4}
  temperature={0.75}
  resettle={4000}
  align="center"
  background="#07060a"
/>
```

The ten neon words: `rose indigo amber cyan orange lime violet ice mint red`. Any CSS colour works too
(`#hex`, `rgb()`, `hsl()`, `oklch()`, a name).

## A logo from an SVG (`examples/LogoFromSvg.jsx`)

Hand it the markup. A light is lit wherever the drawing covers it, so the ink's colour does not matter and a
black logo is a lit logo. For a single shape, a path `d` string is sharpest.

```jsx
import { SettleVector } from 'settle-text/react';

<SettleVector svg={markup} width={260} color="lime" glow={0.9} alt="a bolt in a ring" />
<SettleVector paths={['M66 18 L40 66 H60 L54 102 L82 52 H62 Z']} viewBox={[0, 0, 120, 120]} width={160} color="amber" />
```

A URL ending in `.svg` works as `svg="/logos/mark.svg"` (fetched, so it must be same-origin or CORS-open). Keep
the ink's own colours with `colors="source"`.

## A photo as lights (`examples/PhotoAsLights.jsx`)

`dither` keeps the tones (a grey becomes a density of dots), `colors="source"` keeps each light's own colour.

```jsx
import { SettleImage } from 'settle-text/react';

<SettleImage src="/photo.jpg" alt="what the photo shows" resolution="high" dither colors="source" glow={0.6} />
```

A line drawing or a logo in a PNG wants the plain cut: no `dither`, one `color`, and `invert` if the ink is dark on
a light ground. `threshold` (0 to 1, default 0.5) moves the cut. A cross-origin image needs CORS headers or the
browser will not let the canvas read it; the component then renders nothing and calls `onError`.

## A page background (`examples/PageBackground.jsx`)

A full-bleed settle behind your content. Like every component it is alive by default, on a slower schedule than a
text (a re-settle every 11 to 17 s). On a page people read for a long time, pass `still`: the lights are drawn once
as the picture, settle once, and then the component does no frame work at all. `rest` is the middle way: it settles
again on its schedule and draws nothing in between.

```jsx
import { SettleBackground } from 'settle-text/react';

<SettleBackground svg={LOGO} opacity={0.35} color="violet" style={{ minHeight: 360 }}>
  <h1>Content on top, lights behind.</h1>
</SettleBackground>

<SettleBackground src="/photo.jpg" fit="cover" colors="source" dither resettle={6000}>
  ...
</SettleBackground>

<SettleBackground src="/photo.jpg" fit="cover" colors="source" dither still>
  ...
</SettleBackground>
```

`fit="cover"` fills the box; `opacity` fades the whole layer; `text` and `font` make a background of words.

## Changing words (`examples/ChangingWords.jsx`)

Give a `SettleText` a new `text` and the lights settle from the old words into the new ones: a morph, about 1.2 s,
each light switching at its own moment and sooner on the left. A play button's label, a status word, a tooltip
that names what the next press will do.

```jsx
import { SettleText, SettleSequence } from 'settle-text/react';

<SettleText text={playing ? 'PAUSE' : 'PLAY'} width={240} wrap={false} duration={900} />
<SettleText text={playing ? 'PAUSE' : 'PLAY'} width={240} transition="cut" />
```

`transition="cut"` swaps the words at once; `duration` sets how long a morph takes. Fix the `width` so both words
share one grid: a text that needs a different grid settles fresh out of noise instead.

A list of texts, one after another, is a `SettleSequence`: timed, looping or once.

```jsx
<SettleSequence items={['HELLO', 'BONJOUR', 'HALLO', 'CIAO']} interval={2200} width={360} align="center" />
<SettleSequence items={['3', '2', '1', 'GO']} interval={1000} loop={false} onDone={start} />
```

`interval` is one wait for every text, a list (one wait each, the last repeated) or a function of the index;
`onStep` fires on each move, `onDone` when a once sequence lands on its last text. Off screen the clock pauses and
keeps its place. Under reduced motion it still steps, as cuts.

## Headings, h1 to h6 (`examples/Headings.jsx`)

A page's titles as lights, with the outline intact: each is a real `<h1>` to `<h6>` whose name is its words.

```jsx
import { SettleHeading } from 'settle-text/react';

<SettleHeading level={1} text="Render text as light" font={FACE} />
<SettleHeading level={2} font={FACE}>Getting started</SettleHeading>
<SettleHeading level={3} font={FACE} color="cyan">Changing the words</SettleHeading>
<SettleHeading level={4} font={FACE} color="amber">A smaller heading, finer dots</SettleHeading>
```

`level` picks the element and the size: level 1 is `clamp(44px, 6.4vw, 92px)`, the SETTLE site's page title,
and each level below is smaller at every screen width, down to `clamp(16px, 1.2vw, 20px)` at level 6. The lights
follow the size the browser works out (about 3.75 px a light, 24 to 48 lights a letter box), so a small heading
has finer dots rather than fewer. Give `size` a number or a CSS length to override the scale, or `size={false}`
and set `font-size` in your own CSS. `as="div"` keeps the look on an element that is not a heading and adds
`role="heading"` with the level. Change the `text` and it morphs, like any `SettleText`.

## Links that re-settle (`examples/LinksThatSettle.jsx`)

A row of links whose words are lights. `SettleLink` is an `<a>` around one `SettleText`, exactly as wide as its words
on one line, named by its words, and it re-settles when pointed at or reached with Tab.

```jsx
import { SettleLink, SettleText } from 'settle-text/react';

<nav>
  <SettleLink href="/docs" text="Docs" font={FACE} />
  <SettleLink href="/recipes" text="Recipes" font={FACE} color="cyan" />
</nav>

<button><SettleText text="Point at me" width="fit" size={28} hover /></button>
```

`hover` works on `SettleText`, `SettleHeading`, `SettleImage` and `SettleVector`: `true` (a heat of 0.6) or a level
from 0 to 1. The lights listen on the link or button they sit in (or on their own box), at most once every 250 ms,
and never under reduced motion or `still`. `width="fit"` makes any `SettleText` one line as wide as its words.

## Things every component does on its own

- **Off screen it pauses.** Scroll past it and the frames stop; scroll back and it continues.
- **Reduced motion is honoured.** With `prefers-reduced-motion: reduce` the words are simply there, drawn once.
- **It is alive.** The lights simmer and settle again on a schedule (`resettle`); `still` draws them once and stops,
  `rest` keeps the schedule and stops the frames in between. With many on screen the page thins the simmer and
  spreads the re-settles, so a page full of settles stays cheap without going static.
- **`paused`** is your own switch; **`onSettled`** tells you when the picture has arrived.
