---
name: morii-design
description: >
  Morii Design — a way to build interfaces as a reusable component system with a unified but
  explorable style (克制 · 层次 · 呼吸感). Use it FIRST for any interface work: a component, a component
  kit, a page, an app screen, a prototype / 设计稿, a restyle, 统一风格, or "这里不好看 / 很丑 / 很土，
  帮我改" — even when the user never says "design system". It teaches how to think, not what to copy:
  the business decides how screens are partitioned; the look is one refined language tuned per
  product through role tokens, and divergence explores forms — never costume themes; new needs
  climb a reuse ladder; problems are fixed at the layer that owns them, never patched per instance.
  Triggers: 设计, UI, 界面, 组件, 组件库, 原型, 页面, 前端, 视觉, 样式, 风格, 统一, design system, 设计规范.
allowed-tools:
  - Read(~/.claude/skills/morii-design/**)
  - Read(./src/panel/shell/tokens.css)
  - Read(~/.claude/skills/morii-icon/**)
  - Skill(morii-icon)
---

# Morii Design

**The method — a component system:** a screen is *business map × tuning × components*, composed by its content. Nothing is decorated per screen.
**克制 · 层次 · 呼吸感** is how the method reads in any product: every element and every color earns its place, everything is ranked, space is structure.

## 1. Every decision has one owner

| Layer | Decides | Wrong when | Lives in |
|---|---|---|---|
| **Business map** | domains, core objects, tasks, roles → navigation, screens, regions, domain components | related things are split, unrelated things share a box, navigation mirrors UI types instead of the business | the product's domain doc / context |
| **Tuning** | the product's dials within the language's range (`STYLE.md`) | the whole product feels off | the head of the token file |
| **Roles** | what each value is *for*: surface by elevation, ink by rank, line by job, tone by meaning, space, size, motion | one kind of value is wrong everywhere | the token file |
| **Components** | one concept each: slots, axes, states, behavior — kit (business-agnostic) or domain | every instance of one kind is wrong | the kit / domain folders + registry |
| **Composition** | which components, ranked how, for this content | only this screen is wrong | the page |

One owner per decision: one fix improves every instance and nothing drifts. Unowned decisions get re-made per screen — that is how one product becomes five.

**Partition by the business.** Navigation follows domains, screens follow objects and tasks, regions follow concerns: what the business treats as one (an order and its lines) stays together; what it keeps apart (billing, fulfillment) never shares a container. Name regions and components in the business's words. A section called "Charts" or "Lists" is a sign the UI was partitioned by widget, not by business.

In a repo, the project's domain doc, token file and registry are the sources (Morii `src/panel/shell/tokens.css`; Hrige `src/styles/tokens.css` + `src/components/ui/README.md`). Standalone: build a small kit at the top of the file (`SYSTEM.md` §9).

## 2. Fix at the owner — optimize, don't patch

Name the owner of whatever looks wrong, and change it **there**.

- **Patches:** an inline style or one-off class on a shared component · `!important` · `.page-x .card {…}` · a copy "with a small tweak" · a token duplicating a role · a per-instance special case · a doc rule banning one bad output instead of fixing its cause.
- **Litmus:** do the *other* instances improve, or at least stay right? If only this one did, it was a patch — unless the difference truly belongs to this content.

This skill is its own example: its docs once carried one concrete surface recipe (a box with a lit top edge and a tight shadow), so everything came out as that box. The fix was deriving surfaces from elevation roles that components read through tokens — not adding a ban on boxes.

## 3. Reuse before writing

Climb the ladder, stop at the first rung that works: **use as-is → an existing variant or slot → generalize the existing one (same concept only) → compose existing ones → write a new one and register it.** Same concept = same job + same behavior; look differences are variants. Never copy-and-modify — near-copies drift within a week. Details: `SYSTEM.md`.

**Reuse governs implementation, not imagination:** one implementation per concept, while its form stays open until decided — and reopens whenever the user asks for a new look.

## 4. Diverge, then converge

- **Diverge where nothing is decided — in form, not skin.** 3–4 directions that differ in kind: what leads, the structure, where things come from, the material within the language's range, the density (`STYLE.md` §3). Same language, same dials. Recommend one.
- **Diverge small, converge big.** Explore on one key screen or component, then build the full thing in the pick — the other directions stay one switch away.
- **Converge once picked:** encode it into the token file or the component, so every future instance *is* the pick.
- **Reopen at the owner:** "不好看 / 换个样子" about the whole product → re-tune the dials; about one kind of thing → diverge that component's form. Never one instance.

## 5. Invariants — true in every product (derived in `FOUNDATION.md`)

1. **Hierarchy** — rank, don't align; one lead per unit; spend the cheapest channel first.
2. **Grouping** — proximity first: gaps inside a group are smaller than between groups.
3. **Separation by role** — every boundary of the same role gets the same cues the tuning defines; no ad-hoc cues.
4. **Every color has a job** — brand, category, state, emphasis — in one harmonized palette; 克制 is not neutral; meaning never by color alone; contrast holds.
5. **Shape derives** — radius follows the box; nested radii derive.
6. **Data text as atoms** — one chip per parameter, never a `·` chain; errors in human words.
7. **Actions have homes** — sorted by nature; one primary per screen; feedback where the action happened.
8. **Every number is a role or derived** — "nobody will notice" is never a reason; details compound.
9. **Minimal ≠ least** — delete noise, never information.

## 6. Workflow

1. **Frame** — the output (component, kit, page), where it lives, what is decided. **Map the business**: domains, objects, tasks → navigation, screens, regions.
2. **Inventory** — tokens, registry, domain components; run the reuse ladder per piece. → `SYSTEM.md`
3. **Decide the undecided** — tune the dials if the product has none (`STYLE.md`), then diverge the forms nobody has decided (`COMPONENTS.md`): small, recommend, converge.
4. **Build bottom-up** — roles → kit → domain components → composition, with baseline feedback. By need: `COMPONENTS.md` · `SHELL.md` (frame, overlays) · `STATES.md` (async, empty, failure) · `CHARTS.md` (graphics).
5. **Icons** — anything newly drawn → `Skill(morii-icon)`.
6. **Look** — render real content in its real host, both themes; walk the checklist; ship static.
7. **Motion** — only when requested or approved. → `MOTION.md`

**Baseline feedback is never gated** — press, hover + focus ring, three-state cross-fade, paired overlay enter/exit (`FOUNDATION.md` §7). **Polish motion waits** for the design to settle: if the request named motion, go to step 7; otherwise ship static and end with one concrete question listing the spots worth animating. Gesture physics is always asked separately.

## 7. Checklist

- [ ] Navigation, screens and regions follow the business map; names are the business's words
- [ ] Undecided designs → 3–4 form directions that differ in kind, same language and dials, with a recommendation — never theme costumes
- [ ] Components read roles only — re-tuning changes no component CSS; nothing restyles a shared component per instance
- [ ] No near-duplicate components; kit vs. domain layers respected; anything new is registered with when / when-not
- [ ] Components have slots, ≤3 intent-named axes, states from the one matrix via real attributes
- [ ] Hierarchy, grouping, separation, color meaning and shape follow the invariants; contrast checked in both themes
- [ ] Data text as chips; explanatory grey text folded into ⓘ unless it is a consequence, a format or a status
- [ ] One primary per screen; actions in their homes; hit area ≥ `--hit`; no dead buttons
- [ ] Loading / empty / content / failed designed; the shell paints before the fetch; failures speak human
- [ ] Baseline feedback present; anything moving uses one of four curves, <300ms, `transform`/`opacity`, interruptible
- [ ] **Rendered and looked at** — real size, both themes. A `%` in a path or a missing `fill` passes every syntax check; only eyes catch it

## 8. Files

`STYLE.md` the language's range, dials, form divergence · `Token.css` Morii's tuning as role values · `SYSTEM.md` how components are made, layered, reused and fixed · `FOUNDATION.md` invariant visual logic · `COMPONENTS.md` which component for which need, pages, records · `SHELL.md` app frame, overlays, toast, confirmation · `STATES.md` loading, empty, failure, explanation · `CHARTS.md` graphics · `MOTION.md` polish motion (step 7) · `morii-icon` how icons are drawn.

Local variables allowed besides the token file: `--i` (stagger index), `--bar` / `--rail`, and a component's own prefixed variables declared at its root (`SYSTEM.md` §5). Rules are in English; Chinese stays for the core vocabulary, Chinese UI examples, and 字-count thresholds.
