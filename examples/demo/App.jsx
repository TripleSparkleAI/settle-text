// The demo app: every recipe from docs/RECIPES.md on one page, plus a resolution ladder with the engine's own meter
// read live (tools/perf_check.py reads the same numbers headless for the README's performance table).
import React, { useEffect, useState } from 'react';
import { SettleText, SettleImage } from 'settle-text/react';
import HeroTitle from '../HeroTitle.jsx';
import NeonSign from '../NeonSign.jsx';
import LogoFromSvg, { LogoFromPath } from '../LogoFromSvg.jsx';
import PhotoAsLights, { DrawingAsLights } from '../PhotoAsLights.jsx';
import PageBackground, { LivePhotoBackground } from '../PageBackground.jsx';

const Code = ({ children }) => <pre>{children.trim()}</pre>;

// settle-see's meter: every settle on the page reports its physics and draw time in ms per frame
function Perf() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const id = setInterval(() => {
      const f = globalThis.__settlePerfs;
      if (typeof f === 'function') setRows(f());
    }, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="perf">
      {rows.map((r, i) => (
        <div key={i}>
          {r.label} · {r.renderer} · phys {Number(r.phys).toFixed(2)} ms · draw {Number(r.draw).toFixed(2)} ms · {r.frames} frames
        </div>
      ))}
    </div>
  );
}

const LADDER = ['low', 'medium', 'high'];

export default function App() {
  const [still, setStill] = useState(false);
  return (
    <>
      <h2>A hero title</h2>
      <HeroTitle />
      <Code>{`
<SettleText text="Render text as light" font='"Space Grotesk", sans-serif' size={72} color="#ff2fa0" />`}</Code>

      <h2>Your font, your words</h2>
      <p className="note">Type anything. The words are measured in the face you name, wrapped to the box, and settled.</p>
      <Playground />

      <h2>A neon sign</h2>
      <NeonSign />
      <Code>{`
<SettleText text="OPEN ALL NIGHT" font="Georgia, serif" weight={400} size={56} color="cyan" glow={1.4} temperature={0.7} breathe={4} align="center" background="#07060a" />`}</Code>

      <h2>A logo from an SVG</h2>
      <div className="row">
        <LogoFromSvg />
        <LogoFromPath />
      </div>
      <Code>{`
<SettleVector svg={markup} width={260} color="lime" glow={0.9} alt="a bolt in a ring" />
<SettleVector paths={['M66 18 L40 66 H60 L54 102 L82 52 H62 Z']} viewBox={[0, 0, 120, 120]} width={160} color="amber" />`}</Code>

      <h2>A photo as lights</h2>
      <PhotoAsLights />
      <Code>{`
<SettleImage src="/hero-hot.jpg" alt="a hot landscape" resolution="high" dither colors="source" glow={0.6} />`}</Code>
      <p className="note">A line drawing takes the plain cut: one colour, the ink lit (Galileo's moon, Sidereus nuncius, 1610).</p>
      <DrawingAsLights />
      <Code>{`
<SettleImage src="/galileo-moon.png" alt="Galileo's moon" color="ice" width={420} />`}</Code>

      <h2>A page background</h2>
      <PageBackground>
        <h3 style={{ margin: 0, fontSize: 28 }}>Content on top, lights behind.</h3>
        <p style={{ opacity: 0.8 }}>Still by default: drawn once, settled once, then no frame work.</p>
      </PageBackground>
      <Code>{`
<SettleBackground svg={LOGO} opacity={0.35} color="violet">
  <h3>Content on top, lights behind.</h3>
</SettleBackground>`}</Code>
      <LivePhotoBackground>
        <h3 style={{ margin: 0, fontSize: 28 }}>A live one.</h3>
        <p style={{ opacity: 0.8 }}>still={'{false}'} and breathe={'{6}'}: the lights re-settle every six seconds or so.</p>
      </LivePhotoBackground>

      <h2>The resolution ladder, with the cost</h2>
      <p className="note">
        The same 64 px line at low, medium and high. The meter under it is settle-see's own: milliseconds per frame of physics and of drawing,
        per picture, on this machine, right now. <label><input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} /> still mode</label>
      </p>
      {LADDER.map((r) => (
        <div key={r} data-ladder={r} style={{ margin: '8px 0' }}>
          <SettleText text={`${r} resolution: the quick brown fox`} font='"Space Grotesk", sans-serif' size={64} resolution={r} still={still} breathe={false} label={`${r} resolution`} onHandle={(h) => ((globalThis.__ladder ??= {})[r] = h)} />
        </div>
      ))}
      <div data-ladder="image">
        <SettleImage src="/hero-hot.jpg" alt="" resolution="medium" dither colors="source" still={still} breathe={false} width={480} onHandle={(h) => ((globalThis.__ladder ??= {}).image = h)} />
      </div>
      <Perf />
    </>
  );
}

function Playground() {
  const [text, setText] = useState('What?');
  const [font, setFont] = useState('"Space Grotesk", sans-serif');
  const [color, setColor] = useState('#ff2fa0');
  const [res, setRes] = useState('medium');
  const [size, setSize] = useState(72);
  return (
    <div>
      <div className="row" style={{ marginBottom: 12, fontSize: 13 }}>
        <label>text <input value={text} onChange={(e) => setText(e.target.value)} /></label>
        <label>font <input value={font} onChange={(e) => setFont(e.target.value)} size={28} /></label>
        <label>colour <input value={color} onChange={(e) => setColor(e.target.value)} size={9} /></label>
        <label>size <input type="number" value={size} min={16} max={160} onChange={(e) => setSize(+e.target.value)} style={{ width: 60 }} /></label>
        <label>resolution <select value={res} onChange={(e) => setRes(e.target.value)}>{LADDER.map((r) => <option key={r}>{r}</option>)}</select></label>
      </div>
      <SettleText text={text} font={font} color={color} resolution={res} size={size} />
      <Code>{`
<SettleText text=${JSON.stringify(text)} font=${JSON.stringify(font)} color=${JSON.stringify(color)} size={${size}} resolution=${JSON.stringify(res)} />`}</Code>
    </div>
  );
}
