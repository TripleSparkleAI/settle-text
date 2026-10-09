// settle-text/react · SettleHeading - a real heading, h1 to h6, drawn as a live settle of lights.
//   <SettleHeading level={2} text="Getting started" />   or   <SettleHeading level={2}>Getting started</SettleHeading>
//
// <claudes_code_comments>
// ** Function List **
// useFontPx(ref)        - the heading element's computed font size in px, read again when its box changes
// SettleHeading(props)  - the component
//   text | children  the words (a string, or string and number children)
//   level            1..6 (default 1): the element (<h1>..<h6>) and the size on the scale (src/heading.js)
//   as               another element to render ('div', 'p', 'h2', ...); a non-heading element gets
//                    role="heading" and aria-level, so the outline is kept
//   size             the font size: a number (px), any CSS length ('3rem', 'clamp(...)'), or false to leave it
//                    to your stylesheet; default the level's clamp
//   font, weight     as SettleText; the plain words shown before the first measurement wear them too
//   pitch, resolution  override the heading tuning (CSS px a light, or lights per em, as SettleText)
//   wrap             bool (true): a heading wider than its box breaks at spaces and the box grows
//   label            the screen-reader words (default the text); decorative hides the whole heading
//   id, className, style  the heading element
//   ...              every other SettleText prop: color, glow, align, temperature, settleTime, resettle, rest,
//                    intro, palette, dim, paused, still, onSettled, onResettle, transition, duration, width,
//                    background, onHandle (alive by default, as SettleText; still={true} is the static flag)
//
// ** Technical Review **
// - THE SIZE IS CSS. The heading element wears the level's clamp (or `size`, or your own stylesheet when
//   size={false}), the browser works out the px, and this component reads the computed font size. So a heading
//   follows the viewport, a media query or a parent's font size like any other heading, and a resize re-sizes
//   the lights (a ResizeObserver on the element).
// - THE LIGHTS follow that size with the SETTLE site's title tuning (src/heading.js headingPitch): a letter box
//   of 1.25 em, about 3.75 px a light, 24 to 48 lights a box. A small heading gets finer dots rather than fewer.
// - ACCESS: the element is a real <h1>..<h6> (or carries role="heading" and aria-level). SettleText puts the
//   words in a visually hidden span and marks the canvas aria-hidden, so the heading's accessible name is its
//   text and the page outline is correct. `decorative` hides the heading element itself, so the outline does
//   not gain an empty heading. Reduced motion: SettleText's still, the words simply there.
// - BEFORE THE FIRST MEASUREMENT (a server render, the first paint) the heading holds its words as plain text in
//   the same font, so nothing flashes empty and a static render carries the title.
// - A NEW TEXT MORPHS, as SettleText does: the lights settle from the old words into the new when both fit the
//   same grid (the same width and line count); otherwise the new words settle out of noise.
// </claudes_code_comments>

import React, { useEffect, useRef, useState } from 'react';
import { SettleText } from './SettleText.jsx';
import { headingElement, headingLevel, headingPitch, headingSize, headingText } from '../src/heading.js';
import { isNeonKey } from '../src/colour.js';
import { fontFamilyOf, fontWeightOf } from './hooks.js';
import { TEXT } from '../src/presets.js';
import { PALETTE } from '../src/palette.js';
import { DEFAULT_FONT } from '../src/fonts.js';
import { pick, useSettleTextDefaults } from './defaults.js';

function useFontPx(ref) {
  const [px, setPx] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof getComputedStyle !== 'function') return undefined;
    const read = () => {
      const v = parseFloat(getComputedStyle(el).fontSize);
      if (Number.isFinite(v) && v > 0) setPx((p) => (Math.abs(p - v) < 0.5 ? p : v));
    };
    read();
    if (typeof ResizeObserver !== 'function') return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return px;
}

export function SettleHeading({
  text,
  children,
  level = 1,
  as = null,
  size,
  font: fontProp,
  weight,
  color,
  pitch,
  resolution,
  wrap = true,
  label,
  decorative = false,
  id,
  className = '',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const font = pick(fontProp, 'font', useSettleTextDefaults(), DEFAULT_FONT);
  const px = useFontPx(ref);
  const words = headingText(text, children);
  const n = headingLevel(level);
  const { tag: Tag, role, ariaLevel } = headingElement(n, as);
  // the heading tuning, unless the caller set a pitch or a resolution of their own
  const P = Number.isFinite(pitch) && pitch > 0 ? pitch : resolution != null ? undefined : px > 0 ? headingPitch(px) : undefined;
  const live = px > 0;
  const plainColour = color && !isNeonKey(color) ? color : undefined;
  return (
    <Tag
      ref={ref}
      id={id}
      role={role}
      aria-level={ariaLevel}
      aria-hidden={decorative || undefined}
      className={`settle-heading settle-heading--h${n}${className ? ` ${className}` : ''}`}
      style={{
        fontSize: headingSize(size, n),
        fontFamily: fontFamilyOf(font),
        fontWeight: fontWeightOf(font, weight, TEXT.weight),
        lineHeight: 1.05,
        ...(live ? null : { color: plainColour }),
        ...style,
      }}
      data-settle-heading={n}
    >
      {live ? (
        <SettleText
          defaultColor={PALETTE.heading}
          {...rest}
          text={words}
          font={font}
          weight={weight}
          color={color}
          size={px}
          pitch={P}
          resolution={resolution ?? undefined}
          wrap={wrap}
          label={label ?? words}
          decorative={decorative}
        />
      ) : (
        words
      )}
    </Tag>
  );
}
