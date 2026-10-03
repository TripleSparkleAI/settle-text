// settle-text/react · hooks - the browser facts a component needs: how wide its box is, whether it is on screen,
// whether the reader asked for less motion, and whether the font has arrived.
//
// <claudes_code_comments>
// ** Function List **
// useReducedMotion()              - prefers-reduced-motion, live
// useBoxWidth(ref, fixed)         - the element's width in CSS px (a ResizeObserver keeps it current); `fixed`
//                                   short-circuits to a given number
// useBoxSize(ref)                 - both dimensions in CSS px, kept current (a background fills its parent)
// useOnScreen(ref, margin)        - an IntersectionObserver verdict, true when no observer exists (never pauses blind)
// useFontReady(font, weight)      - a counter that advances once document.fonts has loaded the face (and again on
//                                   fonts.ready), so a grid measured in the fallback face is measured again
// fontFamilyOf(font)              - the family string of a font prop: a string, or { family, weight }
// fontWeightOf(font, weight, fallback) - the weight: the explicit prop, else the font object's, else the fallback (700)
// nowMs()                         - performance.now() where it exists, else Date.now()
//
// ** Technical Review **
// - A font prop is either a CSS family list ('"Space Grotesk", sans-serif') or { family, weight }. The hook asks
//   document.fonts.load('<weight> 100px <family>') and resolves whether or not the face exists, so a missing font
//   never blocks the picture: the words are drawn in the fallback face and that is what the user sees.
// - Every hook is safe without a DOM (a server render): the width is 0, on-screen is true, the font tick is 0.
// </claudes_code_comments>

import { useEffect, useState } from 'react';

export const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function useReducedMotion() {
  const q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [v, set] = useState(q ? q.matches : false);
  useEffect(() => {
    if (!q) return undefined;
    const f = () => set(q.matches);
    q.addEventListener?.('change', f);
    return () => q.removeEventListener?.('change', f);
  }, []);
  return v;
}

export function useBoxWidth(ref, fixed = null) {
  const isFixed = Number.isFinite(fixed) && fixed > 0;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (isFixed || !ref.current) return undefined;
    const el = ref.current;
    const read = () => setW(el.clientWidth || el.getBoundingClientRect().width || 0);
    read();
    // a box laid out after this effect (a flex child, a font swap) is read once more on the next frame
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(read) : 0;
    if (typeof ResizeObserver !== 'function') return () => raf && cancelAnimationFrame(raf);
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isFixed]);
  return isFixed ? fixed : w;
}

// both dimensions of a box (a background fills its parent, so it needs the height too)
export function useBoxSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }));
    };
    read();
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(read) : 0;
    if (typeof ResizeObserver !== 'function') return () => raf && cancelAnimationFrame(raf);
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return size;
}

export function useOnScreen(ref, margin = '80px') {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver !== 'function') return undefined;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return on;
}

export const fontFamilyOf = (font) => (font && typeof font === 'object' ? font.family : font) || 'sans-serif';
export const fontWeightOf = (font, weight, fallback = 700) => weight ?? (font && typeof font === 'object' ? font.weight : undefined) ?? fallback;

export function useFontReady(font, weight) {
  const family = fontFamilyOf(font);
  const w = fontWeightOf(font, weight);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return undefined;
    let live = true;
    const bump = () => live && setTick((t) => t + 1);
    const first = family.split(',')[0].trim().replace(/^["']|["']$/g, '');
    try {
      document.fonts.load(`${w} 100px "${first}"`).then(bump, bump);
    } catch {
      bump();
    }
    document.fonts.ready.then(bump, bump);
    return () => {
      live = false;
    };
  }, [family, w]);
  return tick;
}
