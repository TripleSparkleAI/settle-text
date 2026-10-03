# Changelog

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
