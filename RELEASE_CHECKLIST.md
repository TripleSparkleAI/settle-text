# settle-text release checklist

Run every check before a version is cut. Each line says what to run and what a pass looks like. The last section
records the most recent run; replace it on the next one.

## 1. The manifest

- [ ] `package.json`: `name` is `settle-text`, `version` is the new version, `private` is `true`, `type` is
      `module`, `exports` are `.` (`./src/index.js`) and `./react` (`./react/index.js`), `sideEffects` is `false`.
- [ ] `peerDependencies` are `react` and `react-dom` (`>=18`); the one dependency is `settle-see`
      (`file:../settle-see` here; the export rewrites it to `github:triplesparkle/settle-see`).
- [ ] `package-lock.json` carries the same version twice (top and `packages[""]`).
- [ ] `files` lists only folders and files that exist; `npm pack --dry-run` shows no `dist/`, no `node_modules/`,
      no `.env`, nothing from the SETTLE site.
- [ ] **The licence.** No `license` field until one is chosen. **OPEN: the licence is the navigator's choice**
      (settle-see declares none; MIT would match settle-mcp and the upstream ds4 engine). The README's Licence
      section carries the placeholder; remove it in the same change that adds the field and a `LICENSE` file.

## 2. The tests

- [ ] `npm install` (links settle-see from the sibling folder), then `npm test`: every test passes.
- [ ] The tests hold the version, the CHANGELOG's top entry and the lock together; the README's sections and stated
      defaults; every example in the demo and in `docs/RECIPES.md`; wrap-never-fork; the public API staying simple.

## 3. The docs

- [ ] `CHANGELOG.md` has an entry for the version, dated, that says what a user will notice.
- [ ] Every README code block is one the demo renders (or a one-line variation of it), and every number in the
      README has a stamp or a command that derives it.
- [ ] `docs/RECIPES.md`: one recipe per file in `examples/`, the count in its first line correct.
- [ ] No em-dashes or en-dashes anywhere: `grep -rnE $'\u2013|\u2014' README.md docs PUBLISHING.md CHANGELOG.md`
      prints nothing.

## 4. The demo, in a real browser

- [ ] `bash examples/demo/run.sh --build` builds.
- [ ] `PORT=<free port> bash examples/demo/run.sh`, then open it at 1440 and at 390 wide: every recipe draws, the
      console has no error, the headings are `h1` to `h6` named by their words, a press of "next chapter"
      morphs the chapter heading, and pointing at a link or tabbing to it wakes its lights. Stop the server by its own PID.
- [ ] With reduced motion on (the browser or the OS setting), every component is drawn once and still.

## 5. Performance

- [ ] On a quiet box (load well under one per core, high power mode on a Mac), start the demo and run
      `python3 tools/perf_check.py --base http://localhost:<port> --rounds 3 --json <file>`. Paste the table and its
      stamp into the README's Performance section. A busy box reads slow through no fault of the code: record such
      a run as confounded and keep the older table.

## 6. The standalone export

- [ ] Commit, then `DEST_ROOT=<a folder outside this repository> bash SETTLE/tools/export_settle_repos.sh --only
      settle-see --only settle-text`. The scan reports no unreviewed hit, the export's `package.json` depends on
      `github:triplesparkle/settle-see`, and it carries no lock.
- [ ] In a scratch copy of that export, point `settle-see` at the exported `../settle-see` and run
      `npm install && npm test`: the suite passes outside this repository.
- [ ] Pushing (`--push`) is a separate decision; the repositories are private.

## The last run: 0.3.0, 2026-10-05

| check | result |
|---|---|
| manifest | name, version 0.3.0, exports, peers and the one dependency as above; no `license` field (open) |
| `npm pack --dry-run` | 43 files, 272 kB packed; no `dist/`, no `node_modules/` |
| `npm test` | 70 tests, 70 pass |
| demo build | builds (vite 6.4.3) |
| demo in Chromium | 1440 and 390 wide, and reduced motion: seven headings found by role, level and name; no console error; the chapter heading morphed; three links found by role and name, each as wide as its words (62, 97, 120 px); a settled link drew 0 frames a second at rest, 21 on hover and 28 on keyboard focus, and 0 for both under reduced motion |
| performance | re-run in low power mode at a load of 265 on 18 cores: confounded, about twice the README's table, every shape claim held (still mode 0 frames in 5 s); the table was kept |
| standalone export | settle-text: scan clean (0 secret, 0 dev-only hits), depends on `github:triplesparkle/settle-see`, no lock; outside the repository `npm install && npm test` 62 of 62 (before hover and SettleLink) and the demo builds with settle-see from `node_modules` |
| settle-see export | STOPPED by the export's own scan: one unreviewed dev-only hit, the English word "arrival" in a comment in `src/radialeffects.js`; a false positive for the export script's owner to review |

**Open, for the navigator:** the licence (section 1). Nothing else blocks a release.
