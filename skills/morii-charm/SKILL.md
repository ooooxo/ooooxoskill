---
name: morii-charm
description: >
  Use when designing and animating a Morii 角饰 (Charm) — a small SKEUOMORPHIC object-icon
  hand-built from stacked CSS divs (NOT an SVG, NOT a flat icon) that depicts what something
  does and comes alive with one small looping animation. Two skills in one: (1) design
  association — turning an abstract function into a real desk-object you draw; (2) animation
  implementation — the CSS keyframe craft that gives it depth and a sign of life. Reach for
  it on any 「做个角饰 / 拟物小图标 / 会动的小物件 / 卡角那个动画图标 / a mini clock/envelope/
  gift/radar that animates / reproduce the capsule charms / how was this icon animated」.
  This is the skeuomorphic COMPLEMENT to morii-icon: morii-icon draws one flat static SVG
  glyph; morii-charm invents a little 3D object out of divs and animates it. Do NOT produce
  a flat icon-in-a-tile, a plate/disc under an icon, or an abstract geometric primitive.
  Keywords: 角饰 charm 拟物图标 skeuomorphic animated-icon CSS-animation 会动的图标.
  Triggers: 角饰, 拟物图标, 会动的图标, charm, animated icon, 做个角饰, css 动画图标.
allowed-tools:
  - Read(~/.claude/skills/morii-charm/**)
  - Read(//Users/rainy/AllProject/Morii/src/panel/capsule/**)
  - Bash(open:*)
---

# Morii Charm — design & animate a skeuomorphic object-icon

**A 角饰 (Charm) is a tiny real-world object, hand-built from stacked CSS divs, that depicts what something does and comes alive with one small looping animation.** A clock for an alarm, an envelope for a message, a radar for "who's nearby." It is deliberately **not** a flat icon: it has volume (a lit top, a dark underside, a drop shadow) and a slow "sign of life."

This skill is **two crafts**:

- **① 设计联想 (design association)** — turn an abstract function into a concrete desk-object you can draw. *§A.*
- **② 动画实现 (animation implementation)** — build that object from divs and give it depth + a looping life-sign, in pure CSS. *§B.*

Everything else (how it mounts onto a Morii capsule) is plumbing, demoted to the appendix.

> You **cannot judge a charm from its CSS string.** Render it at real ~56px, animating, in **both** light and dark — the depth, the tint mixes, and the timing *are* the design. Always finish at the gallery (§D).

Shipped family (live in `charms-gallery.html`, teardown in `references/catalog.md`, source `src/panel/capsule/charms/Charm*.vue`): clock·note·donut·ballot·plane·gift·bot·envelope·inbox·radar.

---

## Roots — every rule flows from these

**拟物三铁律 (three iron laws of skeuomorphism):**

1. **饱满 — full, dimensional mass.** Real depth: gradient body (light top → dark bottom), drop shadow, inset underside, lit top plane. Never flat, thin, or hollow-outline. If it could be printed on paper, it failed.
2. **无方框轮廓 — no frame, no plate, no tray.** The object *is* the body. There is **no** rounded-square panel or disc *under* it holding an icon. A clock is a clock-shaped disc because clocks are round — not "a clock icon on a tile." Most-broken law.
3. **轮廓随物体 — the silhouette is the real object's outline.** Shape comes from the thing itself — envelope-shaped, folded-triangle plane, dark radar scope. (A dark disc is legit for radar because that *is* a radar; a dark disc "holding" a person-icon is a banned plate.)

And the one that decides whether you even have the right idea:

4. **Depict the verb, not a symbol.** The icon *is* the action's object, doing the action. This is §A.

---

# § A — 设计联想: from function to object

This is where most charms are won or lost. Before a single div, you decide **what thing to draw**.

## A1. The verb → object move

Name the function as a **verb**, then find the physical desk-object that performs that verb. Not a symbol *for* it — the *thing itself*.

| function (verb) | object (NOT the symbol) |
|---|---|
| remind me at a time | an **alarm clock** (not a bell) |
| save this as a note | a **sticky note**, dog-eared |
| summarize replies | a **bare data ring** (the chart *is* the object) |
| take a vote | a **ballot box** with a slip |
| send over LAN | a **paper airplane** + ground shadow |
| receive a file | an **open cardboard box** catching a sheet |
| a new version is out | a **gift box**, bouncing |
| find people nearby | a **radar scope**, sweeping |
| compose a message | an **envelope**, letter peeking out |
| the AI assistant | a **robot head** |

**The child test:** could a child point at your object and *name the action*? If yes, you have a charm. If you're reaching for a conventional glyph (bell, gear, chat-bubble, magnifier), you've slipped into icon-thinking — back up and find the real object.

## A2. Pick the object whose *shape* and *motion* both carry meaning

The best objects give you two payloads at once:
- a **silhouette** that's unmistakable at 56px (envelope flap, clock face, plane triangle), and
- a **natural motion** that *is* the verb (ballot slip dropping in, radar sweeping, gift bouncing).

If an object has a great shape but no obvious motion, it may be a *quiet* charm (fine — see B4). If it has neither, it's the wrong object.

## A3. Reduce to 3–6 parts, one of which is the "signature detail"

Decompose the object into the fewest stacked pieces that still read:
- a **body** (the mass),
- a **lid / highlight** (catches light, adds volume),
- **the signature detail that NAMES it** — clock hands, envelope flap, radar blips, ballot slot. This is the part that says *what this is* and tells it apart from its neighbors. Pick it deliberately.
- plus shadow moves.

More than ~6 parts and it turns to mush at icon size. If you can't get it under six, the object is too complex — pick a simpler one for the same verb.

## A4. Differentiate within the family

Two functions must never get look-alike objects. If two would share an object (send vs receive both = a box), split them by **shape** (paper plane vs open box) or by **motion direction** (slip goes *in* the ballot vs letter peeks *out* of the envelope — same z-trick, opposite verb). A blob-with-a-vague-notch reused across meanings is the failure mode.

---

# § B — 动画实现: build it and bring it alive (CSS)

Once you know the object and its parts, this is the mechanical craft. All CSS, all divs.

## B0. Wrapper geometry (fixed skeleton)

Every charm's outer `.aXxx` is identical except the object inside:

```css
.aXxx {
  position: absolute;            /* rides a corner; overflows on purpose */
  left: -24px; top: -20px;
  z-index: 3;
  width: 58px; height: 58px;     /* ~54–58 */
  transform: rotate(-8deg);      /* the collage "stuck-on" tilt */
  animation: xxx-on 450ms cubic-bezier(.18,1.42,.32,1) 240ms both;   /* stick-on entrance, B5 */
}
```

## B1. The depth kit — how divs fake a solid object

Depth is exactly **three moves** on whatever silhouette you built in §A. Every tinted charm is these three:

```css
/* (1) gradient body: light top → dark bottom = rounded volume */
background: linear-gradient(var(--x-tint), color-mix(in srgb, var(--x-tint) 60%, #000));
/* (2) drop shadow lifts it off the surface + inset shadow = underside ambient occlusion */
box-shadow: 0 5px 12px rgba(0,0,0,.35), inset 0 -7px 10px rgba(0,0,0,.22);
/* (3) a lit top plane / lid catches light */
background: linear-gradient(color-mix(in srgb, var(--x-tint) 78%, #fff), var(--x-tint));
box-shadow: inset 0 1.5px 1.5px rgba(255,255,255,.3);
```

**Color rules:**
- One custom prop `--x-tint` on the wrapper. Shades via `color-mix(in srgb, var(--x-tint) N%, #000|#fff)`: ~60–64% #000 = shadow face, ~76–80% #fff = lit lid, ~42% #fff = bright accent.
- **Tint one surface only.** The "colored" face takes `--x-tint`; the rest stays honest material — paper `#f4f1ea`, sticky-note `#e5c86e` (light `#ecd27c`), metal `linear-gradient(#f0f1f4,#c0c4cd)`, dark screen `#10141a`. Coloring the *whole* object = monochrome blob = icon-thinking.
- **Shadows are neutral black, never colored.**
- Give `[data-theme="light"]` overrides for any near-white/near-black material that would vanish on a flipped background.

## B2. Primitive cheat-sheet — silhouette from divs

| want | do |
|---|---|
| box / body | `<i>` + asymmetric `border-radius` (`0 0 7px 7px` = box bottom) |
| triangle (flap, fold, plane, roof) | `clip-path: polygon(...)` |
| ring / donut | disc + `::after` hole filled `var(--panel)` + inset shadow for thickness; `conic-gradient` for segments |
| disc / screen | `border-radius:50%` + `radial-gradient` + ring via `inset 0 0 0 1.5px` |
| thin marks (ticks, ink lines, hands) | tiny `<i>` pills; radial repeats via `transform-origin` + `rotate(i·step)` |
| bow / soft ears | `::before/::after` with 异形 `border-radius:65% 35% 25% 60%`, mirror `scaleX(-1)` |
| clock hands | `transform-origin:50% 100%` pills rotated by a computed angle |
| emissive (eye, antenna light) | `box-shadow: 0 0 5–7px var(--x-tint)` |

## B3. The animation vocabulary — one sign of life

The idle loop should depict the object **doing its job** — clock ticks + rings, ballot drops a slip, radar sweeps, envelope peeks its letter, gift bounces. The motion is a tiny loop of the object's **verb**. A charm that merely floats is under-designed.

**Patterns (mix as the object needs):**

- **响一阵歇一阵 (busy-then-rest)** — active first ~25% of the cycle, still the rest. Alive, not frantic.
  ```css
  animation: ringburst 3.6s ease-in-out infinite 1.4s;
  @keyframes ringburst { 0%,28%,100%{transform:rotate(0)} 4%{transform:rotate(-7deg)} 9%{transform:rotate(6deg)} 14%{transform:rotate(-5deg)} 19%{transform:rotate(3.5deg)} 24%{transform:rotate(-1.5deg)} }
  ```
- **Cartoon squash-stretch** — physical bounce, `transform-origin` at the base (`50% 92%`): 蓄力压扁 → 起跳拉伸 → 落地挤压 → 回弹.
  ```css
  @keyframes giftjump { 0%,26%,100%{transform:translateY(0) scale(1,1)} 4%{transform:translateY(1px) scale(1.07,.88)} 9%{transform:translateY(-6px) scale(.95,1.07) rotate(-2deg)} 14%{transform:translateY(.5px) scale(1.06,.9)} 19%{transform:translateY(-1.5px) scale(.99,1.02)} }
  ```
- **Layer follow-through** — loose parts (lid, bow) lag the body on a second keyframe at the same period, phase-shifted, so they flap after the jump.
- **z-order narrative — the whole point of "in" and "out".** Put the moving piece *behind* the container and slide it toward the seam: behind→down = *into* the box (ballot slip, inbox sheet); behind→up = *peeking out* (envelope letter). The occlusion **is** the meaning.
  ```css
  /* ballot slip is z0 behind the lid; sliding down = dropping into the box */
  @keyframes slipdrop { 0%,12%{transform:translateY(0);opacity:1} 32%,60%{transform:translateY(17px);opacity:1} 68%{transform:translateY(17px);opacity:0} 76%{transform:translateY(0);opacity:0} 86%,100%{transform:translateY(0);opacity:1} }
  ```
- **Synced dual loops** — two leaf nodes, same period, phase/scale offset → sells physics: plane drifts up while its ground shadow scales down + fades (altitude); radar beam spins while blips light *as it passes* (`animation-delay` = phase); clock second-hand `sweep 60s` under the `ringburst`.
- **Sweep / spin** for scanning things — `conic-gradient` beam + `@keyframes {to{transform:rotate(360deg)}} linear infinite`.

**Timing discipline:** one gesture, long eased period (**3.2–5s** `ease-in-out infinite` + ~1.2–1.4s start delay). It should *breathe*, not buzz.

## B4. Deciding a charm is *quiet*

Not everything animates. **Data/summary** charms (the donut) stay still — motion would imply the numbers are changing. Deciding static is a real design choice, not laziness. (The robot head is static for a *different* reason — B6.)

## B5. The stick-on entrance — family glue (verbatim)

Every charm enters the **same** way: over-rotated + oversized + transparent, snapping to rest on a springy curve. This is what makes a brand-new charm read as one of the family before you even see its idle loop.

```css
@keyframes xxx-on {
  from { opacity: 0; transform: rotate(-14deg) scale(1.45); }
  to   { opacity: 1; transform: rotate(-8deg)  scale(1); }
}
```
The 240ms delay = the "stick-on beat": the surface fades up first, then the sticker **啪** lands.

## B6. ⚠️ The leaf-node law (not optional)

Infinite `transform`/`opacity`/`filter` loops go **only on the innermost object pieces** — never on the `.aXxx` wrapper or any ancestor that also carries a parent transform / an input / a morphing shell. On a transparent WebView (macOS WKWebView, ADR 0128) this causes **ghost frames** (旧帧残影) + IME/focus loss. This is why the robot head is fully static — its host morphs, so no infinite layer is allowed there. The **entrance** (transient, self-terminating) on the wrapper is fine; only *infinite* loops are restricted. Always close with:
```css
@media (prefers-reduced-motion: reduce) { .aXxx, .leaf1, .leaf2 { animation: none; } }
```

---

## § C — Build loop (every charm)

1. **§A: verb → object → 3–6 parts + the signature detail.** (Child test.)
2. **§B0/B1: wrapper skeleton + depth kit.** Tint one surface, rest = honest material.
3. **§B2: build the silhouette** from primitives.
4. **§B3/B4: pick the ONE verb-loop** (or decide it's quiet). Leaf nodes only.
5. **§B5: add the stick-on entrance + reduced-motion off.**
6. **§D: render at 56px, light + dark, on a card. Fix. Repeat.**

---

## § Banned — each = falling back to icon-thinking

- ❌ a **flat SVG icon** / icon-in-a-tile (that's morii-icon's job — a *different* style).
- ❌ a **plate / disc / rounded-square under an icon**; a 底盘+边框 tray. The object is its own body.
- ❌ an **abstract geometric primitive** (clip-path bare star, gradient sphere, floating symbol). Find the real object.
- ❌ **colored border / colored shadow.** Shadows neutral black.
- ❌ a **generic blob with a vague notch** cloned across meanings. Solve each object fresh; copy a *technique*, never a silhouette.
- ❌ **idle animation on the wrapper / an ancestor** (B6).

Standard to hold to: 纸飞机 / 钟 — a multi-part handmade object you'd want to pick up. If it looks like an icon-font glyph, start over from the object.

---

## § D — Render and look (mandatory finish)

```bash
open ~/.claude/skills/morii-charm/charms-gallery.html
```
Paste your draft into the empty dashed card (top-left corner), then:
- **Toggle light ⇄ dark** — do the materials survive both?
- **56px, not zoomed** — does the silhouette read as the object? Does the signature detail name it?
- **Watch a full loop** — does the motion depict the verb? Calm (breathing), not buzzy? In-family?
- **Replay the entrance** — sticks on like the rest?

Fix, re-render, repeat. Done when it reads as the object in both themes and looks like it was always one of the ten.

---

## § E — Appendix: mounting onto a Morii capsule (plumbing, optional)

Only relevant inside the Morii repo — skip if you're just designing/animating the icon. A charm component is **pure template + scoped CSS, no logic**; props in, nothing else. Card mode `left:-24 top:-20 · 58px · -8°`; pill mode `left:-18 top:50% · 46px · translateY(-50%) rotate(-4deg) · inner scale(.8)`.
```vue
import { tintDot } from "../shell/components";        // key/hex → bare color
const accent = computed(() => tintDot(props.item.tint ?? "blue"));
<SnapShell shape="card" :tint="accent">
  <template #charm><CharmXxx :tint="accent" /><TypeStamp label="类 型" :tint="accent" /></template>
</SnapShell>
```
`SnapShell` renders `#charm` **outside** the card's `overflow:hidden` so it can overflow the corner; hit-test rect is expanded ~24px. New file → `src/panel/capsule/charms/CharmXxx.vue`. Full contract: ADR `docs/adr/0150-*.md`.

## Reference files
- `charms-gallery.html` — 10 charms animating, light+dark, + a slot to render your draft. Exemplar **and** render harness.
- `references/catalog.md` — per-charm teardown (object · parts · tricks · verb-loop) + patterns to harvest.
