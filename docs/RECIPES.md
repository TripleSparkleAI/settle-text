# Recipes

Five things people make with settle-text. Every one is a runnable file in `../examples/`, and `../examples/demo`
renders them all on one page (`bash examples/demo/run.sh`).

## A hero title (`examples/HeroTitle.jsx`)

The main use: one line, your words, your font. The title comes out of noise in about a second and a half, rests,
and breathes every seven to eleven seconds.

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
  temperature={0.7}
  breathe={4}
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

A full-bleed settle behind your content. `still` is the default: the lights are drawn once as the picture, settle
once, and then the component does no frame work at all. That is the mode to leave on a page people read.

```jsx
import { SettleBackground } from 'settle-text/react';

<SettleBackground svg={LOGO} opacity={0.35} color="violet" style={{ minHeight: 360 }}>
  <h1>Content on top, lights behind.</h1>
</SettleBackground>

<SettleBackground src="/photo.jpg" fit="cover" colors="source" dither still={false} breathe={6}>
  ...
</SettleBackground>
```

`fit="cover"` fills the box; `opacity` fades the whole layer; `text` and `font` make a background of words.

## Things every component does on its own

- **Off screen it pauses.** Scroll past it and the frames stop; scroll back and it continues.
- **Reduced motion is honoured.** With `prefers-reduced-motion: reduce` the words are simply there, drawn once.
- **A settled picture costs nothing.** Once cold and agreed, the engine rests until a breath or a page event.
- **`paused`** is your own switch; **`onSettled`** tells you when the picture has arrived.
