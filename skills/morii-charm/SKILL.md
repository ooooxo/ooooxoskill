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

And the two that decide whether you even have the right idea:

4. **Depict the verb, not a symbol.** The icon *is* the action's object, doing the action. This is §A.
5. **同族靠工艺，不靠长相 (family by craft, not by likeness).** Unity comes from the *fixed* layer — depth kit, materials, stick-on entrance, wrapper geometry. Identity comes from the *free* layer — object, silhouette class, moving part, rhythm. Copy the fixed layer verbatim; make the free layer collide with nothing (§A2, §B3, gate at §B7). A tray of eleven near-identical rocking blobs is a failure of this law, and it is the one currently under repair.

---

# § A — 设计联想: from function to object

This is where most charms are won or lost. Before a single div, you decide **what thing to draw**.

## A1. 发散再收敛 — never answer with the first object

Name the function as a **verb**, then find the physical object that performs that verb. Not a symbol *for* it — the *thing itself*.

But **one candidate is not a design decision.** The single biggest cause of look-alike charms is stopping at the first object that "works" — which is always the one nearest the shipped ten. So:

**Generate ≥5 candidates from ≥4 different 物件域, before judging any of them.** Force one per domain:

| 物件域 | examples of the domain (not answers) |
|---|---|
| 文具桌面 | note, envelope, clip, stamp, ruler, ink bottle, rubber stamp |
| 机械工具 | crank, valve, clamp, gauge, scale, bellows, key |
| 容器包装 | jar, box, tin, basket, drawer, thermos |
| 生物 | bird, fish, cat paw, plant, egg, snail |
| 自然天象 | cloud, drop, flame, stone, wave, moon |
| 乐器发声 | bell jar, tuning fork, music box, whistle, drum |
| 厨房食物 | kettle, cup, pot lid, jar of jam, teabag |
| 织物柔软 | ribbon, curtain, flag, pouch, hammock, thread spool |
| 载具交通 | plane, boat, cart, elevator, rail signal |
| 老式电器仪表 | cassette, dial phone, thermometer, meter needle, film reel |
| 建筑家具 | door, window, lamp arm, mailbox, drawer unit, ladder |

Then cut:
1. **Kill glyphs.** bell / gear / chat-bubble / magnifier / lightbulb / check / heart / cloud-with-arrow = icon-thinking. Out.
2. **Kill anything the family already owns** (clock·note·donut·ballot·plane·gift·bot·envelope·inbox·radar) *and its near-neighbors* — another box that receives, another disc that scans, another sheet of paper. If your candidate could be described as "like CharmX but for Y", it's dead.
3. **Kill the silhouette-saturated** (A2).
4. Of what survives, keep the one that scores best on: 剪影独特 · 动作自明 · ≤6 divs.

**The child test:** could a child point at your object and *name the action*? If yes, you have a charm.

## A2. 剪影配额 — the silhouette class must not already be full

The family's outlines are heavily concentrated. Count before you draw:

| 剪影类 (silhouette class) | 已占用 | status |
|---|---|---|
| 正圆盘 disc | clock · donut · radar | **满 — 不再接受** |
| 方盒 box | ballot · gift · inbox · bot | **满 — 不再接受** |
| 纸片 flat sheet | note · envelope | 快满（≤1 more） |
| 三角折面 wedge | plane | open |
| 细长竖立 tall/thin | — | **空** (bottle, candle, pen, tower, thermometer, key) |
| 软垂坠 soft/hanging | — | **空** (ribbon, curtain, pouch, teabag, hammock) |
| 有机不规则 organic | — | **空** (plant, stone, fruit, bird, flame) |
| 铰接多关节 articulated | — | **空** (scissors, clip, lamp arm, folding ruler, tongs) |
| 堆叠层 stacked | — | **空** (books, plates, cassette stack, coins) |
| 开放框架 open frame | — | **空** (cage, easel, tripod, wire basket) |
| 液体/颗粒容器 vessel | — | **空** (hourglass, beaker, cup, kettle) |
| 缠绕穿线 spooled | — | **空** (reel, spool, knot, wound cord) |

Rules: **max 2 per class.** A full class is only allowed if an attached part **breaks the outline** — a spout, handle, cord, legs, arm, tail — so the black silhouette is no longer that class. Prefer an empty row: an hourglass or a lamp arm carries more meaning at 56px than the fifth rounded box, precisely because nothing else in the tray looks like it.

**剪影测试 (do it in your head before any CSS):** fill your object solid black. Line it up against the ten. If it merges with any of them, you have the wrong object — not a styling problem.

## A3. Reduce to 3–6 parts, one of which is the "signature detail"

Decompose the object into the fewest stacked pieces that still read:
- a **body** (the mass),
- a **lid / highlight** (catches light, adds volume),
- **the signature detail that NAMES it** — clock hands, envelope flap, radar blips, ballot slot. This is the part that says *what this is* and tells it apart from its neighbors. Pick it deliberately.
- plus shadow moves.

More than ~6 parts and it turns to mush at icon size. If you can't get it under six, the object is too complex — pick a simpler one for the same verb.

## A4. Object must pay twice — silhouette *and* motion

The object you keep should carry two payloads:
- a **silhouette** unmistakable at 56px, and
- a **natural motion** that *is* the verb — the object doing its job, not the object nodding.

If it has a great shape but no inherent motion, it may be a *quiet* charm (a real choice — B4). If it has neither, it's the wrong object; go back to A1's candidate list, not to the CSS.

Two functions must never get look-alike objects. If two would share an object (send vs receive both = a box), split them by **shape** (paper plane vs open box) or by **motion direction** (slip goes *in* the ballot vs letter peeks *out* of the envelope — same z-trick, opposite verb). A blob-with-a-vague-notch reused across meanings is the failure mode. Final check happens at the differentiation gate (§B7).

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

## B3. 从物理推动作 — derive the motion, don't shop for one

The idle loop depicts the object **doing its job**. But *do not open a list of existing loops and pick one* — that is how every charm ends up rocking ±6°. Derive it in four answers, then look for the CSS that produces it:

1. **谁在推它 (the driver)** — gravity · a hand · a motor · wind · a spring · heat · a signal · liquid · someone inside · nothing (quiet). The driver decides the easing before you write a single keyframe.
2. **哪个零件动 (the moving part)** — ⚠️ usually **not the whole body**. Prefer the hinge, the contents, the passenger, the needle, the cord, the shadow. *Whole-body rock/bob is the family's most overused move and now needs a written justification.* If the honest answer is "the body wobbles", you probably haven't found the object's real mechanism.
3. **哪个属性承载 (the property)** — from the menu below. If it's `transform: rotate` or `translateY` again, check the occupancy table first.
4. **什么节奏包络 (the envelope)** — from the menu below, and it must not clone a neighbor's.

### Property menu (what actually changes) — no paste-ready code on purpose

| property | reads as |
|---|---|
| `rotate` at an in-body hinge | lid, flap, door, jaw opening |
| `rotate` with `transform-origin` **outside** the box | orbit, pendulum, swinging on a cord, an arm sweeping |
| `translate` on one axis | drop, slide, feed, rise |
| two-axis translate with offset phases | drift, float path, wobbling ascent |
| `scale` from a base origin | squash-stretch, breathing, inflating |
| `scaleY` hinged at an edge | a mouth opening, a page lifting, a shutter |
| `skew` | drag, jelly, wind-load, a soft body resisting |
| `clip-path` / `inset()` animated | **fill level**, wipe, reveal, progress, tearing, liquid line |
| `border-radius` morph | soft body, melt, a drop forming |
| `background-position` | scrolling tape, film travel, texture moving under a window |
| `conic`/`linear-gradient` angle | sweep, heat travel, charge |
| `width` / `height` | a bar growing, a string tensioning, a spring compressing |
| staggered `opacity` across N children | a traveling pulse, queue, marquee, ripple |
| `filter: blur / brightness` | steam, focus pull, a throb of heat |
| `box-shadow` spread | emissive throb, a contact shadow that tracks weight |
| `rotateX/Y` + `perspective` | a card flipping, a page turning, tumbling |
| `steps(n)` on anything | mechanical tick, flip-clock, typewriter, a needle jumping notches |
| **shadow moves, object still** | weight and altitude, with zero motion on the body |
| counter-rotation of two parts | a gimbal, a spinning thing on a moving base |

### Envelope menu (the rhythm shape) — occupancy noted

| envelope | 已占用 | feel |
|---|---|---|
| 响一阵歇一阵 burst-rest | clock · note | alive, not frantic |
| continuous linear spin | radar · clock-second-hand | scanning, machinery |
| bounce with squash-stretch | gift | excited, cartoon |
| one-shot travel + reset | ballot · inbox | a thing going in / falling |
| slow peek + settle | envelope | something wants out |
| synced dual loop (2 leaves, same period) | plane · radar · clock · gift | sells physics |
| **呼吸 breathe** (slow symmetric swell) | — 空 | resting, warm, idling |
| **staccato `steps()`** | — 空 | mechanical, counting, ratcheting |
| **蓄力慢+突然弹 (asymmetric ease)** | — 空 | tension release, snap, a latch |
| **drift + micro-jitter** | — 空 | floating, buoyant, unstable |
| **traveling stagger across parts** | — 空 | a wave passing through, wind, a queue |
| **hold-frame** (long freeze, one quick pose change) | — 空 | patient, deadpan, a blink |
| **double-beat then long rest** | — 空 | a heartbeat, a knock, a stamp |

Prefer an empty row. Two charms sharing an envelope is the ceiling.

### Tempo comes from mass, not from a fixed range

| the object is | period + curve |
|---|---|
| 轻 (paper, feather, fabric, steam) | 2.6–3.6s, ease-out, overshoot allowed |
| 中 (everyday desk object) | 3.6–4.6s ease-in-out |
| 重 (metal, stone, machinery) | 4.5–6s, slow start, heavy settle, **no** overshoot |
| 齿轮驱动 gear-driven | `steps()`, no easing at all |
| 连续扫描 continuous scan | 2.5–4s `linear` |

Start delay ~0.8–2s, **varied per charm** — a shared 1.4s makes the whole tray clap in unison. One gesture per charm. It should *breathe*, not buzz.

### Techniques worth stealing (mechanism, not choreography)

- **z-order narrative** — put the moving piece *behind* the container and slide it toward the seam: behind→down = *into* (ballot slip, inbox sheet); behind→up = *peeking out* (envelope letter). The occlusion **is** the meaning. Reuse the trick freely; do not reuse the same in/out gesture a third time without a new direction (sideways feed, diagonal, through a hole).
- **Layer follow-through** — loose parts lag the body on a second keyframe at the same period, phase-shifted.
- **Phase = `animation-delay`** — same period on two leaves, offset delay, and they read as cause-and-effect (beam passes → blip lights).

⚠️ **Do not copy a shipped keyframe and rename it.** Renamed `ringburst` / `giftjump` / `slipdrop` is the exact failure the family is suffering from. Read `references/catalog.md` **after** you've committed to a driver + moving part + envelope — as an exclusion check, not as a starting point.

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

## B7. 差异化闸门 — run this before you ship (the anti-clone check)

What must be **identical** across the family (family glue — copy verbatim): wrapper geometry B0 · the depth kit B1 · the stick-on entrance B5 · the leaf-node law B6 · the material palette B1.

What must be **different** from every shipped charm. Score your draft against each of the ten on five axes:

| axis | your draft |
|---|---|
| 剪影类 silhouette class (A2) | |
| 主材质 dominant material | |
| 动的零件 which part moves | |
| 承载属性 property | |
| 节奏包络 envelope | |

**≥3 axes matching any single shipped charm → it's a clone. Redesign, don't restyle.** Exactly 2 matching is the ceiling and only if neither is 剪影类 + 节奏包络 together.

---

## § C — Build loop (every charm)

1. **§A1: ≥5 candidate objects from ≥4 domains**, kill glyphs / family-owned / saturated silhouettes, keep the best. (Child test + 剪影测试.)
2. **§A3: 3–6 parts + the signature detail.**
3. **§B3 first, before any CSS: driver → moving part → property → envelope → tempo from mass.** Write the four answers down. (Or decide it's quiet, §B4.)
4. **§B0/B1: wrapper skeleton + depth kit.** Tint one surface, rest = honest material.
5. **§B2: build the silhouette** from primitives.
6. **Implement the loop you derived** in step 3 — leaf nodes only. No renamed shipped keyframes.
7. **§B5: stick-on entrance + reduced-motion off.**
8. **§B7: run the differentiation gate.** ≥3 matching axes → back to step 1.
9. **§D: render at 56px, light + dark, on a card. Fix. Repeat.**

---

## § Banned — each = falling back to icon-thinking

- ❌ a **flat SVG icon** / icon-in-a-tile (that's morii-icon's job — a *different* style).
- ❌ a **plate / disc / rounded-square under an icon**; a 底盘+边框 tray. The object is its own body.
- ❌ an **abstract geometric primitive** (clip-path bare star, gradient sphere, floating symbol). Find the real object.
- ❌ **colored border / colored shadow.** Shadows neutral black.
- ❌ a **generic blob with a vague notch** cloned across meanings. Solve each object fresh; copy a *technique*, never a silhouette.
- ❌ **idle animation on the wrapper / an ancestor** (B6).
- ❌ a **renamed shipped keyframe** — `ringburst`/`giftjump`/`slipdrop`/`planefloat` pasted with new numbers. Derive the motion (B3), then write it.
- ❌ **第四个正圆盘 / 第五个方盒** — a saturated silhouette class with nothing breaking its outline (A2).
- ❌ **whole-body rock/bob as the default life-sign.** If the body wobbles because you couldn't find a moving part, the object is wrong or unexamined (B3 step 2).
- ❌ **everything at the same tempo** — a tray where all charms breathe on ~4s/1.4s-delay reads as one animation applied ten times (B3 tempo).

Standard to hold to: 纸飞机 / 钟 — a multi-part handmade object you'd want to pick up. If it looks like an icon-font glyph, start over from the object.

---

## § D — Render and look (mandatory finish)

```bash
open ~/.claude/skills/morii-charm/charms-gallery.html
```
Paste your draft into the empty dashed card (top-left corner), then:
- **Toggle light ⇄ dark** — do the materials survive both?
- **56px, not zoomed** — does the silhouette read as the object? Does the signature detail name it?
- **Watch a full loop** — does the motion depict the verb? Calm (breathing), not buzzy?
- **Replay the entrance** — sticks on like the rest?
- **扫视全墙 (scan the whole wall, don't stare at your card)** — with all eleven animating: does yours stand out as *a different object doing a different thing*, or does your eye slide over it as "another one of those"? Squint until they're black blobs — is yours still findable?
- **听节奏 (watch the wall's rhythm)** — is yours beating in unison with the others? Shift its period/delay/envelope until the wall reads as a desk of separate objects, not one animation ×11.

Fix, re-render, repeat. Done when it belongs to the family (same depth, same entrance, same materials) **and** no one could mistake it for any of the ten.

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
- `charms-gallery.html` — 10 charms animating, light+dark, + a slot to render your draft. **Render harness first, exemplar second** — its job is to show you what your charm must *not* look like.
- `references/catalog.md` — per-charm teardown (object · parts · tricks · verb-loop) + occupancy inventory. **Read it at step 8 (the differentiation gate), not at step 1.** Reading it before you've picked your own object is exactly how charms get homogenized: it is an exclusion list, and a source of *mechanisms* (hole-punch, z-occlusion, metal gradient) — never of silhouettes or choreography.
