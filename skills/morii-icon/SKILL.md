---
name: morii-icon
description: >
  Use when drawing a single SVG icon / glyph / small pictogram, to lock it into the Morii
  solid style: flat · high-radius · bold-filled · non-linear (a solid glyph, NOT a thin
  outline-stroke icon). Reach for it on any 「做个图标 / 需要个 xx 图标 / 画个 svg 图标 /
  加个 icon / 换个图标 / 设计一套图标 / empty-state pictogram / a small graphic inside a
  button」 so every hand-authored SVG icon comes out in one consistent family. Keywords:
  图标 icon svg 字形 glyph 实心图标 filled icon pictogram. It is the icon companion to
  morii-design / morii-card — those build whole pages / cards, this governs how one icon
  itself is drawn. Do NOT produce thin outline-stroke icons (a different style this skill
  deliberately departs from); never use emoji. Triggers: 图标, icon, svg 图标, glyph,
  实心图标, 做图标, 画个图标, 一套图标, icon set.
allowed-tools:
  - Read(~/.claude/skills/morii-icon/**)
  - Bash(node:*)
  - Bash(qlmanage:*)
---

# Morii Icon — solid, full, premium glyphs

**A discipline for drawing one SVG icon, not an icon library.** It makes every hand-authored icon a member of one family — solid, full, softly rounded, single-color, identical in light and dark. There is **no copy-from catalog** — design each icon fresh from the rules; a library of skeletons only makes output templated. And you cannot judge an icon from its SVG string, so **render it and look** (§6).

A Morii icon is a **bold, full, solid glyph — mass, not outline.** It fills its frame, rounds every corner, carries one clean silhouette with detail tucked inside, and reads the same in both themes. Vibe: the iOS / Fluent *solid* set. It is the solid branch of [morii-design] §4, made precise — thin outlines go fuzzy at small sizes and waver across themes; solid mass stays legible at 14–24px and stable when the theme flips.

## Roots — every rule below flows from these (break one = off-family)

1. **Mass, not line.** Solid filled shapes (`fill="currentColor"`), never a 1.5–2px outline. An *object* (battery, folder, card) is a **solid** shape, never a hollow outline frame. "Line" feel only via a **thick round stroke**, and only for an inherently-linear glyph (magnifier ring, checkmark, wifi arcs).
2. **Fill the frame.** Fill generously — **tall and full**, reaching top-to-bottom; only a thin safe margin. The user's word **留白 means the filled area** (maximize it), not empty space. Never thin-timid, flat-squat, or hollow.
3. **Soft.** High radius everywhere — squircle silhouettes, round caps/joins; no sharp corner anywhere.
4. **Simple outside, rich inside — and the inside NAMES the thing.** One clean, **continuous** outer silhouette; complexity (knockout / tonal detail) lives **inside**. Never a busy, spiky, or fragmented edge — a gear is one continuous cog, not a ring of floating teeth. The interior detail is not decoration: it is the **concrete signature that says what this is** — a calendar's date grid, a camera's lens, a battery's terminal nub, a clock's two hands. Literal, not abstract: pick the one real detail that makes the meaning unmistakable at 16px and tells it apart from its nearest neighbour. A generic rounded blob with a vague notch fails — if the silhouette is common (rounded square, circle), the detail must carry the whole meaning.
5. **One measured family — shared parts, no near-duplicates.** Every icon shares: one **optical size** (balanced by visual weight, not bounding box) · single **`currentColor`** · one radius scale + one stroke scale · grid-snapped, formula-placed coordinates · centroid at (12,12) · one integrated silhouette (no scattered floating parts). Reuse the **same base parts** set-wide — one shell rounded-rect, one dot pitch, one arrowhead — so the set is a kit, not a pile. Never ship two glyphs that read alike (two near-identical arrows, three gears); one shape per role, reused, not re-invented. A row of them must read as a single set.
6. **Flat & theme-robust — the mass wears the color.** Pure fills — no gradient / shadow / highlight / bevel. Depth comes only from **knockout** (transparent holes, theme-identical) or a small **tonal layer** (§3). The **full-strength color is the dominant mass / backplate**; knockout and tonal detail are the **minority** (the body wears the accent, detail recedes — never the inverse). Verify light + dark, every time.
7. **One concept, drawn once.** One icon = one thing — and one thing = one icon. An object renders it richly (detail inside); a glyph stays a clean silhouette. No badges, no second idea, no decoration for its own sake. Before drawing a new glyph, check the set: if an existing icon already carries this meaning (or a trivially-different one), **reuse or extend it** — don't add a synonym.

## 0. Design loop (every icon)

1. **Check the set first (no duplicates).** Does an icon already in this set carry this meaning, or a near-twin shape? If so, **reuse / extend / rename** it instead of drawing a look-alike (root 5, 7). Then **classify** — a **container/object** (a shell that holds something: solid, filled, tall) or a **glyph** (one shape).
2. **Name the meaning, then design fresh from the Roots + the relevant §4 technique** — there's no catalog to copy; build *this* icon for *its* meaning. Decide the **one concrete detail** that makes the use unmistakable (root 4) before you draw the shell. Glance at `exemplars.svg` for the family vibe (proportion, weight, roundness, detail density), never to clone paths.
3. **Snap to grid, share axes, formula-place** repeats; reuse the set's shared base parts; centroid at (12,12) (§2).
4. **Detail inside** via knockout (or tonal for a band/fold), filling the interior with a ~2px margin (§3) — the detail must *read as the thing*, not as abstract filler.
5. **Render light + dark at small size, look, fix** (§6). Never judge from the string.

## 1. Construction — canvas · fill · proportion · size

- **`viewBox="0 0 24 24"`** — same grid as existing Morii icons (interchangeable).
- **Live-area frame.** Author so the artwork fills the grid (reach ~`2–22`, tall and full), then wrap all paths in `<g transform="translate(12 12) scale(.98) translate(-12 -12)">…</g>` — a thin safe margin so nothing bleeds off-edge. Generous (大方) = a big full form, not air around a small one (root 2).
- **Proportion: tall and full, never flat.** Fill the height. A note is portrait; a glyph reaches top-to-bottom. Only genuinely-horizontal objects (battery, card, wallet) stay landscape — and even those take maximal height, never a thin bar.
- **Unified optical size** (root 5). Balance by visual weight: a solid blob (cloud) reads *bigger* than an airy glyph (sun, share) at the same box, so sit heavy shapes a touch **smaller** and airy ones larger until none jumps a size-level. Anchor on a shared main-mass height (~16–19 of 24); tune outliers by eye in the rendered set.
- **Render size** 16–24px. **Color** neutral ink by default; accent only on active/focus. **A11y**: semantic → `role="img"` + `aria-label`; decorative → `aria-hidden`.

## 2. Alignment & family consistency (compute, don't eyeball)

Crooked detail is almost always hand-typed dirty decimals that drift.

- **Snap to a 0.5 grid** — key edges / centers on integers or half-integers; `8.27` *is* the misalignment → `8` or `8.5`.
- **Share axes** — a row of dots shares one `cy`; text lines share one left `x` + one pitch; mirror symmetric shapes about `x=12`.
- **Formula-place repeats** — `coord = center ± i·pitch`, equal pitch / radius / corner-radius. Radial shapes (gear, sun, sparkle) are generated as **one continuous path** (root 4), never separate floating pieces — compute the vertices.
- **Centroid at (12,12)** — the *visual* center, not the bbox. Nudge pointed / asymmetric shapes (play, pin, bolt) until they look dead-centered. The §1 frame scales about (12,12), so it preserves your centering — get it right first.
- **Stepped scales** — share one corner-radius scale (e.g. `1.2 / 2.2 / 3.4`) and one stroke scale (e.g. `2.4 / 3.4`) set-wide; a fresh value per icon breaks the family. Inner lines/dots use pills (`rx = h/2`).

## 3. Detail & theme robustness

- **Detail is meaning, not garnish — it must NAME the thing (root 4).** The right detail is the one that makes the use unmistakable and tells the icon apart from its neighbours: a calendar's date grid, a clock's two hands at a readable angle, a camera's lens + viewfinder, a battery's terminal + charge level, a folder's tab, a lock's shackle. Concrete and literal over clever and abstract — a viewer at 16px should *name it without the label*. When the outer silhouette is generic (rounded square, circle, sheet), the interior detail carries the entire meaning, so choose it deliberately.
- **Objects earn rich detail; bare reads cheap.** A calendar gets a tonal header band + a date grid; a note a dog-ear + text lines; a camera a lens + viewfinder; maybe one highlighted element. Build a crafted *system* **inside the simple outer shell** (root 4). Glyphs are exempt — their craft is the silhouette.
- **Detail FILLS the interior** with a modest ~2px margin — not floating lost in the middle, not crammed against the wall. Fine and exact: small dots, thin lines, crisp cells, all on the §2 grid.
- **Color weight — the MASS wears the accent, detail recedes (重点色权重).** The full-strength color is the **dominant area** and sits on the **main mass / backplate (背板)** — the body of the object. Every second tone is the **minority**: a knockout hole (= background) or a *lighter* tonal tint, and it lives **only on small interior detail** (a clip, lines, a band, a fold, a lens) — **never on the body**. **Full-color area ≫ secondary area, always** — aim for the solid body to be ~70%+ of the inked pixels. **Never invert:** never wash the body down to a pale tint while a small detail (a clipboard's clip + two lines) carries the full saturated color — that makes the *detail* read as the subject. If the light tint landed on the big shape, you've flipped it — swap them, or knock the detail out instead. (Glyphs are single-tone, so this is automatic; it bites on **objects** that use duotone/knockout.)
- **Knockout = the default** (theme-identical). Solid body + `fill-rule="evenodd"` sub-shapes punch transparent holes; a hole always equals the background, so it reads the same in both themes (§4 G).
- **Tonal layer for a band / fold / recess** (§4 H). A *small, non-overlapping* shape at `opacity:.4` reads as a real mid-tone in both themes. The trap: a *large* translucent area goes muddy-gray on dark; a translucent layer *over* the solid body shows nothing.
- **Iron rule:** render light AND dark every time. Muddy or lost in dark → convert that tonal area to knockout.

## 4. Techniques (A–C mass · D–E line-as-mass · G/H detail)

The snippets below are **method demos** — learn each construction, then design the real icon fresh from the Roots. They show *how* a shape is built, not *what* to copy; don't clone-and-rename them.

- **A. Solid path** — heart / home / bolt / message shell. Draw the solid silhouette; its own curves round it.
- **B. Rounded-rect / circle assembly** — plus / trash / user. `<rect rx>` + `<circle>`, `rx` ≈ 35% of the short side. Most controllable.
  `<rect x="9.5" y="3" width="5" height="18" rx="2.5"/><rect x="3" y="9.5" width="18" height="5" rx="2.5"/>`
- **C. Naturally round curves** — sparkle / heart. Concave + convex `C` curves; endpoints inherently round.
- **D. Round-by-stroke** (rounds sharp glyphs) — send / arrows / bolts. Draw the angular **solid** polygon, then add a same-color `stroke-width≈2.4` + `round` join/cap: rounds the corners and **inflates ~1.2px** (draw the core ~1.2px small). No arc math.
  `<path d="M12 3.6 19.6 11.2H15.4V20.4H8.6V11.2H4.4Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`
- **E. Thick round stroke (line-as-mass)** — check / search ring. Inherently-linear glyphs keep mass via `fill="none"` + `stroke-width≥3` + `round`. The only exception to root 1; thin-to-2px breaks it.
  `<path d="M5 12.8 9.8 17.6 19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`
- **G. Knockout (detail default)** — solid body + `fill-rule="evenodd"` sub-shapes = transparent holes (dots / lines / lens / peak), theme-agnostic. Place holes by §2 formula; keep them small so fill dominates.
  `<path fill-rule="evenodd" d="M4 5h16v14H4Z M9 11a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z"/>` — body with one knocked-out dot.
- **H. Tonal layer (duotone done right)** — header bands / folds / recesses. A **separate** shape at `opacity:.4` that does **not** overlap the solid body, is the **minority** area, and tints a **detail** — **never the body** (color-weight rule, §3). The solid full-color shape is the mass; the tonal shape is the smaller detail. Get it backwards and the detail screams while the body washes out.
  ```svg
  <path d="M7.4 5H16.6A3.4 3.4 0 0 1 20 8.4V9.8H4V8.4A3.4 3.4 0 0 1 7.4 5Z" opacity=".4"/>  <!-- lighter header band -->
  <path d="M4 9.8H20V17.6A3.4 3.4 0 0 1 16.6 21H7.4A3.4 3.4 0 0 1 4 17.6Z"/>                 <!-- solid body below -->
  ```
  **Weight: wrong vs right — clipboard.** ✗ *inverted* (the clip's bug): body at `opacity:.4`, clip + lines solid → the small details carry the heavy accent, the backplate is a wash. ✓ *correct*: the **whole body is the solid full-color mass** (clip tab merges into it), the lines are **knocked out** (= background, the non-accent detail):
  ```svg
  <rect x="9.2" y="2.4" width="5.6" height="4.4" rx="2.2"/>  <!-- clip tab: solid, merges with body -->
  <path fill-rule="evenodd" d="M6 4.6h12a2 2 0 0 1 2 2v12.8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.6a2 2 0 0 1 2-2Zm2.4 7.2a1 1 0 1 0 0 2h7.2a1 1 0 1 0 0-2Zm0 3.6a1 1 0 1 0 0 2h4.8a1 1 0 1 0 0-2Z"/>
  ```

## 5. Style reference — look, don't clone

There is deliberately **no copy-from catalog of icons** — a library of skeletons makes output templated (every new icon a rehash of the same dozen). Design from the Roots + §4 techniques instead. Use `exemplars.svg` (+`-dark`) only to *see* the family's vibe — proportion, weight, roundness, detail density — never to copy paths. **Consistency comes from the rules and the render-self-check (§6), not from cloning.**

## 6. Self-check — render both themes, at small size (mandatory)

You can't see quality in an SVG string. **The builder holds no icon data — it reads your project's real registry** (the single source of truth, §8), so what you render IS what you ship; never paste icons into the skill. Author your icons in the registry/draft file in the project, then **run the builder from the project root** — it writes `contactsheet.svg` / `-dark.svg` (+ `design-card.html`) into the **project dir** (`--out`, default cwd), never into the skill folder:

```bash
# one-shot static emit (auto-detects the registry in cwd, or pass the path):
node ~/.claude/skills/morii-icon/build-gallery.mjs build [path/to/icons.ts]
qlmanage -t -s 900 -o <dir> contactsheet.svg        # zoomed: curves & corners
qlmanage -t -s 200 -o <dir> contactsheet.svg        # ~24-32px each: as actually used
qlmanage -t -s 900 -o <dir> contactsheet-dark.svg
```

Prefer the **live server** while iterating — it re-renders on every save, so edit the registry and the contact sheets stay current for re-checks:

```bash
node ~/.claude/skills/morii-icon/build-gallery.mjs serve [path/to/icons.ts] --port 4321
# open http://localhost:4321 (live card) AND qlmanage the auto-updated contactsheet.svg in cwd
# the server auto-stops ~60s after the card is closed (--idle); GET /quit or TaskStop to stop now
```

Read each PNG. **Judge at real UI size (16–32px), not only zoomed** — crowding, a severing gap (断层), lost detail, and size mismatch only show small. Per icon, in order: **reads as its meaning** (name it at 16px without the label; the detail says what it is — root 4) · **no near-twin in the set** (no two icons read alike — root 5) · **same optical size as its neighbours** (does any jump a size-level?) · **simple, continuous outer** (detail inside, not a busy/fragmented rim) · **centered** (centroid dead-center) · **solid, full, TALL** (fills the box, not thin/flat/squat/hollow) · **accent on the MASS, not the detail** (the full-strength color is the dominant body; if the backplate looks washed and a small detail pops, the color weight is inverted — §3) · **detail aligned and filling** (shared axes, equal pitch, ~2px margin then fills; no dirty decimals) · **dark clean** (not muddy or losing a layer — tonal → knockout). Fix, re-render, until the family is clean at small size.

> Note: qlmanage renders a **square** thumbnail and **bottom-crops a portrait sheet** — a >16-icon sheet laid out tall loses its last row. The builder sizes columns so the sheet stays landscape (rows ≤ cols). No qlmanage (non-macOS): open the live server URL, `open design-card.html`, or headless chrome / rsvg-convert.

## 7. Design card — the project's standing icon dashboard (always the entry)

**Every icon task goes through the card — designing a set, a redesign, OR changing a single glyph.** It is not an optional review checkpoint and not just for sets: it is the project's **standing icon dashboard**, the single human entry to the project's Morii icon set, launchable anytime. There is **no "offer it / yes-no" step and no "more than one" gate** — always serve it. Full flow + template: **`design-card.md`** (Read it then). In short:

- **Launch on demand** — `node ~/.claude/skills/morii-icon/build-gallery.mjs serve` (you run it; nothing is added to the project beyond the regenerated card + contact sheets). It reads the project's **real registry** (§8) — single source — and indexes **that set only**. It **auto-opens the card in the browser** on start (`--no-open` to skip); also give the user `http://localhost:4321` as a fallback / reopen link. "随时可开启" = ask and it serves.
- **Live + change-highlight** — edit the registry; the card re-renders on save and **rings the tiles changed this session** (added or edited since serve started, cumulative until restart) with a soft full-perimeter halo + corner dot — **never a `border-left` accent callout**. So even a one-icon edit is one glance: the user sees exactly which tile moved.
- **Two layers, in sync** — you still self-check via qlmanage PNGs (§6 — you can't see the browser); the user reviews via the live card; same generator, so they never drift.
- **Auto-stops** — idle after the card is closed (`--idle`, default 60s); relaunch anytime. Closing cleans up; opening = ask again.

The user names which icons to revise; edit only those in the registry, save, the card re-renders in place and re-rings them. Repeat until confirmed. The registry is already the deliverable (§8) — no copy-back.

## 8. Delivery — one registry, one render entry (never inline `<svg>` twice)

An icon is defined **once** and referenced by name, never hand-written inline at each use site — this is what keeps a deployed set one family. **This registry is also the single source the design card and the self-check read** (§6, §7) — author here, render from here, ship from here; one file, no copies to drift.

- **Central registry**: one entry of named artwork — `export const icons = { send: '<path …/>', … }`. The builder reads this file directly (object-map or `[{name, inner}]` array, `.ts`/`.js`/`.mjs`/`.json`); a TS type annotation on the declaration is fine.
- **Single render entry**: one small `Icon` component/function wraps the artwork in the shell **once** — `viewBox`, the §1 live-area frame, `fill="currentColor"`, size, a11y. The shell lives in one place, so it can't drift or be forgotten.
- **Consumers use the name**: `<Icon name="send"/>` or `icon('send', 20)` — never a raw `<svg>` pasted in.
- Framework-agnostic: Morii's Vue repo → `Icon.vue` + `icons.ts`; React → `<Icon>` + `icons.ts`; plain HTML → a JS `icon(name,size)`.

## Write-time floor

Hold while drawing, fix on sight: **mass not line** (solid; objects solid, not hollow frames) · **fill the frame, tall & full** (live-area .98), never thin / flat / squat / hollow · **soft** (big squircle radii, no sharp corners) · **detail NAMES the thing** — concrete, literal, reads at 16px, never abstract filler · **no near-duplicates** — reuse a shared part, don't draw a synonym; one shape per role · **simple continuous outer, rich detail inside** that fills its area (~2px margin) · **one measured family** — unified optical size, single `currentColor`, stepped scales, grid-snapped + formula-placed, centroid (12,12), one integrated piece · **flat & theme-robust** — knockout (G) for holes, small tonal layer (H) for bands, verified light AND dark at small size · **color weight** — full-strength color on the MASS/backplate (dominant area); knockout/tonal detail is the minority, never the body (no inverted clip) · **author in the project registry, render & ship from it** (no copies in the skill folder; output lands in the project dir) via one registry + one Icon entry.

---

References: style vibe (look-only) `exemplars.svg`(+`-dark`) · review card flow `design-card.md` · live server + self-check tool `build-gallery.mjs` (reads your registry, outputs to the project dir) · parent [morii-design] §4.

[morii-design]: ~/.claude/skills/morii-design/SKILL.md
