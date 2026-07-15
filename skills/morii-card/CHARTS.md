# Chart patterns — router only, one file per chart type

The geometry lives in `charts/<type>.md` — each file is self-contained (builder + geometry + its own interaction). **Read ONLY the file(s) for chart types on THIS card**, parallel with `SNIPPETS.md`; never read them all. Next tool call after the reads = the Write.

| Chart on the card | File |
|---|---|
| trend line / sparkline / area fade | `charts/trend.md` |
| category bars / highlight bar / avg line | `charts/bars.md` |
| donut / concentric rings | `charts/donut.md` |
| leaderboard (ranked named entities) | `charts/leaderboard.md` |
| spike / vital micro-bar stream | `charts/spike.md` |
| phase strip / hypnogram band | `charts/strip.md` |
| radar | `charts/radar.md` |
| DASH widget bento (layout) | `charts/dash.md` |
| stage + mini-graphic selector (layout) | `snippets/stage.md` |

**No file listed** (bullet/ring target, heatmap tint cells, dot strip/waffle, proportional circles, range track + position dot, delta chip, two-period overlap bars): no locked pattern — compose directly under `SKILL.md` chart build rules + the one-SVG rule in `SNIPPETS.md` (ONE svg, fixed px height, ≤4 ticks, values on-chart, bars start at 0, percentage coords for circles/text, `role="img" aria-label`).

Patterns lock what breaks — coordinate math, % centering, aspect, alignment — NOT design. Re-mapping data, swapping accent pairs, scaling, combining, layering new ideas on top is expected. Copy the math; keep inventing.
