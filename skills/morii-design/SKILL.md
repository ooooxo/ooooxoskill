---
name: morii-design
description: >
  Morii Design — one visual language (克制 · 层次 · 呼吸感) kept as a reusable component system.
  Use it FIRST for any interface work: a component, a component kit, a page, an app screen, a
  prototype / 设计稿, a restyle, 统一风格, or "这里不好看 / 很丑 / 很土，帮我改" — even when the user
  never says "design system". It teaches how to think, not what to copy: the look lives in a few
  dials → role tokens → components that each own one concept; new needs climb a reuse ladder;
  problems are fixed at the layer that owns them, never patched per instance; undecided forms are
  explored as several genuinely different directions, then converged.
  Triggers: 设计, UI, 界面, 组件, 组件库, 原型, 页面, 前端, 视觉, 样式, 统一, design system, 设计规范.
allowed-tools:
  - Read(~/.claude/skills/morii-design/**)
  - Read(./src/panel/shell/tokens.css)
  - Read(~/.claude/skills/morii-icon/**)
  - Skill(morii-icon)
---

# Morii Design

**Language — 克制 · 层次 · 呼吸感:** the fewest visual atoms, said with graphics, given room to breathe.
**Method — a component system:** a screen is *product dials × components*, composed by its content. Nothing is decorated per screen, so everything stays one product.

## 1. Every decision has one owner

| Layer | Decides | Wrong when | Lives in |
|---|---|---|---|
| **Dials** | the look: one hue, shape, density, depth, pace; surface model; floating material; icon tier; motion personality | the whole product feels off | head of the token file |
| **Roles** | what a value is *for*: surface by elevation, ink by rank, line by job, tone by meaning, space, size, motion | one kind of value is wrong everywhere | the token file |
| **Components** | one concept each: slots, axes, states, behavior | every instance of one kind is wrong | the kit + its registry |
| **Composition** | which components, ranked how, for this content | only this screen is wrong | the page |

One owner per decision means one fix improves every instance and no screen drifts. Unowned decisions get re-made per screen — that is how one product becomes five.

In a repo, the project's token file and registry are the source (Morii `src/panel/shell/tokens.css`; Hrige `src/styles/tokens.css` + `src/components/ui/README.md`). Standalone: copy `Token.css` and build a small kit at the top of the file (`SYSTEM.md` §9). Role names match, so work migrates both ways.

## 2. Fix at the owner — optimize, don't patch

Name the owner of whatever looks wrong, and change it **there**.

- **Patches:** an inline style or one-off class on a shared component · `!important` · `.page-x .card {…}` · a copy "with a small tweak" · a token duplicating a role · a per-instance special case · a doc rule banning one bad output instead of fixing its cause.
- **Litmus:** do the *other* instances improve, or at least stay right? If only this one did, it was a patch — unless the difference truly belongs to this content.
- Many call sites are the reason to fix the owner, not an excuse to skip it.

This skill is its own example: its docs once carried one concrete surface recipe (a box with a lit top edge and a tight shadow), so every surface came out as that box. The fix was deleting the recipe and deriving surfaces from elevation roles (`FOUNDATION.md` §3) — not adding a ban on boxes.

## 3. Reuse before writing

Climb the ladder, stop at the first rung that works: **use as-is → an existing variant or slot → generalize the existing one (same concept only) → compose existing ones → write a new one and register it.**

Same concept = same job + same behavior; look differences are variants. Promote into the kit on the second caller, and only business-agnostic things. Never copy-and-modify — near-copies drift within a week. Details: `SYSTEM.md`.

**Reuse governs implementation, not imagination:** one implementation per concept inside a product, while the concept's *form* stays open until it is decided — and reopens whenever the user asks for a new look.

## 4. Diverge, then converge

- **Diverge only where nothing is decided:** a new product's dials, or a component class the product never had. Make 3–6 directions that **differ in kind** — surface model, anatomy, where it comes from, what carries the emphasis — not tweaks of one idea. One compare page, real content, both themes; **lead with a recommendation**.
- **Converge once picked:** encode it into dials, roles or the component, so every future instance *is* the pick. Instances never diverge on their own.
- An existing class in an existing product → reuse by default. When the user reopens it (「换个样子」「不好看」), diverge again and change the component itself — never one instance, which would only be inconsistency.

## 5. The language

- **Details compound.** Invisible correctness adds up to "it feels right"; "nobody will notice" is never a reason.
- **Every number is a role or derived from one.** If you can't say why this value, it isn't one yet.
- **Consistent = predictable.** The same action looks, sits and moves the same everywhere.
- **Derive from the content** — its size, density, frequency, whether it floats — never from a named style.
- **Minimal ≠ least.** Delete noise, never information.

The logics, derived in `FOUNDATION.md`:

1. **Color** — ≥90% neutral; chroma zero or full; only state, identity or the one accent; never color alone.
2. **Hierarchy** — rank, don't align; one lead per unit; spend the cheapest channel first; two weights.
3. **Space** — whitespace is the first separator; gaps inside a group are smaller than between groups.
4. **Separation** — one cue per boundary; shadow only for what floats.
5. **Elevation is a role** — sheet · resting · raised · floating · modal.
6. **Shape follows size** — nested radii derive; pills only for chips.
7. **Never `#000` on `#fff`** — neutrals carry the premium feel.
8. **Graphics first** — data text as atoms: a chip per parameter, never a `·` chain.
9. **Actions have homes** — sorted by nature; one primary per screen; feedback where the action happened.

## 6. Workflow

1. **Frame** — what is the output (a component, a kit, a page), where does it live (a repo with tokens and a registry, or standalone), what is already decided?
2. **Inventory** — load the tokens and the registry; run the reuse ladder for every piece. → `SYSTEM.md`
3. **Decide the undecided** — dials for a new product, forms for new component classes: diverge, recommend, converge. → `FOUNDATION.md`, `COMPONENTS.md`
4. **Build bottom-up** — roles → components (slots, axes, states, baseline feedback) → composition. By need: `COMPONENTS.md` (pages, records, collections) · `SHELL.md` (frame, overlays, toast, confirmation) · `STATES.md` (async, empty, failure, grey text) · `CHARTS.md` (any graphic).
5. **Icons** — anything newly drawn → `Skill(morii-icon)`; existing glyphs are reused.
6. **Look** — render real content in its real host, both themes; walk the checklist; ship the static build.
7. **Motion** — only when requested or approved. → `MOTION.md`

**Baseline feedback is never gated** — press, hover + focus ring, three-state cross-fade, overlays with paired enter/exit (`FOUNDATION.md` §7). **Polish motion waits** until the design settles, since motion written earlier is thrown away with the first change: if the request named motion, go to step 7; otherwise ship static and end with one concrete question listing the spots worth animating. Gesture physics is always asked separately. The static build is a finished state.

## 7. Checklist

- [ ] Every value is a role or derived; nothing restyles a shared component per instance; fixes landed on the owner
- [ ] No near-duplicate components; anything new is registered with when / when-not
- [ ] Components have slots, ≤3 intent-named axes, and states from the one matrix, driven by real attributes
- [ ] Undecided forms were diverged with a recommendation, and the pick is encoded
- [ ] Output fits the task: a page fills the viewport (`COMPONENTS.md` §8); a component is shown in its real host
- [ ] Color, hierarchy, separation and shape follow the logics; contrast checked in both themes
- [ ] Data text as chips; explanatory grey text folded into ⓘ unless it is a consequence, a format or a status
- [ ] One primary per screen; actions in their homes; hit area ≥ `--hit`; no dead buttons
- [ ] Loading / empty / content / failed are designed; the shell paints before the fetch; failures speak human
- [ ] ≥1 graphic per block; charts are one SVG with a visible-failure guard
- [ ] Baseline feedback present; anything moving uses one of four curves, <300ms, `transform`/`opacity`, interruptible
- [ ] **Rendered and looked at** — real size, both themes, mid-frames. A `%` in a path or a missing `fill` passes every syntax check; only eyes catch it

## 8. Files

`Token.css` dials and role values · `SYSTEM.md` how components are made, reused and fixed · `FOUNDATION.md` visual logics · `COMPONENTS.md` which component for which need, pages and records · `SHELL.md` app frame, overlays, toast, confirmation · `STATES.md` loading, empty, failure, explanation · `CHARTS.md` graphics · `MOTION.md` polish motion (step 7 only) · `morii-icon` how icons are drawn.

Local variables allowed besides `Token.css`: `--i` (stagger index), `--bar` / `--rail` (chosen once per product), and a component's own prefixed variables declared at its root (`--btn-bg`, `SYSTEM.md` §5). Rules are written in English; Chinese stays for the core vocabulary, Chinese UI examples, and 字-count thresholds, which are calibrated in characters.
