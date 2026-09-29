# Morii Shell — app frame, views, layers, feedback

> **Read** for a persistent frame, several views, any overlay, toast, confirmation or stepper. This file is **behavior**; every surface's look comes from its role (`FOUNDATION.md` §3). Code here shows mechanism — all values are tokens.

## 1. App shell

**Scroll model — decide before any CSS, never mix:**

| Model | Who scrolls | Use when |
|---|---|---|
| **Page scroll** (default) | the document; the top bar is `sticky` | content flow, most single-column pages |
| **Frame scroll** | only the content area; bar and sidebar never move | app shells and dashboards where navigation must stay reachable (costs scroll restoration and easy anchor links) |

```css
.shell{display:grid;grid-template-columns:var(--rail) 1fr;grid-template-rows:var(--bar) 1fr;height:100dvh}
.shell>header{grid-column:1/-1;position:sticky;top:0;z-index:3;background:var(--bg-window)}
.shell>aside{overflow-y:auto;background:var(--sidebar)}
.shell>main{overflow-y:auto;overscroll-behavior:contain}
```

- The top bar's height never changes on scroll; it may gain one cue once scrolled (a hairline or `--shadow-sm`), cross-faded.
- Sidebar width is fixed; the active item carries two channels. Below the breakpoint it becomes a bottom bar *or* a left drawer — one, fixed.
- Pinned bars pad with `env(safe-area-inset-*)`; use `100dvh`, not `100vh`.
- The shell's primary action *is* the screen's one primary.

## 2. Tabs

```js
const show = key => {                       // one function = one source of truth
  tabs.forEach(t => { const on = t.dataset.v === key;
    t.classList.toggle('on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  panels.forEach(p => p.hidden = p.dataset.v !== key);
};
```

- `hidden` is safe on panels (no author `display`) and fatal on overlays — overlays toggle a class (§3).
- `role="tablist"` / `tab` (+ `aria-selected`, `aria-controls`) / `tabpanel` (+ `aria-labelledby`); `←` `→` `Home` `End`; only the active tab is in the Tab order.
- Past ~5 views → a select, dropdown or sidebar; never horizontally scrolling tabs. A single page doesn't persist tab state across reloads — don't build it.

## 3. Layers — one contract, three forms

Use the smallest layer that carries the decision, attached to the thing it is about:

| Form | Attached to | Blocks | For |
|---|---|---|---|
| **Popover** (§4) | a trigger | nothing | menus, pickers, ⓘ peeks, a one-tap confirm — ≤ ~10 rows, no title |
| **Inside-window** (§5) | a container: card, region or shell | that container only | a decision or short form about something on screen |
| **Drawer** (§6) | one edge of its scope | its scope, optionally | editing or detail with its own scroll, opened from a list that stays visible |

Anything bigger is a view (tabs) or a stepper, not an overlay.

**The contract — every form obeys all of it:**

- **Declare the scope** (`card | region | shell`). Scrim, `inert`, scroll lock and focus trap apply to exactly that element; the scrim covers exactly what is inert. `position:fixed; inset:0` is an escalation you must justify.
- **Two positioning families:** scoped layers are DOM children of a `position:relative` scope; anchored layers teleport to the root, `position:fixed`, clamped to the viewport so no clipping ancestor eats them.
- **One layer per scope** — a second means the flow is wrong; crossing one level is fine (a popover from inside a drawer).
- **Exits:** outside pointerdown **and** `Esc`, always; plus a visible × for any form that blocks.
- **Class toggle, never `hidden`,** on anything whose CSS sets `display` — that is what locks an overlay open.
- **Focus:** blocking forms move focus in and trap `Tab`; on close, focus returns to the trigger — *only if it is still inside the layer*, so an outside click never has its focus yanked back.
- **Paired enter/exit** mirrored in direction; unmount only after the exit finishes; exit ≈ enter × 0.7.
- **Scroll:** lock the scope only; the layer's body scrolls with header and footer pinned, `overscroll-behavior: contain`.
- **Anchored layers die with their anchor** — when its container scrolls or it leaves the DOM.
- **a11y:** blocking → `role="dialog"` + `aria-labelledby`, and `inert` on the scope's content; tip → `role="tooltip"`; the trigger carries `aria-expanded` + `aria-controls` (`aria-haspopup` for menus).
- **One stack:** z from a single shared counter; `Esc` and `Tab` go to the top layer only; a child layer opened from inside another is not "outside" its parent (test: inside a higher-z registered layer?).
- **Surface:** the floating role and the product's floating material (`FOUNDATION.md` §3); one closure cue; radius by size — drawer / large panel `--r-xl`, panel and menu `--r-lg`, tip `--r-md`. Scrim ≈ `color-mix(in srgb, var(--bg-window) 55–70%, transparent)` + `blur(var(--glass-blur))`, still a scrim when blur is zeroed.

```css
.scope{position:relative;overflow:clip}
.layer{position:absolute;inset:0;z-index:20;display:none;place-items:center;padding:var(--sp-5);
       background:color-mix(in srgb,var(--bg-window) 60%,transparent);backdrop-filter:blur(var(--glass-blur))}
.layer.open{display:grid}
.layer[data-blocking=off]{background:none;backdrop-filter:none;pointer-events:none}
.layer[data-blocking=off]>.surface{pointer-events:auto}
.layer>.surface{transform:scale(var(--pop));opacity:0;
       transition:transform var(--t-med) var(--ease-out),opacity var(--t-med) var(--ease-out)}
.layer.in>.surface{transform:none;opacity:1}
```

```js
let live = null;
const openLayer = (layer, trigger) => {
  live?.close();
  const scope = layer.closest('[data-scope]') ?? document.body, content = scope.querySelector('[data-content]');
  const blocking = layer.dataset.blocking !== 'off';
  layer.classList.add('open'); requestAnimationFrame(() => layer.classList.add('in'));
  if (blocking) { scope.style.overflow = 'hidden'; content?.setAttribute('inert', ''); }
  (layer.querySelector('[data-close]') ?? layer).focus();
  const close = () => {
    layer.classList.remove('in');
    let done = false; const drop = () => { if (!done) { done = true; layer.classList.remove('open'); } };
    layer.addEventListener('transitionend', drop, { once: true }); setTimeout(drop, 400);
    if (blocking) { scope.style.overflow = ''; content?.removeAttribute('inert'); }
    if (layer.contains(document.activeElement)) trigger?.focus();
    live = null;
  };
  live = { close };
};
addEventListener('keydown', e => { if (e.key === 'Escape' && !e.isComposing) live?.close(); });
```

## 4. Popover — the anchored layer

- **Never blocks:** no trap, no dim, no scroll lock, no veil. Outside pointerdown closes it *without* `preventDefault`, so one click both dismisses and hits what the user aimed at.
- **One anchored primitive;** menus, pickers and tips are props of it, not separate components.
- **Two calibers, declared:** *panel* (takes focus, `Tab` cycles inside, registered in the stack) and *tip* (never takes focus, `pointer-events:none`, opens from the anchor's hover **and** focus, **not** registered — a registered tip makes the panel beneath lose `Esc`).
- **Placement:** tips hug the anchor, first fit wins down → up → right → left. Panels align one axis to the anchor and center the other in the viewport — never cover the anchor, then sit where it's comfortable to read. ~10px viewport margin, 6–10px gap, `transform-origin` from the chosen side, entrance shift opposite that side.
- **Closes on** `Esc` (top layer only; IME guard `isComposing` / `keyCode 229`), re-activating the anchor, or the anchor leaving the DOM. One open per branch.
- **Listeners exist only while open** (outside pointerdown, keydown capture, resize, scroll capture, a `ResizeObserver` on layer *and* anchor); an epoch counter stops a stale open/close round re-attaching them.
- **Measure hidden, then reveal.** Size the layer with `offsetWidth` / `offsetHeight` (immune to the running entrance transform), the anchor with `getBoundingClientRect()`; snap to device pixels. Bound it: `max-width: calc(100vw - 20px)`, `max-height: min(78vh, calc(100vh - 20px))`.
- **A menu is never narrower than its trigger** — `width: max(trigger, ~168px)`.
- **Ceiling:** a title, more than ~2 controls, or its own scrollbar → promote it to §5 or §6.

## 5. Inside-window

- `absolute` inside the tightest scope that contains the object — card → region → shell — with `position:relative; overflow:clip` on the scope. The frame around it stays visible, so context never leaves.
- **Peek** (no scrim, scope stays live) or **scoped-blocking** (scrim + `inert` on that scope, focus trapped).
- `width: min(560px, 100%)` centered, or inset 24–32px when large; `max-height: 100%`, body scrolls, header and footer pinned; never larger than its scope.
- Grows from its trigger (scope center when there is none): `--pop` + fade at `--t-med`.
- Title at `--fs-title` / 650, × top-right, actions pinned at the bottom, one hairline between them and the body.
- Narrow scope (< ~480px) → the same content as a bottom drawer. A hard stop (session expiry, work about to be lost) is this form scoped to `shell` — at most one per product.

## 6. Drawer

- **Edge by purpose, fixed per product:** right on desktop (detail, edit, filters), bottom on narrow screens, left only for navigation.
- Right `min(420px, 100%)` (a wide editor up to `min(560px, 92%)`); a bottom sheet `max-height: 88dvh`, top corners rounded, safe-area padding.
- Scoped like any layer — scoped to the content area, it leaves the top bar and sidebar live. The originating row stays marked; the list keeps its scroll.
- `translateX/Y(100%)` with `--ease-drawer` at `--t-sheet`, in and out through the same edge.
- A grabber promises dragging — draw it only if drag exists; drag-to-dismiss is gesture physics (`MOTION.md` §6), asked separately.

## 7. Confirmation — sized by consequence

| Consequence | Form |
|---|---|
| reversible, one object | inline confirm popover on the trigger — one sentence, one destructive button, an undo toast after |
| irreversible, or many objects | inside-window, scoped-blocking, at the region that owns them |
| destroys work not visible here | the same, scoped to `shell` |

Name the object; state the consequence in a resident line (never in ⓘ); the destructive button takes secondary weight and Cancel the default focus. Type-to-confirm only for objects both unrecoverable and shared.

## 8. Toast

Feedback that must not interrupt — if the user must respond, it is an inside-window.

- One corner or edge, fixed product-wide. Success / info 3–5s, anything with a number to read 5–7s, **errors never auto-dismiss**.
- ≤3 visible (a 4th replaces the oldest); a duplicate within a short window bumps a counter instead of stacking.
- Swipe away the way it came, × on hover/focus, `Esc` closes the newest; hover or focus pauses the timer. `aria-live="polite"` (`assertive` for errors).
- Exits through the edge it entered, with a `transition` — never `@keyframes`, since it is the most-interrupted element on the page.

## 9. Stepper

For ≥3 ordered, dependent steps that each carry real content (fewer → a plain timeline).

- A progress header where completed steps are jumpable and future ones aren't; one panel at a time; ≥44px prev/next; `n / total`.
- Validate when leaving a step, not on submit — the error appears next to the field that caused it.
- One index variable drives the header, the panel and the counter.
