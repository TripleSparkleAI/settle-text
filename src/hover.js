// settle-text · hover - the re-settle on hover and focus: how strong, how often, and which element it listens on.
// Pure (no DOM, no React); react/Lights.jsx wires it to the pointer and to focus.
//
// <claudes_code_comments>
// ** Function List **
// HOVER                - the defaults: the heat a hover gives (0.6), the shortest gap between two (250 ms), the
//                        elements whose hover or focus counts as the lights' own, and SettleLink's level (0.7)
// hoverLevelOf(hover)  - the hover prop -> a heat level 0..1: true -> 0.6, a number clamped to 0..1, else 0 (off)
// createHoverGate(gapMs) - a gate that lets one wake through per gapMs: gate(nowMs) -> true when it may fire
//
// ** Technical Review **
// - A hover is a heat kick, the same mechanism as the idle breath (src/heat.js kick), only stronger by default: the
//   lights warm, some flip, and they settle back into the words over the settle time. It is off unless asked for.
// - The listening element is the nearest enclosing link, button, summary or label (HOVER.hosts), so the lights wake
//   when the control they sit in is pointed at or reached with the keyboard; with none, the lights' own box.
// - The gate keeps a pointer that wanders in and out from kicking the lights on every frame.
// </claudes_code_comments>

export const HOVER = Object.freeze({
  level: 0.6,
  link: 0.7,
  gapMs: 250,
  hosts: 'a[href], button, [role=button], [role=link], summary, label',
});

export function hoverLevelOf(hover) {
  if (hover === true) return HOVER.level;
  if (typeof hover !== 'number' || !Number.isFinite(hover) || hover <= 0) return 0;
  return Math.min(1, hover);
}

export function createHoverGate(gapMs = HOVER.gapMs) {
  let last = -Infinity;
  return (nowMs) => {
    if (nowMs - last < gapMs) return false;
    last = nowMs;
    return true;
  };
}
