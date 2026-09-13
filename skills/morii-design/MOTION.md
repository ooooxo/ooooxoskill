# Morii Motion — the motion charter

**Motion is not a decoration layer, it is the interface's physicality.** Whether an interface feels expensive or cheap is decided half by its whitespace and half by how it responds to your finger.

**When to read this: workflow stage ④ — the static build has shipped and motion is authorized.** This file owns the **polish layer** (entrance choreography · gesture physics · chart polish · timeline choreography · delight budget).
**Baseline feedback is not here** — `:active` press, hover / `:focus-visible`, three-state cross-fade, paired overlay enter/exit. Those four are baseline usability, delivered in the static build; their rules are in `FOUNDATION.md` §7, which carries a sufficient subset of curves and durations on its own.

**How to read this: what follows is criteria and ranges, not finished parts to copy wholesale.** Every code block is a **construction demo** — it shows what drives the effect and which quantities are tunable. Pick the actual values from the motion personality (§13), the container size, and how often it appears; you only have to be able to say *why this value* (`SKILL.md` §B: "every number must be defensible"). Copying one set of parameters into every situation produces exactly the "everything looks the same" this file exists to prevent.

Three core rules (**supreme law** — they win over every detail below):

1. **Whether it should move comes before how it moves** (§1). The more often it is seen, the more it deserves deleting. Deleting an animation is often the strongest optimization.
2. **Motion is driven by one progress value, not fired by an event** (§8) — `state → progress → every output`. Motion that can seek, reverse, and be interrupted is alive; a `play()` that runs to the end is a recording.
3. **Enter and exit are a pair on a symmetric path** (§5). Writing half a change (entrance without exit; in from the right, out through the bottom) is half-finished work.
4. **Every animation is interruptible** (§6). New input mid-flight retargets from where the element *is*, immediately — never waits for the end, never jumps, never queues. An animation that locks input while it plays is a bug, however short.

---

## 1. Should it move: the frequency gate + the purpose gate

**Frequency gate** (first, non-negotiable):

| Times the user sees it per day | Verdict |
|---|---|
| 100+ (keyboard shortcuts, command palette, core navigation) | **Never animate.** Zero. |
| Dozens (hover, list switching, frequently used toggles) | Delete it, or press it down to nearly imperceptible (≤160ms, no displacement) |
| Occasionally (inside-window, drawer, toast, settings) | Standard motion |
| Rare / first-run (onboarding, empty state, success, celebration) | The "delight budget" is allowed — spring, stagger, one beat longer |

**Keyboard-initiated actions are never animated.** This is a hard rule, not a judgment call: repeated hundreds of times a day, the animation only makes it feel sluggish and disconnected from the finger. Raycast opens and closes with no animation, and that is correct.

**Purpose gate** (second): you must be able to name *why it moves* with one of these five words —

- **Feedback** — confirm the interface heard you (press scale, hold-to-confirm fill)
- **Spatial continuity** — it returns the way it came (a toast exits through the edge it entered; a panel grows out of its trigger)
- **State legibility** — make the state change visible (a button morphing, an accordion expanding)
- **Jump prevention** — content appearing or vanishing out of nowhere reads as broken
- **Explanation** — demonstrate how a feature works (onboarding / marketing only)

If you cannot name one of the five → do not animate. "It looks nice" is not on the list.

**Function gate** (third): data the user is currently **reading** or **operating on** does not move for style. A decorative cursor-follow effect is fine on a landing page; on a report's figures it is interference.

## 2. Curves: only four choices

```
enter / exit ................ --ease-out      (fast off the mark = responsiveness)
on-screen A→B move / morph .. --ease-in-out
hover / color change ........ --ease-hover
constant (progress, marquee)  linear
unsure ...................... --ease-out
```

**Interface motion never uses `ease-in`.** It starts slow, precisely at the moment the user is watching hardest — `ease-in` at 200ms *feels* longer than `ease-out` at 200ms.

**The built-in CSS easings are too soft** (the `ease` / `ease-out` keywords). Replace all of them with the strong curves in `Token.css`:

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* drawer / bottom sheet */
```

**Overshoot is a privilege, not a default.** Default to critical damping (no overshoot); spring only when the **gesture itself carries momentum** — a flung card settling may bounce, a fading-in menu bouncing is fake. When it does bounce, bounce a little: 0.1–0.3 (`--spring-soft` / `--spring`).

## 3. Duration: interface motion always under 300ms

| Element | Duration | Token |
|---|---|---|
| Press feedback | 100–160ms | `--t-press` |
| Tooltip / small overlay / icon state | 125–200ms | `--t-fast` |
| Dropdown / tab switch / list enter-exit | 150–250ms | `--t-med` |
| Inside-window / popover / large block | 200–320ms | `--t-slow` |
| Drawer / bottom sheet | 200–500ms | `--t-sheet` |
| Onboarding / demo animation | may run longer | — |

**Perceived performance:** a 180ms dropdown is "faster" than a 400ms one; a spinner that turns quickly makes the same wait feel shorter; every tooltip after the first one in a toolbar opens **instantly** (skip the delay, skip the animation) and the whole toolbar feels fast.

**Enter and exit are asymmetric:** slow through the segment where the *user* is deciding (hold-to-delete, 2s linear), fast through the segment where the *system* is responding (200ms `--ease-out` on release). Press and release at the same speed is the anti-pattern.

## 4. Physicality: appear like a real object

- **Never `scale(0)`.** Nothing in reality emerges from nothing. Start at `scale(0.94–0.97)` + `opacity: 0` (`--pop`).
- **Overlays grow out of their trigger.** `transform-origin` aligns to the trigger, not center. **The only exception is a trigger-less layer** (a global hard stop, `SHELL.md` §5): with no button to grow from, the center of its scope is correct.
- **Press feedback.** Every pressable element gets `:active { transform: scale(var(--press)) }` + `transition: transform var(--t-press) var(--ease-out)`. **Fire on `pointerdown`, do not wait for `click`.** The moment a delay appears, the sense of direct manipulation collapses.
- **Use percentages for displacement, not hard-coded px.** `translateY(100%)` means the element's own height, correct at any content height (this is what Sonner and Vaul do).
- **Geometry frozen:** hover changes only `background/opacity/box-shadow/fill`, never size or position. Height changes are allowed only when an explicit click swaps the content.
- **Imply direction:** mid-frames should point at the outcome — the panel grows *toward* the finger rather than blindly interpolating to its end state.

```css
.pop-in {
  transform: scale(var(--pop)) translateY(var(--shift));
  opacity: 0;
  transition: transform var(--t-med) var(--ease-out), opacity var(--t-med) var(--ease-out);
}
.pop-in[data-open] { transform: none; opacity: 1; }
```

## 5. One change = presentation × timing (enter and exit as a pair)

Split "**what changes**" from "**how long / which curve**" — this is Remotion's `<TransitionSeries>` model, and it holds just as well in UI:

- **Presentation:** fade · slide(direction) · scale-from-origin · wipe (`clip-path`) · flip · none
- **Timing:** a duration plus a curve, or one spring

**Declare a transition once; both sides share the same presentation**, mirrored in direction:

| Change | Enter | Exit |
|---|---|---|
| Tab / view switch | new view fades + `translateX(±8px)` from the side it came from | old view fades + leaves toward where it is going |
| List ↔ detail | detail enters from the right, `--spring-soft` | detail exits to the right, `--ease-in-out`; the back control lands where reading stopped |
| Inside-window | scale `--pop` + fade from the trigger origin (scope center if trigger-less), `--t-slow` | same path reversed, duration ×0.7 |
| Drawer | `translateX/Y(100%)` from one edge, `--ease-drawer`, `--t-sheet` | back out through **that same edge**, duration ×0.7 |
| Popover | scale from the trigger origin, `--t-fast` | shrink back to the same origin, `--t-press` |
| Toast | in through one edge | **out through that same edge** (otherwise the swipe-away gesture loses its intuition) |

**The exit animation must finish before the DOM unmounts** (`transitionend` or a timed removal) — calling `remove()` directly means the exit was never written. **Drive it by toggling a class; never toggle `hidden` on an element that carries `display`** (it locks the open state).

**Replay / reset must disable transitions and force a reflow first**, otherwise the second trigger looks like nothing happened — removing the state class itself starts a **reverse transition**, and adding it back a frame later merely reroutes from the current value, so the element barely moves:

```js
sec.classList.add('reset');    // .reset * { transition:none; animation:none }
sec.classList.remove('on');
void sec.offsetWidth;          // reflow: the start state lands instantly, no animation
sec.classList.remove('reset');
void sec.offsetWidth;
sec.classList.add('on');       // this is the real start
```

Exits are generally **0.6–0.8× the entrance**: the user has already decided they want it gone.

## 6. Interruptible: every animation, no exceptions

> "Thought and gesture happen in parallel."

**Hard rule: any animation can be caught at any frame.** The user reverses, repeats, or starts something else mid-flight → the motion turns toward the new target **from its current on-screen value, at once**. The 300ms ceiling (§3) is no excuse for a lock — users act faster than that all the time.

- **Anything with an end state uses a transition, a spring, or WAAPI — never `@keyframes`.** A transition reroutes mid-flight; keyframes replay from zero, or snap when their class is removed. `@keyframes` is left only for endless loops that have no end state (spinner, shimmer).
- **Always start from the current *presented* value, never from the target.** On interruption, read the element's **actual on-screen** transform before starting the new animation, or you will see a jump. With WAAPI: `commitStyles()` then `cancel()` before starting the next one.
- **Catch the velocity when a gesture reverses**; a hard cut feels like hitting a wall.
- **No input locks.** No `isAnimating` flag, no `pointer-events:none` or `disabled` for the duration, no "ignore input until `transitionend`", no queue of pending animations. Input during motion is honored and retargets.
- **Pending unmounts are cancellable.** An exit waiting to remove the element must be cancelled when it reopens mid-exit — a leftover timer, or a stale `transitionend` listener that fires on the *next* finished transition, deletes an element that is visible again.
- **Test it:** at 3–5× slow-mo (§12), trigger the opposite state at ~50%, then hammer the trigger 5× fast. It must turn back smoothly from the mid-frame and settle on the last requested state.
- Entrances use `@starting-style` (no JS needed):

```css
.toast {
  opacity: 1; transform: translateY(0);
  transition: opacity var(--t-slow) var(--ez), transform var(--t-slow) var(--ez);
  @starting-style { opacity: 0; transform: translateY(100%); }
}
```

  Older browsers fall back to `useEffect(() => setMounted(true), [])` + `data-mounted`.

## 7. Gesture physics (drag / swipe / drawer)

- **1:1 tracking:** follow from wherever it was grabbed; do not snap to the element's center. `setPointerCapture` keeps tracking when the pointer leaves the bounds.
- **Multi-touch guard:** ignore new touch points once a drag has started (`if (isDragging) return`), or switching fingers teleports the element.
- **Velocity decides the outcome, not distance:** `velocity = |Δd| / Δms`; above `0.11` counts as a flick and dismisses immediately — no need to drag past a threshold.
- **Momentum projection:** do not snap from the release point to the nearest anchor; first compute *where it was going to fly*, then snap:

```js
// decelerationRate 0.998 ≈ system scroll feel; 0.99 is crisper
const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);
const target = nearestSnap(current + project(releaseVelocity));
```

- **Rubberband at the boundary, never a hard stop:** the further you drag, the less it follows. Real objects decelerate before stopping.

```js
const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
```

- **Hand off the velocity:** feed the release velocity in as the spring's initial velocity, so there is no seam between dragging and animating.
- **Split 2D into two independent springs** (X / Y); one spring driving a 2D distance falls apart when the axes have different velocities.
- Keep vertical scrolling alive: horizontal gesture areas get `touch-action: pan-y`.

## 8. Timeline choreography: one clock, one progress value

**Remotion's core mental model** — all motion is a pure function of the current frame, not a chain of side effects. Ported to UI:

**① Everything derives from one driver.** One progress variable (open/close progress, scroll ratio, drag ratio, playback frame) → every visual output is interpolated from it. That makes it inherently seekable, reversible, and interruptible.

```js
// interpolate(driver, input range, output range) — always clamp both ends
const lerp = (v, [i0, i1], [o0, o1]) => {
  const t = Math.min(1, Math.max(0, (v - i0) / (i1 - i0)));   // clamping is mandatory
  return o0 + (o1 - o0) * t;
};
// One driver, several outputs, each with its own range = stagger for free
el.style.opacity   = lerp(p, [0.00, 0.35], [0, 1]);
el.style.transform = `translateY(${lerp(p, [0.00, 0.60], [12, 0])}px)`;
badge.style.opacity = lerp(p, [0.45, 1.00], [0, 1]);   // arrives one beat later
```

**② One timeline, delays as integer multiples of a beat.** Every delay in a piece of choreography is written `calc(var(--beat) * n)`; scattered hand-written milliseconds are banned. A full entrance must have a **declared total duration** and it must be ≤700ms.

**③ There must be a convergence point.** Every motion segment has a definite final frame — springs included need a measurable settle time, or the next beat cannot be scheduled. On the CSS side use finite approximations like `--spring-soft`, not infinite oscillation.

**④ Determinism.** `Math.random()` is banned in choreography: derive stagger from `index` (`--i`), and if you need "randomness," use a seeded function. The same input must produce the same animation, or the review pass (§12) is meaningless.

**⑤ Stagger:** step 30–80ms (`--stagger`), total capped at 300ms (past 6 items, group them or cut). Stagger is decoration — **it must never block interaction while playing.**

```css
.row { transition: opacity var(--t-med) var(--ez), transform var(--t-med) var(--ez);
       transition-delay: calc(var(--stagger) * var(--i));
       @starting-style { opacity: 0; transform: translateY(var(--shift)); } }
.row.out { opacity: 0; transition-delay: 0s; }   /* exit is never staggered */
```

(`--i` is written onto the style at render time. `@starting-style` + transition, not `@keyframes`: dismiss the list mid-stagger and every row turns back from wherever it is (§6).)

## 9. Graphic motion: SVG / charts

- **line-draw (self-drawing path)** — get the length via `getTotalLength()`, drive it with one progress value:

```js
const L = path.getTotalLength();
path.style.strokeDasharray  = `${L} ${L}`;
path.style.strokeDashoffset = L * (1 - p);   // p: 0→1 draws it; p>1 retracts from the start
```

- **bar-grow:** `transform: scaleY()` + `transform-origin: bottom` (do not animate `height` — that is a layout property).
- **count-up:** the hero figure rolls into place over `--t-slow`; `tabular-nums` keeps it from jittering.
- **Entrances play once:** chart motion never loops, never triggers on hover, never replays on scroll.

> **Scrub-focus is not in this file.** Tap-first chart interaction (4+ bars, whole-column hit area, press-and-sweep focus, linked readout) is an **interaction capability, not motion polish** — a chart that ignores tap is dead, gated or not. It ships in the static build; its rules live in `CHARTS.md` §7. Only the ≤180ms transition *between* focus states is motion, and it follows §3.

## 10. Performance: animate only transform and opacity

- Only `transform` / `opacity` skip layout+paint and run on the GPU. Animating `width/height/margin/padding/top/left` means a reflow every frame.
- **`transition: all` is banned** — it drags in properties you never meant to animate and usually falls off the GPU path. Always name the property.
- **Do not drive a child's transform from a parent CSS variable:** changing one parent variable makes every descendant recompute style. Write the child's own `transform`.
- **CSS/WAAPI animations stay smooth while the main thread is busy**; rAF-driven ones drop frames. Predetermined motion goes through CSS; dynamic interruptible motion goes through springs / WAAPI:

```js
el.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77,0,0.175,1)' });
```

- Keep transitional `filter: blur()` under 20px (expensive, especially in Safari).
- `will-change` goes on just before the motion happens and comes off after.

## 11. Accessibility

- **reduced-motion ≠ no motion**, it means "less and gentler": keep the fades and color changes that aid comprehension; drop displacement, scaling, springs, and parallax. `Token.css` already degrades `--shift/--pop/--press/--beat` globally, so any component using those variables complies automatically.
- **Hover motion must be gated:** `@media (hover: hover) and (pointer: fine)` — a tap on a touchscreen falsely triggers hover.
- `prefers-reduced-transparency` → frosted surfaces fall back to solid (`--glass-blur: 0`); `prefers-contrast: more` → near-solid grounds + explicit outlines.
- Large moving objects stay semi-transparent while in motion; avoid full-screen moving backgrounds, avoid slow loops near 0.2Hz, and transition between light and dark rather than jumping.

## 12. Review: you have to actually look

- **Slow it down:** temporarily multiply durations by 3–5×, or play it back slowed in the DevTools Animations panel. Only slowed down can you see whether a cross-fade is "two things stacked," whether the easing hard-stops at the end, whether `transform-origin` is wrong, whether several properties have drifted out of sync.
- **Step frame by frame:** use DevTools to check timing drift between properties that are supposed to move together.
- **Blur an ugly cross-fade:** add `filter: blur(2px)` during the transition to smear two states into "one thing deforming" rather than "two things swapping places."
- **Test gestures on a real device** (drawer, swipe). A simulator does not count.
- **Look again the next day.** Flaws invisible today all jump out after a night's sleep.

**"Looking" is a hard requirement, not a suggestion.** Before shipping any page with motion or graphics, you **must render it and look at it with your eyes** — open it locally and screenshot, use `ego-browser`, or a headless browser. This step cannot be substituted with "the code looks right." Measured in practice: percentage coordinates in a `path` made an entire line chart silently vanish; a missing `fill` turned half the icons pure black; a morph degenerated mid-frame into the wrong glyph — **all three passed syntax checks and all three only surfaced after rendering.**
After the static frames, **step the frames**: hold the driver at `.25 / .5 / .75` — the mid-frames must hold up too.

## 13. Motion personality — one per product, derived not chosen

Motion has to be in tune with what the product is: a dense operations screen that springs reads as frivolous; a slow reading surface with cold straight lines reads as indifferent. That tune is **read off the content and the interaction**, never picked from a list of styles.

Three dials, each resolved by a property you already know:

| Dial | Resolved by | Reading |
|---|---|---|
| **Duration baseline** | how often it is seen (§1) + how far it travels + how much area changes | seen constantly, moves little → the bottom of the ladder (`--t-press`–`--t-fast`); a large surface crossing the screen → the top (`--t-slow`–`--t-sheet`) |
| **Curve** | who is driving | system-initiated enter/exit → `--ease-out` · movement fully on screen → `--ease-in-out` · hover / color → `--ease-hover` · anything continuous → `linear`. **Never `ease-in`** |
| **Bounce** | whether the gesture carried momentum (§2) | flung or dragged by a finger → it may settle with 0.1–0.3 · started by the system alone → none |

Two content properties then bias the whole set, and both are measurable rather than stylistic:

- **Information density.** Dense figures, tables, and monitoring surfaces go shorter and flatter, with no displacement — data that appears to move for decoration reads as data you cannot trust.
- **Dwell time.** A screen the user sits and reads tolerates longer, softer transitions; a screen crossed hundreds of times a day does not.

**One product runs exactly one motion personality.** Once the three dials are set, the same action looks the same and moves the same everywhere. Write them down next to the tokens — a personality that lives only in your head lasts exactly until the next screen.

## 14. Anti-pattern lookup (fix on sight)

| Written like this | Change it to | Why |
|---|---|---|
| `transition: all 300ms` | `transition: transform var(--t-med) var(--ez)` | `all` animates properties you did not intend and falls off the GPU path |
| `transform: scale(0)` on entrance | `scale(var(--pop))` + `opacity: 0` | nothing in reality emerges from nothing |
| `ease-in` on a dropdown | `--ease-out` | `ease-in` starts slow, exactly when the user is watching hardest |
| Button with no `:active` | `scale(var(--press))`, `--t-press` | feedback fires on press, not on click |
| Popover with `transform-origin: center` | align to the trigger (only a trigger-less scope layer is excepted) | overlays grow out of their trigger |
| Animated command palette / shortcut open-close | delete it | hundreds of times a day; the animation only reads as slow |
| Toast built with `@keyframes` | use a `transition` | keyframes replay from zero when interrupted |
| Entrance `@keyframes` on anything with an end state | `@starting-style` + `transition` | keyframes cannot be caught mid-flight; only endless loops keep them |
| `isAnimating` flag / `pointer-events:none` while it plays | delete the lock, let new input retarget | a lock turns every animation into a wait |
| `setTimeout(remove, 200)` with no cancel on reopen | cancel the pending removal when it reopens | the timer fires and deletes a visible element |
| Enter 300ms / exit 300ms | exit ≈ enter ×0.7 | the user already decided to dismiss it |
| A whole group appearing at once | `--stagger` 30–80ms | popping in together reads as stiff |
| Only the opening animation written | exit mirrors the path + unmount after it finishes | half written = half finished |
| `delay: 120ms, 370ms, 500ms` | `calc(var(--beat) * n)` | a timeline needs a beat, not scattered magic numbers |
| Bare hover motion | wrap in `@media (hover:hover) and (pointer:fine)` | a tap on touch falsely triggers hover |
| Expanding by animating `height` | `transform: scaleY()` / a `grid-template-rows` transition | animating layout properties reflows every frame |

---

References: `Token.css` (motion token source of truth) · `SKILL.md` stage ④ (the two gates and the authorization rule) · `FOUNDATION.md` §7 (baseline feedback, not gated) · `~/.claude/skills/morii-icon/MOTION.md` (icon-level motion).
