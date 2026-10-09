// settle-text/react · SettleSequence - a list of texts, one after another, each settling out of the last.
//   <SettleSequence items={['HELLO', 'BONJOUR', 'HALLO']} interval={2000} />
//
// <claudes_code_comments>
// ** Function List **
// SettleSequence(props) - steps a SettleText through `items` on a timer, once or looping
//   items        string[], required   the texts, in order
//   interval     ms (2500) | ms[] | (index) => ms   how long each text stays (a list gives one wait an item, the
//                                     last repeated)
//   loop         bool (true)          wrap to the first text after the last; false stops on the last
//   onStep       fn({ index, item, lap })  every move to a text after the first
//   onDone       fn({ index, item, lap })  a once sequence reaching its last text
//   paused       bool                 your own pause of the stepping (the lights still settle and breathe); the
//                                     time left on the current text is kept
//   label        string               the screen-reader text (default: every item, joined by " · ", so a
//                                     reader hears the whole list once and the timer never speaks)
//   ...          every SettleText prop (font, size, color (default CYAN), resolution, transition, duration, align,
//                resettle, temperature, still ...)
//
// ** Technical Review **
// - THE CLOCK is createSequencer (src/transition.js): a plain timer loop that a test drives with a fake clock. Each
//   step changes the SettleText's `text`, and SettleText's transition shows the change: a morph by default (the
//   lights settle from the old words into the new), a cut on request.
// - PAUSED OFF SCREEN: an IntersectionObserver on the box pauses the clock (and the lights) while it is out of view,
//   and a hidden tab pauses it too; the time left on the current text is kept, so coming back does not skip one.
// - REDUCED MOTION: the sequence still steps (the words are content, and a reader asked for less motion, not for
//   less text), each change is a cut drawn still. A page that wants no automatic change passes `paused`.
// - ACCESS: one visually hidden label with the whole list; the lights are decorative, and nothing is announced on a
//   step, so a looping sequence never talks over the page.
// </claudes_code_comments>

import React, { useEffect, useRef, useState } from 'react';
import { SettleText } from './SettleText.jsx';
import { SEQUENCE, createSequencer } from '../src/transition.js';
import { useOnScreen } from './hooks.js';
import { PALETTE } from '../src/palette.js';

export function SettleSequence({
  items = [],
  interval = SEQUENCE.intervalMs,
  loop = SEQUENCE.loop,
  onStep,
  onDone,
  paused = false,
  label,
  className = '',
  style,
  ...text
}) {
  const box = useRef(null);
  const onScreen = useOnScreen(box);
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && !!document.hidden);
  const hooks = useRef({});
  hooks.current = { onStep, onDone, items };
  const seq = useRef(null);
  const key = `${items.length}|${JSON.stringify(interval)}|${loop}|${items.join('\u0001')}`;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const f = () => setHidden(!!document.hidden);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  // a new list starts over at its first text
  useEffect(() => {
    setIndex(0);
    const s = createSequencer({
      count: items.length,
      interval,
      loop,
      onStep: ({ index: i, lap }) => {
        setIndex(i);
        hooks.current.onStep?.({ index: i, item: hooks.current.items[i], lap });
      },
      onDone: ({ index: i, lap }) => hooks.current.onDone?.({ index: i, item: hooks.current.items[i], lap }),
    });
    seq.current = s;
    return () => { s.stop(); seq.current = null; };
  }, [key]);

  // run while on screen, visible and not paused; a pause keeps the time left
  const run = onScreen && !hidden && !paused;
  useEffect(() => {
    const s = seq.current;
    if (!s) return;
    if (run) s.resume();
    else s.pause();
  }, [run, key]);

  const words = items[Math.min(index, Math.max(0, items.length - 1))] ?? '';
  return (
    <span ref={box} className={`settle-sequence${className ? ` ${className}` : ''}`} style={{ display: 'block', position: 'relative', ...style }} data-settle-sequence={index}>
      <SettleText defaultColor={PALETTE.sequence} {...text} text={words} label={label ?? items.join(' · ')} />
    </span>
  );
}
