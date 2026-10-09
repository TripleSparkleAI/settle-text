# settle-text fonts

Eight free faces that read well as settle lights. Four are clean neo-grotesque sans faces, close to Helvetica. Four
are futuristic sci-fi faces. Every face is SIL Open Font License 1.1, which allows it to be bundled, embedded and
redistributed with software.

Import them once in your app:

```js
import 'settle-text/fonts.css';
```

Then name a face by its family, or use `fontOf`:

```jsx
import { SettleText, fontOf } from 'settle-text/react';

<SettleText text="Lights" />                         {/* Inter, the default */}
<SettleText text="Lights" font={fontOf('orbitron')} />
<SettleText text="Lights" font='"Exo 2", sans-serif' />
```

| key | face | kind | weight drawn | folder |
|---|---|---|---|---|
| `inter` | Inter | clean (the default) | 700 | [inter/](inter/README.md) |
| `geist` | Geist | clean | 700 | [geist/](geist/README.md) |
| `archivo` | Archivo | clean | 700 | [archivo/](archivo/README.md) |
| `space-grotesk` | Space Grotesk | clean | 700 | [space-grotesk/](space-grotesk/README.md) |
| `orbitron` | Orbitron | sci-fi | 700 | [orbitron/](orbitron/README.md) |
| `exo-2` | Exo 2 | sci-fi | 700 | [exo-2/](exo-2/README.md) |
| `oxanium` | Oxanium | sci-fi | 700 | [oxanium/](oxanium/README.md) |
| `audiowide` | Audiowide | sci-fi | 400 | [audiowide/](audiowide/README.md) |

Each folder holds the woff2 file (the latin subset), the font's `OFL.txt`, and a `README.md` with the source URL, the
date it was fetched and the file's sha256. The files are unmodified.

How the eight were chosen: thirteen free candidates were drawn as settle lights at 88, 40 and 22 px and compared.
Inter reads best at prose size, so it is the default. Michroma, Syncopate, Rajdhani, Chakra Petch and Instrument Sans
were left out; the reasons are in `src/fonts.js`.

> Index verified 2026-10-09
