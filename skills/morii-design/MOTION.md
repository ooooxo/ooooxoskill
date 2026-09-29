# Morii Motion — polish-layer motion

> **Read** only at workflow step 7 — the static build shipped and motion was requested or approved. Baseline feedback (press, hover, focus, cross-fade, paired overlay enter/exit) is not here; it ships unconditionally (`FOUNDATION.md` §7).
> Motion is the interface's physicality. Everything below is criteria and ranges: pick values from the product's motion personality (§11), the size of the change and how often it is seen — and be able to say why.

## 1. Should it move — three gates

**Frequency** — how often is it seen?

| Per day | Verdict |
|---|---|
| 100+ (shortcuts, command palette, core navigation) | never animate; keyboard-initiated actions are never animated |
| dozens (hover, list switching, frequent toggles) | delete it, or ≤160ms with no displacement |
| occasionally (inside-window, drawer, toast, settings) | standard motion |
| rare / first-run (onboarding, empty state, success) | the delight budget: spring, stagger, one beat longer |

**Purpose** — name one: *feedback* · *spatial continuity* (it returns the way it came) · *state legibility* · *jump prevention* · *explanation* (onboarding only). "It looks nice" isn't one; deleting an animation is often the strongest optimization.

**Function** — data the user is reading or operating on never moves for style.

## 2. Curves and durations

| Job | Curve | | Change | Duration |
|---|---|---|---|---|
| enter / exit | `--ease-out` | | press | `--t-press` (100–160) |
| on-screen A → B, morph | `--ease-in-out` | | tooltip, chip, icon state | `--t-fast` (125–200) |
| hover, color | `--ease-hover` | | dropdown, tab, list change | `--t-med` (150–250) |
| constant (progress, marquee) | `linear` | | inside-window, large block | `--t-slow` (200–320) |
| unsure | `--ease-out` | | drawer, sheet | `--t-sheet` (200–500) |

- **Never `ease-in`** — it starts slow exactly when the user watches hardest. The built-in CSS keywords are too soft; use the token curves.
- **Overshoot is earned:** springs only when the gesture carried momentum (a flung card may settle with 0.1–0.3 bounce; a fading menu that bounces is fake).
- **Asymmetric on purpose:** slow where the *user* decides (hold-to-delete), fast where the *system* responds. Exits run ≈0.6–0.8× the entrance. After the first tooltip in a toolbar opens, the rest open instantly.

## 3. Physicality

- **Never `scale(0)`** — start from `scale(var(--pop))` + `opacity: 0`.
- **Layers grow out of their trigger** (`transform-origin` at the trigger; only a trigger-less layer uses its scope's center).
- **Displacement in percentages** (`translateY(100%)` = its own height) — right at any content size.
- **Geometry frozen on hover**; size changes only when an explicit click swaps content.
- **Imply direction** — mid-frames point at the outcome.

## 4. One change = presentation × timing, as a pair

Declare each transition once — *what changes* (fade · slide · scale-from-origin · wipe · flip) and *timing* (a duration + curve, or one spring) — and both directions share it, mirrored:

| Change | Enter | Exit |
|---|---|---|
| tab / view | fades + `translateX(±8px)` from the side it came from | leaves toward where it is going |
| list ↔ detail | from the right, `--spring-soft` | to the right, `--ease-in-out` |
| inside-window | `--pop` + fade from the trigger, `--t-slow` | the same path reversed, ×0.7 |
| drawer | `translate(100%)` from its edge, `--ease-drawer` | out through **the same edge** |
| popover | scale from the trigger, `--t-fast` | back into the trigger, `--t-press` |
| toast | in through one edge | out through that edge |

Unmount only after the exit finishes. **Replaying** needs transitions disabled and a reflow first, or the second run barely moves:

```js
el.classList.add('reset');   // .reset * { transition:none; animation:none }
el.classList.remove('on'); void el.offsetWidth;
el.classList.remove('reset'); void el.offsetWidth;
el.classList.add('on');
```

## 5. Interruptible — every animation

Any animation can be caught at any frame: reversed, repeated or replaced, it turns toward the new target **from its current on-screen value**, at once.

- Anything with an end state uses a `transition`, a spring, or WAAPI — **never `@keyframes`**, which replays from zero or snaps. `@keyframes` is only for endless loops (spinner, shimmer).
- Start from the *presented* value (WAAPI: `commitStyles()` then `cancel()`); carry the velocity when a gesture reverses.
- **No input locks** — no `isAnimating`, no `pointer-events:none` while playing, no queues.
- Pending unmounts are cancellable — a stale timer or `transitionend` must not delete an element that reopened.
- Entrances without JS: `@starting-style { opacity:0; transform:translateY(var(--shift)) }` + a `transition`.
- Test: at 3–5× slow-mo, reverse at ~50%, then hammer the trigger five times — it must turn back smoothly and settle on the last request.

## 6. Gesture physics — always asked for separately

- **1:1 tracking** from where it was grabbed; `setPointerCapture`; ignore extra touch points once a drag starts.
- **Velocity decides**, not distance: above ~0.11 px/ms is a flick.
- **Project, then snap** — land where it was going to fly, not the nearest anchor to the release point:

```js
const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);          // 0.998 ≈ system scroll feel
const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
```

- **Rubberband at bounds**, never a hard stop. Hand the release velocity to the spring. Two independent springs for X and Y. `touch-action: pan-y` on horizontal gesture areas.

## 7. Choreography — one clock

- **Everything derives from one driver** (open progress, scroll ratio, drag ratio): each output interpolates from it with its own range, which makes it seekable, reversible and interruptible — and gives stagger for free.

```js
const lerp = (v, [i0, i1], [o0, o1]) => o0 + (o1 - o0) * Math.min(1, Math.max(0, (v - i0) / (i1 - i0)));
el.style.opacity = lerp(p, [0, .35], [0, 1]);
badge.style.opacity = lerp(p, [.45, 1], [0, 1]);   // one beat later
```

- **Delays are multiples of `--beat`**; a full entrance declares its total and stays ≤700ms. Every segment converges on a definite final frame.
- **Deterministic:** stagger from the index (`--i`), never `Math.random()`.
- **Stagger** 30–80ms (`--stagger`), total ≤300ms; exits are never staggered; a stagger never blocks interaction.

## 8. Graphic motion

- **Line-draw:** `strokeDasharray = L`, `strokeDashoffset = L * (1 - p)` with `L = path.getTotalLength()`.
- **Bar-grow:** `scaleY()` from the bottom — never animate `height`.
- **Count-up:** the hero figure rolls in over `--t-slow`, `tabular-nums` keeps it steady.
- Chart entrances play once — no loops, no hover or scroll replays. Scrub-focus is interaction, not motion (`CHARTS.md` §7).

## 9. Performance and accessibility

- Animate only `transform` and `opacity`; name properties, never `transition: all`; don't drive children from a parent variable that changes every frame; keep transitional `blur()` under 20px; `will-change` on just before, off after.
- Predetermined motion goes through CSS / WAAPI (smooth while the main thread is busy); dynamic, interruptible motion through springs / WAAPI.
- **Reduced motion is gentler, not none:** keep fades and color changes, drop displacement, scale, springs, parallax — `Token.css` zeroes `--shift` / `--pop` / `--press` / `--beat` globally, so components that use them comply for free. Hover motion lives inside `@media (hover:hover) and (pointer:fine)`. Reduced transparency → solid surfaces.

## 10. Review — look at it

Slow everything 3–5× and step frames: cross-fades that read as two things, curves that hard-stop, a wrong `transform-origin`, properties drifting out of sync only show up slowed. Hold the driver at `.25 / .5 / .75` — mid-frames must hold up too. Gestures are judged on a real device.

## 11. Motion personality — one per product

Read off the content, never picked from a style list, then written down beside the tokens:

| Dial | Resolved by |
|---|---|
| duration baseline | how often it is seen, how far it travels, how much area changes |
| curve | who drives it (system enter/exit, on-screen movement, hover, continuous) |
| bounce | whether a finger gave it momentum — system-started motion never bounces |

Dense data screens go shorter and flatter with no displacement (moving data reads as untrustworthy); screens the user dwells on tolerate softer, longer transitions. One product runs exactly one personality — the same action moves the same way everywhere.
