# Morii Components — which one, and what it must carry

> **Read** when choosing or building any common component, laying out a page or a record, or designing a component that isn't listed. Overlays → `SHELL.md` · states → `STATES.md` · charts → `CHARTS.md`.
> This file decides **which component** fits a need and **what it must carry**, ranked by importance. **It never decides what it looks like.** The form — layout, material, shape, where each part sits — is the divergent half: open for every class until the product decides it (`SKILL.md` §4), then encoded once. Slot lists below are information to carry, not layouts.

## 1. Actions

| Component | Right when | Not when | Carries · axes |
|---|---|---|---|
| **Button** | an action with a verb | it navigates (→ link) | glyph? · label · count? · emphasis · size · tone |
| **Icon button** | self-evident: close, more, search, add, edit, share | ambiguous: archive, sync, export (add a ≤2-word label) | glyph · a name via `aria-label` + tip · size |
| **Toggle button** | a mode that stays on (bold, pin, mute) | a one-off action | `aria-pressed` |
| **Split / menu button** | one default plus a few alternatives | the options are equally common (→ separate buttons or segmented) | the default action · a way to the alternatives |

A button never changes width while it works — its neighbours must not jump.

## 2. Choice controls — count × when it takes effect × single or multi

| Control | Options | Takes effect | Right when |
|---|---|---|---|
| **Switch** | on / off | immediately | a setting that applies as it flips |
| **Checkbox** | on / off, or several of a list | on submit / as selection | booleans in a form; multi-select in lists |
| **Radio group** | 2–5, all visible | on submit | seeing every option matters |
| **Segmented** | 2–5 short labels | immediately | view modes, immediate filters |
| **Select** | >5, or no room | either | one value from a known list |
| **Combobox** | >8, or searchable | either | typing beats scrolling |
| **Chip set** | a few, visible, multi | immediately | filters, attributes |
| **Slider** | continuous | live while dragging, commit on release | approximate values (pair with a number field for precision) |
| **Stepper** | small integers | immediately | quantities in a short range |

Timing must be honest — a switch inside a form with a Save button lies about when it applies. Never a dropdown for two options, radios for more than five, or a segmented control whose labels wrap.

## 3. Fields

**Carries:** a label that stays readable while typing (never placeholder-only) · the control · a hint · an error · a counter near a limit. How the control is drawn — a well, an underline, text that reveals its edge on focus — is a product decision, the same for every field.

- **A hint stays resident only for a format requirement**; other explanations fold into ⓘ (`STATES.md` §5). **The error takes the hint's place**, so the form never jumps.
- **Validate** format on blur, required on submit, live only for things that are live (a strength meter, a counter near its limit). Mark the minority — optional *or* required, whichever is rarer.
- **Kinds are one component with a `kind` axis** — text, number, money, date (typed *and* picked), search (clearable), password (revealable), multi-line (grows, scrolls at a cap).
- **In-place editing** reads as content until hovered or focused; discrete kinds commit at once, text on blur; a failed save stays in place with its error, never silently reverts.

## 4. Display atoms

| Atom | Carries | Rule |
|---|---|---|
| **Chip** | a status or one parameter | only states that need action get a tone, so a toned chip means "look" |
| **Tag** | a category | identity-colored when categories are entities |
| **Badge** | a count on something | attached to what it counts; 99+ cap; gone at zero |
| **Status lamp** | a live state | always followed by its text |
| **Face** | a person or entity | one component owns image → initials → glyph |
| **Number** | a figure | `tabular-nums`; the lead may go a tier up in its tone; animated digits only for values that change in place |
| **Delta** | a change | direction shown by shape as well as color |
| **Icon tile** | an entity's identity | only when the icon *is* the identity |

Chips and tags must be told apart by shape; which shape is which is decided once per product.

## 5. Collections — by the reading task, not the row count

| Task | Form | Must carry |
|---|---|---|
| compare across rows | **table** | column names that stay visible · sorting · numbers aligned for comparison · per-row actions |
| read one at a time | **entry list** | a title · meta · a short excerpt · one trailing value |
| pick among independent things | **cards** | a lead (what changes) · identity · a few facts · at most one action |
| navigate equal peers | **tiles** | equal weight, so equal size |
| hierarchy | **tree** | depth · disclosure · search that keeps ancestors |
| sequence in time | **timeline** | order · "now" |

- **A card needs a lead.** If nothing on it matters more than the rest, it is an entry or a row — a wall of lead-less cards is a wall of equal boxes.
- **Rows** carry leading (glyph, face, checkbox) · primary · secondary · trailing (value, action). The whole row is the hit area; states follow `FOUNDATION.md` §7.
- **Grids align** — a ragged `flex-wrap` edge reads cheap; equal sizes, or a masonry of equal-width columns when real proportions matter (notes, images).
- **Routing by shape:** 3–5 curated items → a briefing deck · 4–8 on one theme → accordion, one open · 6+ → list ↔ detail · >2 themes → tabs · "give me everything" → a flat spread. Every entry is a headline plus a 2–4 sentence summary, never a bare title.
- **Density valve:** >2 topics → tabs · >8 rows in view (or >4 on one face) → fold, page, or list ↔ detail. No infinite scroll; pages for things compared or revisited, load-more for feeds.

## 6. Containers — does the group deserve to be a thing?

| Need | Container | Its one cue |
|---|---|---|
| a region of the page | section, no box | whitespace + a heading |
| a secondary group inside a face | well | a tone step |
| an independent object the user picks or drags | card | a tone step or a diffuse shadow (light) — one |
| a decision that floats | layer | `SHELL.md` |

A container holds **≥3 atoms of the same kind**; one or two values sit open. Delete every container you can.

## 7. Navigation

| Need | Pick |
|---|---|
| app sections, ~5–9 | sidebar (narrow: a bottom bar *or* a drawer — one, fixed) |
| views of one thing, 2–5 | tabs (`SHELL.md` §2) |
| modes or filters of one list | segmented |
| location in depth | breadcrumb; shallow apps: back + title |
| ≥3 ordered dependent steps | stepper (`SHELL.md` §9) |

The current location carries two channels, never color alone.

## 8. Pages

When the output is a page it fills the viewport — `body` never centers a small card. Pick the skeleton from the content:

| Skeleton | Structure | Fits | Content width |
|---|---|---|---|
| **App shell** | a top bar (+ optional sidebar) framing the content | tools, admin | by content |
| **Content flow** | one centered column | reading, editorial | 680–820 |
| **Dashboard** | a responsive grid of metric blocks | data, operations | 1100–1280 |
| **Mobile column** | full-height flow + bottom tab bar | lifestyle, health | `min(440px, 100%)` |

- **Zone by the business.** Regions come from the business map (`SKILL.md` §1): one region per concern, in the order the work happens; what the business treats as one stays in one region, what it keeps apart never shares a container. Region titles and nav labels use the business's words.
- **Segment** with whitespace first, a line second; a page may contain zero cards. Several views live in one page, switched by tabs.
- **A metric block must carry,** in this rank: the lead figure and its change → what it measures → enough context to judge it → a graphic of its shape → the source, faintest. How they arrange is open.
- **One insight line per screen** (≤18 字) states the conclusion and never restates the chart. Figures compared side by side share a baseline. Findings in a list use one prefix form per column and echo comparable values graphically. Sources open from a quiet entry, never sit on the face.

## 9. Records — one thing's fields

The default failure is a two-column `Label  Value` list where every row weighs the same. Rank instead:

1. **Status** — the one fact that changes what the reader does next; only states needing action get a tone.
2. **Identity** — the name as a heading, never `标题：xxx`; not repeated if a persistent header already shows it.
3. **Meta** — values lead, labels are demoted a tier, so the eye scans values and reads labels only on the way back.
4. **Prose** — a real sentence leaves the field grid and gets its own full-width room.

A label is **demoted, not deleted** — deleted labels come back smuggled into values (`电话 138…`). A missing value shows one faint sentence written once by the renderer, never hidden (hidden means nobody knows to fill it).

## 10. Designing a component that isn't here

1. Name the concept in one sentence — its job and its behavior.
2. Find the nearest sibling above: behavior differs → a new component; only the look differs → a variant.
3. Write what it must carry (ranked), ≤3 axes, and which states apply (`SYSTEM.md` §4–§6).
4. **Its form is open:** if this product hasn't decided it, diverge (`SKILL.md` §4) — several forms that differ in kind — recommend one, and encode the pick. Then derive details from roles via `FOUNDATION.md`.
5. Register it: name · what · when · when not.
