# Morii Shell — app frame · view switching · overlays · feedback

> **When to read:** the page has a persistent frame (top bar / sidebar), more than one view, any overlay, or any transient feedback. In practice that is most pages.
> `LAYOUT.md` owns **static structure** (which skeleton, how blocks are segmented, what a container atom looks like). This file owns **behavior** — what is sticky, what scrolls, what opens, what closes it, and where focus goes.
> Code here is a **construction demo**: it shows the mechanism and which quantities are tunable. Every value comes from `Token.css` — **no raw hex, no invented variable names.**

---

## 1. App shell behavior

The skeleton is picked in `LAYOUT.md` §1. This section is how it behaves once it exists.

**Scroll containment — decide this before writing any CSS.** Two valid models, never mixed:

| Model | Who scrolls | Use when |
|---|---|---|
| **Page scroll** (default) | the whole document; the top bar is `position: sticky` | content flow, editorial, marketing, most single-column pages |
| **Frame scroll** | only the content area (`overflow-y:auto`); top bar and sidebar are fixed and never move | app shell and dashboards where nav must stay reachable at any depth |

Frame scroll costs you the browser's scroll restoration and makes anchor links harder — take it only when the nav genuinely must stay put.

```css
/* Construction demo — frame scroll. Bar/rail sizes are yours to pick; keep them tokenized locally. */
.shell{display:grid;grid-template-columns:var(--rail) 1fr;grid-template-rows:var(--bar) 1fr;height:100dvh}
.shell>header{grid-column:1/-1;position:sticky;top:0;z-index:3;background:var(--bg-window)}
.shell>aside{overflow-y:auto;background:var(--sidebar)}
.shell>main{overflow-y:auto;overscroll-behavior:contain}   /* contain: stops scroll chaining to the page */
```

- **Top bar:** height stays constant — it never grows or shrinks on scroll (that is a geometry change, banned by the hover/geometry rule). It may gain a **separation cue once scrolled**: a `--hairline` bottom border or `--shadow-sm`, cross-faded, never a size change.
- **Sidebar:** fixed width; the active item is marked with **two channels** (`--accent-soft` ground **plus** `--accent` text or an accent bar), never color alone. Below the collapse breakpoint it becomes a bottom tab bar or a left drawer (§6) — pick one and keep it; do not ship both.
- **Safe area:** any bar pinned to a viewport edge pads with `env(safe-area-inset-*)`, or it sits under the home indicator on iOS.
- **Use `100dvh`, not `100vh`** — mobile browser chrome makes `100vh` overflow.
- **One primary action in the shell**, in the top bar. The rest of the page inherits the "one primary per screen" rule from `FOUNDATION.md` §6, and the shell's primary counts as that one.

## 2. Tabs / view switching

**Single state source: one function derives both the active class and panel visibility.** Two separate loops toggling two things is how they drift apart.

```js
/* Construction demo — one function, one source of truth. */
const show = key => {
  tabs.forEach(t => t.classList.toggle('on', t.dataset.v === key));
  tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.v === key));
  panels.forEach(p => p.hidden = p.dataset.v !== key);   // safe here: panels carry no author `display`
};
```

- **`hidden` is safe on panels, fatal on overlays.** A `<section>` with no author `display` hides correctly with `hidden`. An element whose CSS sets `display:flex` ignores `hidden` entirely — that is what locks an overlay open. Panels → `hidden`; overlays → class toggle (§3).
- **Semantics:** `role="tablist"` on the nav, `role="tab"` + `aria-selected` + `aria-controls` on each control, `role="tabpanel"` + `aria-labelledby` on each panel.
- **Keyboard:** `←`/`→` move between tabs, `Home`/`End` jump to first/last. Only the active tab is in the tab order (`tabindex="-1"` on the rest) — otherwise Tab walks through every view name before reaching content.
- **Visual:** inset track (`--inset`, `--r-md`, ~3px padding) with the active thumb in `--panel` at `calc(var(--r-md) - 3px)` — outer = inner + padding (`FOUNDATION.md` §3). The thumb may slide (`--t-med`, `--ease-out`) — that is polish, gated by stage ④; the state change itself is instant.
- **Overflow:** past ~5 tabs, switch to a `select`, a dropdown, or a sidebar. Horizontally scrolling tabs hide their own options.
- **State does not survive reload**, and that is fine — a single page has no route. Do not build persistence for it.

## 3. Overlay layer — one contract, three forms

**Use the smallest layer that can carry the decision, attached to the thing the decision is about.** Three forms, and nothing else — a layer that takes the whole viewport hostage for a local decision is not one of them.

| Form | Attached to | Blocks | Reach for it when |
|---|---|---|---|
| **Popover** (§4) | a trigger control, positioned against the viewport | nothing | menus, pickers, ⓘ peeks, a one-tap confirm — ≤ ~10 rows, no scroll of its own, no title needed |
| **Inside-window** (§5) | a container on the page (card / region / shell) | that container only | a decision or a short form about an object already on screen; the surrounding frame stays visible, so the context never leaves |
| **Drawer** (§6) | one edge of its scope | its scope, optionally | an editing surface or a detail with its own scroll, opened from a list that should stay in view |

Above that ceiling it is not an overlay at all: a whole multi-step task is a **view / tab** (§2) or a **stepper** (§9).

### 3.1 The overlay contract — all three forms obey every line

**Declare the scope first.** Every overlay names the element it is scoped to — `card | region | shell`. Scrim, `inert`, scroll lock, and the focus trap apply to **that element and nothing wider**. `position:fixed; inset:0` is an escalation you have to justify, never the default reflex.

**Two positioning families, and they are not interchangeable.** A **scoped layer** (inside-window, drawer) is a DOM child of its scope and lives inside that box. An **anchored layer** (popover, menu, tip) is teleported to the document root, `position:fixed`, and clamped to the **viewport** — it must escape every clipping ancestor to survive inside a scrolling region, so it belongs to the viewport by design (§4.4). Everything below applies to both.

| Rule | Detail |
|---|---|
| **A scoped layer lives inside its scope** | it is a DOM child of the scope element, and that element carries `position:relative`. Forget it and the `absolute` layer silently escapes to the viewport — only a render catches it |
| **Scrim covers exactly what is inert** | dimming a region while its controls still respond (or leaving a live-looking top bar over an inert page) is a lie the user finds by clicking. Scrim boundary, `inert` boundary, and scope are the same rectangle |
| **One layer per scope** | a second layer in the same scope means the flow is wrong — replace the content of the one that is open. Crossing scopes is allowed **one level only** (a popover launched from inside a drawer), never a stack |
| **Exits** | outside/scrim pointerdown **and** `Esc`, always both. A visible × is additionally required for any form that blocks or has no obvious outside area (inside-window, drawer); a popover may rely on outside-click plus re-activating its trigger |
| **Class toggle, never `hidden`** | an element whose own CSS sets `display` ignores `hidden` entirely — that is what locks an overlay open. Panels → `hidden`; overlays → a class |
| **Focus returns to the trigger** | on close — **but only if focus is actually still inside the layer**. Clicking outside onto another control must not have its focus yanked back to the trigger. Without the return, keyboard users land back at the top of the document; without the condition, every outside click fights the user |
| **Focus entry & trap** | blocking forms move focus in on open (the × or the first control) and trap Tab while open. A popover moves focus in only at panel caliber; a tip never steals focus (§4.1) |
| **Paired enter/exit** | one presentation mirrored in direction; unmount only after the exit finishes; exit ≈ enter ×0.7 (`FOUNDATION.md` §7) |
| **Scroll** | lock the scope only; the layer's own body scrolls internally with header and footer pinned, plus `overscroll-behavior: contain` |
| **Anchored layers die with their anchor** | any layer positioned from a trigger closes when the container that trigger lives in scrolls — an anchored layer left hanging while its trigger scrolls away is the classic bug |
| **a11y** | blocking layer: `role="dialog"` + `aria-labelledby` on the title, and `inert` on the scope's content — `inert` is what actually removes it from the screen reader, so no ARIA flag is needed to claim it. A tip layer is `role="tooltip"`. The trigger carries `aria-expanded` + `aria-controls` (`aria-haspopup` on a menu trigger) |
| **Layer stack, one counter** | z comes from a single shared counter (step 10 so a layer has room to arrange itself internally); later-opened is always on top. Two counters in two components will fight. Keyboard belongs to the **top layer only** — one `Esc` closes only the topmost, `Tab` cycles only in the topmost |
| **A child layer is not "outside"** | a layer opened from inside another sits outside its parent's box, but clicking it must not close the parent: the parent would close, the child's anchor would die with it, and both vanish at once. The test is "is this node inside a **higher-z** registered layer", not "is it inside my box" |
| **Surface** | `--panel` on `--r-lg`, `--shadow-pop` (inside-window / drawer) or `--shadow-md` (popover), at most one `--hairline`. Scrim ≈ `color-mix(in srgb, var(--bg-window) 55–70%, transparent)` + `blur(var(--glass-blur))` — and it must still read as a scrim when reduced-transparency zeroes `--glass-blur` |

```css
/* Construction demo — one scoped-layer mechanism; the three forms are variants of it.
   Sizes and the scrim mix are yours to tune; the scoping and the class toggle are not. */
.scope{position:relative;overflow:clip}          /* the declared scope — NOT the viewport by default */
.layer{position:absolute;inset:0;z-index:20;display:none;place-items:center;padding:24px;
       background:color-mix(in srgb,var(--bg-window) 60%,transparent);
       backdrop-filter:blur(var(--glass-blur))}
.layer.open{display:grid}                        /* `hidden` would be ignored here — hence the class */
.layer[data-blocking=off]{background:none;backdrop-filter:none;pointer-events:none}
.layer[data-blocking=off]>.surface{pointer-events:auto}
.layer>.surface{width:min(560px,100%);max-height:100%;overflow:auto;overscroll-behavior:contain;
       background:var(--panel);border-radius:var(--r-lg);box-shadow:var(--shadow-pop);padding:24px;
       transform:scale(var(--pop));opacity:0;
       transition:transform var(--t-med) var(--ease-out),opacity var(--t-med) var(--ease-out)}
.layer.in>.surface{transform:none;opacity:1}
/* drawer variant — same scrim, the surface parks on an edge instead of the center */
.layer[data-form=drawer]{place-items:stretch;padding:0}
.layer[data-form=drawer]>.surface{margin-left:auto;width:min(420px,100%);max-height:none;
       border-radius:var(--r-lg) 0 0 var(--r-lg);transform:translateX(100%);   /* % = its own width */
       transition:transform var(--t-sheet) var(--ease-drawer),opacity var(--t-fast) var(--ease-out)}
.layer[data-form=drawer].in>.surface{transform:none;opacity:1}
```

```js
/* Construction demo — one controller for every form. Form, scope, and blocking are data, not code paths. */
let live = null;
const openLayer = (layer, trigger) => {
  live?.close();                                          // one layer at a time
  const scope    = layer.closest('[data-scope]') ?? document.body;
  const content  = scope.querySelector('[data-content]');
  const blocking = layer.dataset.blocking !== 'off';
  layer.classList.add('open');
  requestAnimationFrame(() => layer.classList.add('in')); // paint the start state, then transition
  if (blocking) { scope.style.overflow = 'hidden'; content?.setAttribute('inert',''); }
  (layer.querySelector('[data-close]') ?? layer).focus();
  const close = () => {
    layer.classList.remove('in');
    let done = false;
    const drop = () => { if (!done) { done = true; layer.classList.remove('open'); } };
    layer.addEventListener('transitionend', drop, { once:true });
    setTimeout(drop, 400);                                // no transition running → transitionend never fires
    if (blocking) { scope.style.overflow = ''; content?.removeAttribute('inert'); }
    trigger?.focus();                                     // returns to the trigger — every form, no exception
    live = null;
  };
  live = { close };
};
addEventListener('keydown', e => { if (e.key === 'Escape') live?.close(); });
```

## 4. Popover — the anchored layer

Menus, pickers, one-tap confirms, ⓘ peeks. **It never blocks:** no focus trap on the page, no dimmed background, no scroll lock, **and no veil**.

**Build one base shell, not one component per use.** Everything below is one anchored-layer primitive taking a caliber and a placement strategy; a menu, a picker, and a tooltip are the same shell with different props. Two hand-rolled popovers in one product will drift within a week.

### 4.1 Two calibers — declared, never inferred

| Caliber | Who | Behavior |
|---|---|---|
| **Panel** | menus, pickers, small forms, detail panels | takes focus on open · `Tab` cycles inside · outside pointerdown closes · `Esc` closes · **registered** in the layer stack |
| **Tip** | ⓘ tooltips, hover explanations (`STATES.md` §5) | **never takes focus** · no `Tab` trap · no outside listener · `pointer-events: none` · opens and closes purely from the caller's `mouseenter`/`mouseleave` **and** focus · **not registered** in the stack |

- **The tip flag is an identity declaration, not a "does it open on hover" switch.** One flag decides all four behaviors at once, which is exactly why a tooltip can never steal focus from an input the user is typing into, and why it cannot flicker: a tip that ate the pointer would fire `mouseleave` on its own anchor the moment the cursor entered it.
- **Never register a tip in the layer stack.** Register one and the panel underneath stops believing it is the top layer — `Esc` dies the instant a tooltip appears.
- **Caliber stays orthogonal to placement** (§4.2): caliber says *who it is*, placement says *where it goes*. Neither derives the other.

### 4.2 Placement — two strategies, one clamp

| Strategy | Who | How |
|---|---|---|
| **anchor** | tips, small widgets | both axes hug the anchor; first fit wins in the order **down → up → right → left**. **No scoring** — a tip has no "better position", only fits / does not fit. All four fail (the anchor nearly fills the viewport) → fall back to `down` and let the clamp catch it |
| **center** | panels and menus | each candidate aligns **one** axis to the anchor and puts the other at the **viewport center**; pick the lowest score of `overlap × (a huge weight) + distance-to-viewport-center + clamp-distance × 2` |

The center score reads as one sentence: **never cover the anchor, then sit where it is comfortable to read.** A large panel glued to its trigger ends up jammed in a corner; a tip flung to the middle of the screen is no longer pointing at anything. That is the whole reason there are two strategies.

Shared by both: a fixed viewport margin (~10px) clamps the final position · a 6–10px gap from the anchor · **`transform-origin` derives from the chosen side** (right → `0`, left → its own width, otherwise the anchor's center clamped ≥12px away from either edge) so it grows out of the anchor · the entrance shift is ~10px **opposite** the side it opened on. No anchor at all → centered in the viewport with the origin at its own center.

### 4.3 Behavior — the parts that are not negotiable

- **No veil.** Outside pointerdown closes it, but **must not `preventDefault`** — the original click passes through, so one click both dismisses the menu and hits what the user aimed at. A veil eats that gesture, and the layer's own surface is what separates it from the page anyway.
- **Only one open per branch.** Opening a sibling closes the first. A layer opened *from inside* another is a child, not a sibling — the higher-z test in §3.1 is what keeps both alive.
- **Also closes on:** `Esc` (top layer only) · the anchor being re-activated · the anchor **losing its DOM connection** — a row deleted or a list reordered must take its popover with it, or the layer hangs over nothing.
- **`Esc` carries an IME guard** (`isComposing`, or `keyCode === 229`): cancelling a pinyin candidate is not closing the layer. Skip it and every CJK user loses their in-progress input to a dismissed panel.
- **Listeners exist only while open** — outside pointerdown, keydown (capture), resize, scroll (capture + passive), plus a `ResizeObserver` on **both the layer and the anchor**. Re-observe when the anchor changes; disconnect everything on close.
- **Guard the open/close race with an epoch counter.** Fast toggling or unmounting mid-open otherwise lets a stale round re-attach listeners to a layer that is already gone.

### 4.4 Measurement and the first frame

- **Measure hidden, then reveal.** Keep it `visibility: hidden` until the position is computed; the entrance runs on the reveal. Placing after paint is what makes a popover jump on its first frame.
- **Measure yourself with `offsetWidth` / `offsetHeight`, never `getBoundingClientRect()`.** The rect includes the entrance transform that is *still running*, and the `ResizeObserver` fires once immediately on open — so the first frame recomputes `left` from a shrunken box and a right-side layer visibly twitches sideways. The layout box is immune to `transform`, so re-running mid-animation yields the same answer. **The anchor still uses `getBoundingClientRect()`** — it needs viewport coordinates.
- **Snap to device pixels:** `Math.round(v * dpr) / dpr`, or a half-pixel left edge blurs the whole surface.
- **Teleport to the document root + `position: fixed`**, so no clipping or transformed ancestor can eat it. Bound it: `max-width: calc(100vw - 20px)`, `max-height: min(78vh, calc(100vh - 20px))`, internal scroll past that.
- **A menu is never narrower than its trigger** — `width: max(trigger width, ~168px)` — otherwise the options are more cramped open than closed.
- **Content width vs shell width are different numbers.** The caller sizes *content*; the shell adds its own closure (§4.5) on top. Mixing the two makes every call site compensate by hand.

### 4.5 Surface — the closure is two planes, not two lines

Hairlines do not make a layer read as an object: two strokes on one flat plane read as a **frame inside a frame**. Depth comes from a tone step plus light — the same rule as `SKILL.md` §B.5.

- **Plinth construction:** the shell itself is only a **seat** — a `--plinth`-wide ring, *darker than the page floor* (`--inset`) — and the card sitting on it is drawn by `::before` at `--panel-strong`, carrying a lit top edge (`--card-edge`) and a tight shadow (`--shadow-sm`) that lands **on the seat**. No borders anywhere.
- **The seat must be made with `padding`, never `border`.** `overflow` clips to the padding box: the padding version keeps the seat inside the clip so the card's shadow lands, while `border: Npx solid transparent` pushes the seat out of the clip and the shadow is cut away — the whole effect silently disappears.
- **The card plane is `::before` with `z-index: -1`**, so the shell must form its own stacking context (`z-index: 0`, or an inline z-index). Otherwise `::before` sinks below the shell's own background and the card vanishes.
- **Check the card against the surface the layer actually opens over.** The two planes are a *relative* step, so the pair has to be re-picked per theme and per ground: in the light ramp `--panel-strong` and `--bg-window` are the same value, and over that ground the seat ring plus the tight shadow are carrying the separation alone. Either step the card up to `--panel` or accept the seat as the load-bearing plane — but decide it by rendering both themes, not by reading the token names.
- **Radius scales with the box, it does not unify by tier.** 24px reads as closure on a 660px drawer and as a blob on a 168px menu. Card radius derives as `--shell-radius - --plinth`, so the two planes stay concentric at every size (the nested-radius rule, `FOUNDATION.md` §3).
- **Tier by "is this a face", not by size:** 面 — drawer / large panel → `--r-xl` · 弹层 — panel, menu, picker → `--r-lg` · **提示层 — tip → `--r-md`, solid `--panel-strong` + one `--sep` hairline, no plinth.** One line of text cannot carry two planes; on a tip the plinth is exactly the frame-inside-a-frame it exists to avoid.

```css
/* Construction demo — the plinth. Widths and radii are yours to tune; the two constraints above are not. */
.edge{--shell-radius:var(--r-lg);position:relative;z-index:0;box-sizing:border-box;
      padding:var(--plinth);border-radius:var(--shell-radius);
      background:var(--inset);box-shadow:var(--shadow-lg)}
.edge::before{content:"";position:absolute;z-index:-1;inset:var(--plinth);
      border-radius:calc(var(--shell-radius) - var(--plinth));
      background:var(--panel-strong);box-shadow:var(--card-edge),var(--shadow-sm)}
.edge.face{--shell-radius:var(--r-xl)}                    /* drawer / large panel: same seat, larger radius */
.tip{background:var(--panel-strong);border:1px solid var(--sep);border-radius:var(--r-md);
     box-shadow:var(--shadow-lg);pointer-events:none}     /* tip caliber: no plinth */
```

### 4.6 Ceiling

The moment it needs a title, more than ~2 controls, or its own scrollbar, it has outgrown the form — promote it to §5 or §6. Growing the popover instead is how a menu turns into an unlabelled dialog nobody can close.

## 5. Inside-window (窗中窗)

A panel that opens **inside the bounds of a container**, positioned `absolute` against that container (`position:relative` + `overflow:clip` on the scope) — never `fixed` against the viewport. The frame around it (top bar, sidebar, sibling blocks) stays visible, so the user can still see the thing the decision is about. **This is the default form for any decision a popover cannot hold.**

- **Pick the tightest scope that contains the object:** `card → region → shell`. A layer covering one 320px card reads as that card opening up; a shell-scoped layer is as far as this system goes.
- **Two weights.** ① **Peek** — no scrim, the scope stays interactive; sources, previews, a detail read (`data-blocking="off"` above). ② **Scoped-blocking** — scrim + `inert` over that scope only, focus trapped inside; a decision that must be answered before the region can continue. The rest of the shell keeps working either way.
- **Sizing:** either `width:min(560px,100%)` centered within the scope, or inset from the scope's edges by ~24–32px for a large one; `max-height:100%` with the body scrolling internally, header and footer pinned. **Never larger than its scope** — the scope's clipping is what makes it read as a window inside a window.
- **Origin:** grows from the trigger when there is one; from the scope's center when there is not. `--pop` + fade at `--t-med`.
- **Chrome:** title at `--fs-title` / weight 650, × top-right, actions pinned at the bottom. One `--hairline` separating header and footer from the scrolling body, not a border on all four sides. Its closure is the 面 tier of the plinth (§4.5) — same two planes as the anchored family, one radius step larger.
- **The body scrolls, the shell does not.** If the shell itself becomes the scroll container, an absolutely positioned card plane scrolls out of its own seat. Header and footer end up pinned, which is the better layout anyway.
- **Narrow scope** (< ~480px wide) → the same content becomes a bottom drawer (§6). Same content, one breakpoint.
- **A hard stop is a scope, not a different design.** Session expiry or work about to be lost scopes to `shell` and inerts the shell's content — at most one per product, and it is still this form.

## 6. Drawer

An edge-attached panel for content with its own scroll: detail, editing, filters, mobile navigation.

- **Edge by scope width:** right on desktop (detail / edit / filters), bottom on narrow (sheet), left only for navigation. One edge per purpose, fixed for the whole product.
- **Size:** right `min(420px,100%)`, a wide editor up to `min(560px,92%)`; bottom sheet `max-height:88dvh` with `--r-lg` on the top corners only and `env(safe-area-inset-bottom)` padding.
- **Scoped like any other layer.** A drawer scoped to the content region leaves the top bar and sidebar live and reachable — that is the point of the form.
- **Keep the origin visible:** the row that opened the drawer stays marked as selected while it is open, and the list keeps its scroll position.
- **Motion:** `translateX/Y(100%)` — percentages, never hard-coded px — with `--ease-drawer` at `--t-sheet`; enter and exit through the same edge.
- **A grabber bar is a promise the sheet is draggable.** Draw it only if the drag exists.
- **Drag-to-dismiss** (rubber-band past the edge, velocity + distance threshold, snap back below it) is gesture physics → stage ④ and `MOTION.md` §7, **always asked separately**. The baseline drawer ships with scrim / `Esc` / × and is complete without it.

## 7. Confirmation & destructive actions

Confirmation is sized by consequence, not by habit:

| Consequence | Form |
|---|---|
| Reversible, one object (remove a tag, delete a draft) | inline confirm **popover** on the trigger — one sentence, one destructive button, undo toast afterwards |
| Irreversible, or plural (delete 12 files, reset a workspace) | **inside-window, scoped-blocking** at the region that owns the object |
| Destroys work not visible from here | same form, scope raised to `shell` |

Whatever the form: it **names the object**, states the consequence in a **resident** line (never folded into a ⓘ — `STATES.md` §5), the destructive button carries **secondary weight** while Cancel takes the safe default focus. Type-to-confirm belongs only to objects that are unrecoverable **and** shared — as decoration it just teaches users to type without reading.

## 8. Toast

System feedback that must not interrupt. If the user must respond, it is an inside-window layer (§5), not a toast.

| Question | Answer |
|---|---|
| Where | one corner or one edge, **fixed for the whole product** — never per-message |
| How long | success/info 3–5s · anything with a number to read 5–7s · **errors do not auto-dismiss** |
| How many | 3 visible; a 4th replaces the oldest. Never a wall of stacked toasts |
| Duplicates | same message within a short window updates the existing toast (bump a counter), never spawns a second |
| Dismissal | swipe in the direction it entered · a × on hover/focus · Esc closes the newest |
| Semantics | live region: `aria-live="polite"`, or `assertive` for errors |
| Pausing | hovering or focusing a toast pauses its timer; it resumes on leave |

**It exits through the edge it entered** (`MOTION.md` §5) — otherwise the swipe-away gesture has no intuition behind it. Use a `transition`, never `@keyframes`: toasts are the most-interrupted element on the page, and keyframes replay from zero when interrupted (`MOTION.md` §6).

## 9. Stepper

For **≥3 ordered, dependent steps where each step carries real content**. Fewer than 3, or steps that are only labels → a plain timeline; do not upgrade it.

- Timeline progress header, **completed dots are jumpable**, future ones are not.
- One panel at a time; prev/next controls ≥44px; a visible `n / total` counter.
- **Validate on leaving a step, not on submit** — the point of a stepper is that the error surfaces next to the field that caused it.
- Progress is derived from one index variable; the header, the panel, and the counter all read it (same single-source rule as tabs).

## 10. Collection routing

3+ content items (news, articles, posts, findings, research). Route by shape:

| Shape | Layout |
|---|---|
| 3–5 curated | stacked briefing deck |
| 4–8, one theme | accordion, single open |
| 6+ | list ↔ detail — as two views, or the detail in a right drawer (§6) with the list still visible |
| >2 themes | segmented tabs |
| "give me everything" | flat full spread, nothing folded |

- **The whole card or row is the hit area** (`role="button"`, `tabindex="0"`, pointer cursor) — never a small link inside it.
- **The back control sits at the end of the detail content**, where reading actually stops — not only in the top corner.
- **Every entry is a full headline + a 2–4 sentence summary + meta.** A bare headline is never acceptable; the summary is data, not shell (see `STATES.md` §4 content floor).
- Detail views enter from one side and leave the same way (`MOTION.md` §5); the list keeps its scroll position.

## 11. Density valve — fold early

| Condition | Action |
|---|---|
| >2 topics | 2–3 segmented tabs |
| >8 rows in one view | accordion / briefing deck / list ↔ detail |
| >4 rows on one face | same |
| anything longer | fold it; **no infinite vertical scroll** |

Horizontal scroll is allowed in exactly one place: the sticky strip of a briefing deck. Everywhere else it hides content from the user.

---

**Motion note.** Everything in this file describes **behavior**, which ships in the static build. The enter/exit *pairing* of overlays is baseline feedback (`FOUNDATION.md` §7) — an overlay with no exit is broken, gated or not. Only the choreography (spring curves, staggered reveals, thumb sliding) waits for stage ④ and `MOTION.md`.
