# Morii Layout — page skeletons · block segmentation · container atoms

> **When to read:** while building the page structure (first step of stage ②). If the output is a page or app screen, this file applies.
> This file owns **static structure**. Everything that *behaves* — sticky frame, view switching, overlays, toasts, steppers, collection routing, the density valve — lives in `SHELL.md`.

---

## 1. Page skeleton — build this first, not a card

Pick one from what the content actually is:

| Skeleton | Structure | Fits | Content width |
|---|---|---|---|
| **App shell** | top bar (brand + view tabs + actions) + optional sidebar (nav) + content area | tools · productivity · admin | depends on content |
| **Full-width content flow** | single centered column + heading area on top | reading · editorial | 680–820 |
| **Dashboard grid** | responsive grid of metric blocks | data · operations | 1100–1280 |
| **Mobile-first single column** | full-height vertical flow + bottom tab bar | health · lifestyle | `min(440px,100%)` |

- **Fill the viewport:** `body` never centers a small card. `max-width` is page-level, narrowing responsively down to mobile.
- Mobile-first single column means a **full-page vertical flow**, not one floating card.
- Multiple views live in the same `body`, switched by tabs (`SHELL.md` §2) — not one card per view.

## 2. Block segmentation — full-bleed first, cards are the exception

Segmentation priority: **① full-bleed block + generous whitespace > ② very faint hairline > ③ pure whitespace.**

**A card inside a page is one optional grouping container, not the page itself.** Use one only to *elevate a genuinely independent idea* — cards should be large, few, and widely spaced. **A page may contain zero cards.**

**Container principle:** a box exists only to group **≥3 atoms of the same kind**; single and double values sit open on the page. **Delete every container you can** — one less nesting level is one less unit of noise.

**Note tiles on an equal-width grid.** A set of similar small blocks (notes / quick facts / tag cards) must use `grid` with **equal width and height**. The `flex-wrap` pattern — ragged last row, widths jumping with content length — is banned; a ragged right edge is one of the main sources of the cheap look. If content lengths differ, truncate or shrink the type; do not let the container deform.

## 3. Container atoms

**Data widget anatomy** — the internal structure of **one metric block inside a page**, **not a whole-page template**:

```
[icon tile + gray title + ⓘ] … [ghost ···]
  → HERO + delta chip
  → one gray line of context
  → chart area, 40–60%
  → micro axis labels
  → stat / point rows
  → inset block
  → source (weakest layer)
```

| Atom | Spec |
|---|---|
| **Insight line** | At most one verdict per screen: a ≤18 字 conclusion (weight 650), placed under the hero or above the chart. **No leading dot** — if it needs marking, use a single ≤4 字 chip (「结论」「风险」), or rely on weight and position alone. State the conclusion; never restate the chart. |
| **Stat row** | 2–4 values side by side: ink-colored large figure with a gray label beneath, no box, sharing a baseline. |
| **Number block** | gray label → large figure → context line. No `0→742` fusion, no colored figures. |
| **Point row + echo** | **an icon or a chip** (never a dot) + a ≤7 字 phrase (600) + right-aligned evidence value + a graphic echo (a micro-bar when units are comparable). **The whole column must use one prefix form** — never a dot on one row and an icon on the next. |
| **Inset block** | recessed neutral block, no border; quotes / recommendations / secondary groups. |
| **Icon tile row** | square + name + gray meta + chevron or value; entity lists. |
| **Inverted mini-card** | a reverse-colored sub-card for one emphasized item, ≤1 per card. |
| **Segmented pills** | segmented control: inset track + active thumb in the card surface color. |
| **Citations** | Sources never sit on the card face: one quiet entry point opens an inside-window peek or a drawer (`SHELL.md` §3); a faint accent `.ref` superscript marks the claim; inside that layer, numbered entries plus a row of SVG letter medallions. |

### Record face — showing the fields of ONE record

The screen whose whole job is "here is one record" (a detail page, a profile, a drawer's read-only side, a task/ticket view). Its default failure is a **`Label   Value` list, aligned into two columns** — every row the same visual weight, so the reader scans all of them to find the one that matters. Fields in a record are never equally important; rank them instead:

| Tier | What goes there |
|---|---|
| **① Status** | The one thing that changes what the reader does next — a single chip at the very top, above the title. Normal states stay bare text; only the states that need action (`warn` / `crit`) get a tinted pill, so the *presence of a container* is itself the signal. |
| **② Identity** | Name / title as a heading — never `标题：xxx`. If a persistent header already carries it, it is **not** repeated in the body. |
| **③ Meta pairs** | icon plinth + **caption-tier gray label above** + **body-tier bold value below**, 2 per row. The scan path becomes the value line alone; labels are read only on the way back. |
| **④ Prose** | Any real sentence leaves the field grid: full width, line-height 1.7, its own row. Prose squeezed into a half-width cell becomes a narrow column the eye has to zig-zag down. |

**The label is demoted, not deleted.** Deleting labels requires the icon to carry the whole meaning — and a `user` glyph next to 「张三」 cannot say whether that is the legal rep, the contact, or the owner. Where the value is not self-describing (a tax number, a short name, an employee id), a deleted label always comes back — usually smuggled into the value as `电话 138…`, which is *worse* than the two-column list, because now label and value share one type tier and must be read word by word. Delete a label only when it repeats what the icon **and** the value already say.

**One empty-value sentence, written once by the renderer**, in the faintest ink and not bold — a missing phone number is a gap to fill, not content. Never let each screen invent its own (「未填」/「无」/「—」), and never hide the row: hidden means nobody knows to fill it. Hiding is for fields that genuinely do not exist on this kind of record.
