# Morii System — how components are made, reused and fixed

> **Read** before writing a component, restyling anything shared, or fixing something that looks wrong. `SKILL.md` §1–§3 state the model; this is the working detail.

## 1. What a component is

- **One concept, one behavior contract.** Same job + same behavior = the same component, however it looks (look differences are variants). Different behavior = a different component, even if the two look identical.
- **Three layers, partitioned by the business.** *Kit* components don't know the business — no router, no store, no domain words — so any product can reuse them. *Domain* components know exactly one domain (an order card, a customer face), are named in its words, and are composed from the kit. *Shell and pages* compose domains. Code and the registry split the same way (`kit/`, `domains/<domain>/`, `shell/`), so one domain can be read, changed or removed in one place.
- **Promote on the second caller**, and move *both* callers onto it. A first copy left behind is how duplicates are born.
- **One implementation per concept.** A second popover, table, warning bar or tooltip is a defect even when it looks right: logic that lives in one copy (close on page change, an IME guard on `Esc`) silently goes missing in the other.
- **Merge the shared parts, not the shells.** Two things sharing rows, state and motion but differing in frame share those pieces behind two thin shells. One component with a mode flag grows into a row of switches.
- **A deliberate fork is fine** when the jobs differ — write down the test that separates them ("a panel or a whole page", never "how many rows") and share the contract.

## 2. Tokens — style → roles → component-local

- **Components read roles only** — including the surface treatment (`--surface-line`, `--surface-rest`, `--surface-blur`) and type (`--font-display`, `--weight-*`). Re-tuning the values restyles the product with zero component edits (`STYLE.md`); a role fixed once is fixed everywhere.
- **Register by meaning, even when values match.** Row hover and button hover are two roles, so tuning one never moves the other. When a borrowed meaning dies, give the survivor its own name.
- **Derive states by relationship.** "One step toward the ink" reads as *forward* in both themes; a fixed ramp step flips order between them.
- **Themes live in the role tier only;** components never branch on theme. A custom property that references another resolves *where it is declared*, so a theme block or subtree override must re-declare every derived role it changes; a role used inside a list stays list-safe (`transparent`, not `none`, in `box-shadow`).
- **Add a role** only when no existing role (or a `color-mix()` of one) says it, with its meaning written beside it.

## 3. The registry

One line per component: **name · what · when · when not**. Read it before building; update it when adding. *When-not* is half the value — an animated digit readout suits a total that changes in place, and is wrong for a value following the pointer or for table cells. In a repo it is the kit's README; in a standalone file, the primitives block at the top of the stylesheet.

## 4. Anatomy

- **Root + named slots** (`leading` · `label` · `meta` · `trailing` · `body` · `footer`). The component owns layout, spacing, states, motion and platform differences; the caller passes **data and intent** — what hangs on the row, what a click does. Extra slot content reuses the component's own classes so it can't drift.
- **Fallback chains live inside** — image → initials → glyph — or the same person grows three faces.
- **Opposite directions get two slots**, not one slot plus a toggle.
- **Content width ≠ chrome width.** The caller sizes content; the component adds its padding and closure on top.

## 5. Variant axes

| Axis | Values | Changes |
|---|---|---|
| size | `sm` · `md` · `lg` | height from `--h-*`; everything else derives from it (§7) |
| emphasis | `primary` · `secondary` · `quiet` (· `danger`) | fill vs. wash vs. none |
| tone | `neutral` · `accent` · `ok` · `warn` · `crit` | which tone triplet |
| density | `comfortable` · `compact` | `--sp-*` / `--h-*` steps |

- **An axis value changes tokens, never structure.** A structural difference is a different body or component.
- **Name by intent** (`emphasis="primary"`), never by look (`blue`, `big`, `noBorder`). A boolean zoo is a component with no model.
- **Separate axes, separate locks** — "can't move" and "can't hide" are two properties.
- **Declared, never inferred** — no switching shape or body at a runtime count.
- **In CSS, a variant is a set of custom-property overrides** at the root, so rules and structure exist once. The mechanism is the point — the values below are placeholders for whatever form the product chose:

```css
.btn{--btn-bg:var(--hover);--btn-ink:var(--ink);height:var(--btn-h,var(--h-md));
     background:var(--btn-bg);color:var(--btn-ink);border-radius:var(--r-sm)}
.btn[data-emphasis=primary]{--btn-bg:var(--accent);--btn-ink:var(--on-accent)}
.btn[data-size=sm]{--btn-h:var(--h-sm)}
```

## 6. States

rest · hover · pressed · focus-visible · selected · disabled · loading · invalid — containers add empty and failed. One transform per state, product-wide (`FOUNDATION.md` §7).

- **Drive states from real attributes** — `:hover`, `:focus-visible`, `:disabled`, `[aria-pressed]`, `[aria-selected]`, `[aria-invalid]`, `[aria-busy]` — so the visual and the accessible state can never disagree.
- **Callers set state; the component owns the transition.** No animation code or platform `if` at call sites.
- **The component enforces its contract:** no handler → no button; no remove operation → no delete; an icon-only action without a name fails at build time. A dead button should be impossible, not merely forbidden.

## 7. Derive, don't configure

A value that can be derived is derived — not a constant, not a setting: inner radius = outer − gap; a layer's side follows from where its host sits; a collapsed state has its own measurements, not a scaled copy. Constants drift from their source, and a setting with one right answer lets users pick the wrong one.

**Height is the size.** Type: `sm` label/sub · `md` sub/body · `lg` body. Glyph ≈ 0.5 × height. Radius by box: `sm` `--r-xs` · `md` `--r-sm` · `lg` `--r-md`. Hit area ≥ `--hit` through a pseudo-element, never by inflating the look.

## 8. Families and containers

- **Behavior core + form hooks.** All layers share one core — open/close timing, the stack, `Esc` with an IME guard, focus in and back, scope lock, close on page change; forms plug in *measure/place*, *enter*, *leave* (`SHELL.md` §3).
- **Geometry and physics are shared pure functions**, not wrapper components — two descriptions of one curve drift.
- **A data container is a shell + a body.** The shell owns toolbar, views, filters, the three states, paging and selection; the body is picked by the reading task (compare → grid · one at a time → entries · pick → cards) — declared by the schema, never by a `layout` flag, which produces one type full of "only valid in mode X".
- **Items describe themselves** with independent parameters (how loud, whether timed, what size); one pure function maps data to items, and containers read parameters instead of switching on type — a new kind is new data, not a new branch.
- **Repeating page shapes become configuration** for one engine: columns declare type and look once, bodies only place keys, a new field kind is one kit entry plus one template branch.
- **One per cross-cutting concern:** the action shape (run · confirm · prompt · form), notice bar, empty state, spinner, face, number readout, tooltip, toast host. Global layers mount once outside the page tree and are reached declaratively (`data-tip="…"`) or through a host API.
- **Classify by a stated test, recorded once** — which layer form, which body. **Hard caps are checks:** hitting one (a fourth facet, a seventh chip hue) means re-split the content, not raise the cap.

## 9. Standalone prototypes are systems too

```
Token.css (linked or inline)
→ primitives   .btn .field .chip .row …   one comment line each = the registry
→ components   composed from primitives
→ page         layout and content only
```

Variants as data attributes (`data-size`, `data-emphasis`, `data-tone`), states as real attributes and pseudo-classes, **no inline `style`** except values that come from data (a bar's width). A demo of states renders the real component in each state — never a hand-painted lookalike.
