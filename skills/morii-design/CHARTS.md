# Morii Charts — graphics and charts

> **When to read:** whenever the page draws any SVG graphic or chart.
> "≥1 graphic per block" is an iron rule, so nearly every page reaches this file.

All inline SVG, zero dependencies, self-contained. Rules first, then the three pieces of geometry that are easy to get silently wrong (§9). Composition is yours.

---

## 1. Graphics first

For any piece of information, first ask whether it can be **drawn**; fall back to text only after. Every block gets ≥1 graphic, and figures get an echo beside them to convey magnitude.

## 2. The one-SVG rule

- **Two or more parts that work together go inside a single `<svg>`**, aligned by a shared coordinate system. **Stitching absolutely-positioned CSS fragments is banned.**
- A full-width SVG containing circles or text uses **no `viewBox`** — adaptive coordinates instead. Stretching a `viewBox` squashes circles and deforms glyphs.
- Only pure `line`/`rect` graphics may use `viewBox` + `preserveAspectRatio="none"`.

## 3. Coordinates (learn this once and never forget)

Percentages **only work in attributes** — `x` / `y` / `cx` / `cy` / `r` / `width` / `height` accept `50%`, but **`<path>`'s `d` never accepts percentages**. Use one and the whole path **silently fails to render**: the chart goes blank and the console says nothing.

For line and area paths: **measure the container width in JS, compute pixel coordinates**, and redraw on `resize`.

```js
const W = svg.getBoundingClientRect().width;        // measure it
const x = i => padX + (i / (n - 1)) * (W - padX * 2);
const d = pts.map(([px, py], i) => (i ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1)).join(' ');
```

## 4. Chart integrity

- Every chart occupies a **full row width** with a **fixed pixel `height`**.
- If it gets too narrow to read (<240px, bars <8px, colliding labels), **stack it or cut items** — never scale it into distortion, never scroll it horizontally.

## 5. Type lookup

| Relationship | Graphic |
|---|---|
| Trend over time | line + same-hue area fade + end-point value tag |
| Categories | rounded bars: **gray everything, one focus bar in accent, plus a tag** |
| Share of total | donut, ≤5 slices |
| Two periods | slope / dumbbell |
| Time × category | heat grid |
| Vitals / dense stream | spike micro-bars + peak anchor annotation |
| Multi-dimensional | radar (fixed px only) |
| Change | delta chip |

**Anchor annotation:** emphasize a single point inside the graphic (the peak plus its value, set tight against it). It replaces the legend.

## 6. Hygiene

- Axis ticks ≤4
- No grid lines, or ≤8% opacity
- Bars **start at 0**
- Values labeled on the graphic
- Every `<svg>` carries `role="img"` + `aria-label`
- **Builder JS wrapped in a `try/catch`**, failing over to a visible "chart failed to render" notice — **never a silent blank**

## 7. Chart interaction (tap-first) — ships in the static build, never gated

**This is an interaction capability, not motion polish.** It is not behind the stage-⑤ gate: a chart that ignores tap is dead whether or not motion was authorized.

- **4+ bars must have scrub-focus:** every bar shows its value, **the whole column is the hit area** (never the small graphic element itself), press-and-sweep moves the focus, and a readout row follows along. Default focus = the insight bar.
- Trend charts add a crosshair; donuts switch the center on slice tap.
- Transition between focus states ≤180ms.
- `touch-action: pan-y` on the scrub area so vertical scrolling survives; on desktop, `user-select:none` + `preventDefault()` in `pointerdown` so dragging does not select text.

Entrance motion (line-draw / bar-grow / count-up, play once) is the gated part and lives in `MOTION.md` §9.

## 8. Geometry you can derive on the spot

Line, area, bars, and heat grids are plain arithmetic on the measured width (§3) — no recipe needed. Rounded bars are `<rect>` with `rx="var-sized"`; a heat grid is a nested loop of `<rect>`. Compose them.

## 9. Geometry that goes silently wrong

Three shapes where the math is unforgiving: an off-by-one here renders *something*, just the wrong thing, and it passes every syntax check.

**Donut arc.** SVG angles start at 3 o'clock and run clockwise; charts start at 12. Subtract 90°. Build the ring as one `<circle>` per slice using `stroke-dasharray` — no path arithmetic, no large-arc-flag mistakes, and every slice shares one radius so they cannot drift.

```js
/* Construction demo. R and stroke width are yours; keep total gap small so slices still read as one ring. */
const C = 2 * Math.PI * R;                       // circumference
let acc = 0;
slices.forEach(s => {
  const len = (s.value / total) * C;
  circle(s).setAttribute('stroke-dasharray', `${len} ${C - len}`);
  circle(s).setAttribute('stroke-dashoffset', -acc);   // negative: offsets clockwise
  acc += len;
});
/* rotate the whole <g> by -90deg around the center so slice 1 starts at 12 o'clock */
```

≤5 slices; anything past that becomes a bar chart. The center is not decoration — it carries the total or the focused slice's value.

**Radar polygon.** Fixed pixel size only (a stretched radar is meaningless). Axis *i* of *n* sits at `-90° + i·360/n`; every series shares the same angle table or the shapes will not overlay.

```js
const pt = (i, r) => {                            // r: 0→1 normalized value
  const a = (-90 + i * 360 / n) * Math.PI / 180;
  return [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R];
};
const poly = vals.map((v, i) => pt(i, v / max).map(x => x.toFixed(1)).join(',')).join(' ');
```

5–8 axes, ≤2 series. Draw the grid rings with the same `pt()` so the web and the data align exactly.

**Spike stream + peak anchor.** Micro-bars from a shared baseline, each `x` on a fixed pitch so the rhythm stays even; the peak gets an annotation pinned to *its computed coordinate*, never to a guessed offset.

```js
const pitch = (W - padX * 2) / vals.length;       // even rhythm, gap comes out of the bar width
const h = v => (v / max) * plotH;
const peak = vals.indexOf(Math.max(...vals));
const anchorX = padX + peak * pitch + pitch / 2;  // annotation reads this, never a literal
```

Clamp the annotation's `x` so it does not run off either edge, and flip its `text-anchor` when it is within a label-width of the right edge.
