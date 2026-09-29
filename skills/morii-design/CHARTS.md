# Morii Charts — graphics and charts

> **Read** whenever a page draws any SVG graphic or chart. Every block gets at least one graphic, so nearly every page reaches this file. All inline SVG, zero dependencies.

## 1. Graphics first

For any piece of information, first ask whether it can be **drawn**; fall back to text after. Figures get a graphic echo beside them to convey magnitude.

## 2. One SVG per graphic

- Parts that work together live in **one `<svg>`** and share its coordinate system — never stitched from absolutely-positioned CSS fragments.
- A full-width SVG containing circles or text uses **no `viewBox`** (stretching squashes circles and glyphs); only pure `line` / `rect` graphics may use `viewBox` + `preserveAspectRatio="none"`.

## 3. Coordinates

Percentages work in attributes (`x`, `cx`, `width` …) but **never inside a `<path>`'s `d`** — one `%` and the whole path silently renders nothing. Measure the width in JS, compute pixels, redraw on resize:

```js
const W = svg.getBoundingClientRect().width;
const x = i => padX + (i / (n - 1)) * (W - padX * 2);
const d = pts.map(([px, py], i) => (i ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1)).join(' ');
```

## 4. Integrity

A chart takes the **full row width** at a **fixed pixel height**. Too narrow to read (<240px, bars <8px, colliding labels) → stack it or cut items; never squash it, never scroll it sideways.

## 5. Which graphic

| Relationship | Graphic |
|---|---|
| trend over time | line + same-hue area fade + end-point value tag |
| categories | rounded bars: all grey, one focus bar in accent, with a tag |
| share of a total | donut, ≤5 slices (more → bars) |
| two periods | slope / dumbbell |
| time × category | heat grid |
| dense stream | spike micro-bars + a peak annotation |
| many dimensions | radar, fixed pixel size |
| change | delta chip |

**Annotate on the graphic** — the peak and its value set tight against it — instead of a legend.

## 6. Hygiene

≤4 axis ticks · no grid lines, or ≤8% opacity · bars start at 0 · values labeled on the graphic · every `<svg>` has `role="img"` + `aria-label` · the builder is wrapped in `try/catch` that shows a visible "chart failed" notice — never a silent blank.

## 7. Interaction ships in the static build

Tap interaction is capability, not motion polish:

- **4+ bars get scrub-focus:** each bar's whole column is the hit area, press-and-sweep moves the focus, a readout follows; the default focus is the insight bar.
- Trends get a crosshair; donut slices switch the center value.
- Focus transitions ≤180ms; `touch-action: pan-y` on the scrub area; on desktop, `user-select:none` + `preventDefault()` on `pointerdown`.

## 8. Geometry that goes silently wrong

**Donut** — one `<circle>` per slice with `stroke-dasharray`; the group rotated −90° so slice 1 starts at 12 o'clock; the center carries the total or the focused value:

```js
const C = 2 * Math.PI * R; let acc = 0;
slices.forEach(s => { const len = (s.value / total) * C;
  arc(s).setAttribute('stroke-dasharray', `${len} ${C - len}`);
  arc(s).setAttribute('stroke-dashoffset', -acc); acc += len; });
```

**Radar** — axis *i* of *n* at `-90° + i·360/n`; every series and every grid ring uses the same point function, so they overlay exactly (5–8 axes, ≤2 series):

```js
const pt = (i, r) => { const a = (-90 + i * 360 / n) * Math.PI / 180;
  return [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R]; };
```

**Spike stream** — bars on a fixed pitch from one baseline; the peak annotation reads the peak's *computed* x, clamped inside both edges, with `text-anchor` flipped near the right edge:

```js
const pitch = (W - padX * 2) / vals.length, peak = vals.indexOf(Math.max(...vals));
const anchorX = padX + peak * pitch + pitch / 2;
```
