# DASH bento — multi-widget dashboard layout

Read WITH the `charts/<type>.md` file of every chart the widgets draw. **Next tool call after the reads = the Write.**

```css
.wrap{width:min(880px,100%);display:grid;gap:16px}
@media(min-width:720px){.wrap{grid-template-columns:1fr 1fr}}
```

Each widget = full `.card` running the complete anatomy formula, with its OWN domain accent pair as widget-class vars:

```css
.w-bal{--a:#6366f1;--at:light-dark(#4346ad,#a7abf7)}
.w-hr{--a:#f43f5e;--at:light-dark(#be123c,#fda4af)}
```

Header per widget: 22px tile + title + ⓘ (CSS tooltip) + ghost `···` → shared overlay. Surfaces stay neutral; one pair per WIDGET replaces one pair per card — but a DASHBOARD of one entity keeps ONE accent across ALL widgets (per-widget hues only when the widgets are genuinely independent domains; a rainbow is the failure mode). A DASH stat row may color ONE delta value in text-grade accent (chip semantics, boxless) — the only bare-colored-value exception.

FAST → 2 richest widgets (~10KB) + upgrade offer; RICH → full 2×2. Every widget graphic-first + interactive.
