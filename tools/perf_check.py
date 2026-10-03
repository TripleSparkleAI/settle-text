#!/usr/bin/env python3
"""perf_check.py - the cost of each resolution preset, read from settle-see's own meter in a real browser.

Runs the demo (examples/demo, a dev server you start first), scrolls the resolution ladder into view, lets each
settle come out of noise, and reads handle.perf (physics ms, draw ms, frames) for low, medium and high text at
64 px over the demo's 960 px column, and for a 480 px wide dithered photo. Then flips the demo's still mode and
counts frames over five seconds, which is the still mode's whole cost.

  python3 tools/perf_check.py --base http://localhost:5240 --rounds 3

Prints a JSON record with the machine stamps (load, power mode, headless Chromium) and a Markdown table for the
README. Per-frame numbers are the MINIMUM over rounds (THE LOAD LAW: a busy box reads slow through no fault of
the code; the minimum is the least-confounded reading).
"""
import argparse
import json
import platform
import subprocess
import time

from playwright.sync_api import sync_playwright

LADDER = ['low', 'medium', 'high', 'image']


def stamp():
    out = {'machine': platform.machine(), 'os': platform.platform(), 'date': time.strftime('%Y-%m-%d %H:%M %Z')}
    try:
        out['load1'] = float(subprocess.check_output(['sysctl', '-n', 'vm.loadavg']).decode().split()[1])
    except Exception:
        out['load1'] = None
    try:
        pm = subprocess.check_output(['pmset', '-g']).decode()
        line = [l for l in pm.splitlines() if 'powermode' in l]
        out['powermode'] = int(line[0].split()[-1]) if line else None
    except Exception:
        out['powermode'] = None
    return out


def read(pg):
    return pg.evaluate('''() => {
      const L = globalThis.__ladder || {};
      const out = {};
      for (const k of Object.keys(L)) {
        const h = L[k]; if (!h) continue;
        const g = h.geom || {}; const f = h.field || {};
        out[k] = { phys: h.perf.phys, draw: h.perf.draw, frames: h.perf.frames, w: g.w, h: g.h, lights: (g.w || 0) * (g.h || 0), sweeps: f.sweeps };
      }
      return out;
    }''')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--base', default='http://localhost:5240')
    ap.add_argument('--rounds', type=int, default=3)
    ap.add_argument('--json', default=None, help='write the record here')
    a = ap.parse_args()
    rows = {k: [] for k in LADDER}
    still = None
    with sync_playwright() as p:
        b = p.chromium.launch()
        for r in range(a.rounds):
            pg = b.new_page(viewport={'width': 1200, 'height': 900})
            pg.goto(a.base, wait_until='domcontentloaded')
            pg.wait_for_selector('[data-ladder="low"]')
            pg.locator('[data-ladder="low"]').scroll_into_view_if_needed()
            pg.locator('[data-ladder="image"]').scroll_into_view_if_needed()
            pg.locator('[data-ladder="low"]').scroll_into_view_if_needed()
            time.sleep(0.3)
            before = read(pg)
            time.sleep(1.2)  # the live phase: out of noise, before the rest
            after = read(pg)
            for k in LADDER:
                if k in before and k in after and after[k]['frames'] > before[k]['frames']:
                    df = after[k]['frames'] - before[k]['frames']
                    rows[k].append({'phys_ms': (after[k]['phys'] - before[k]['phys']) / df, 'draw_ms': (after[k]['draw'] - before[k]['draw']) / df, 'lights': after[k]['lights'], 'w': after[k]['w'], 'h': after[k]['h'], 'frames': df})
            if r == 0:
                # the still mode: flip the box, wait, count frames
                pg.locator('input[type=checkbox]').check()
                time.sleep(1.5)
                s0 = read(pg)
                time.sleep(5)
                s1 = read(pg)
                still = {k: {'frames_in_5s': s1[k]['frames'] - s0[k]['frames'], 'lights': s1[k]['lights']} for k in LADDER if k in s0 and k in s1}
            pg.close()
        b.close()
    best = {}
    for k in LADDER:
        if rows[k]:
            best[k] = {'phys_ms': min(x['phys_ms'] for x in rows[k]), 'draw_ms': min(x['draw_ms'] for x in rows[k]), 'lights': rows[k][0]['lights'], 'grid': f"{rows[k][0]['w']}x{rows[k][0]['h']}", 'rounds': len(rows[k])}
    rec = {'stamp': stamp(), 'browser': 'headless Chromium (playwright)', 'column_px': 960, 'text_size_px': 64, 'live': best, 'still': still}
    print(json.dumps(rec, indent=1))
    print('\n| preset | grid | lights | physics ms/frame | draw ms/frame | at 24 fps |')
    print('|---|---|---|---|---|---|')
    for k in LADDER:
        if k in best:
            v = best[k]
            total = (v['phys_ms'] + v['draw_ms']) * 24
            print(f"| {k} | {v['grid']} | {v['lights']:,} | {v['phys_ms']:.2f} | {v['draw_ms']:.2f} | {total:.0f} ms of CPU a second ({total / 10:.1f}% of one core) |")
    if still:
        print('\nstill mode, frames drawn in 5 s:', still)
    if a.json:
        with open(a.json, 'w') as f:
            json.dump(rec, f, indent=1)
    print('\nNEXT -> paste the table into README.md § Performance with its stamp')


if __name__ == '__main__':
    main()
