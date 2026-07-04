# 角饰目录：10 件拆解 (charm catalog)

The 10 shipped charms, each read in three passes aligned to the two pillars in SKILL.md:

- **设计 (§A design association)** — what real object, and *why that object* for this function.
- **零件 (parts)** — the stacked divs it decomposes into + the signature detail.
- **动画 (§B animation)** — the CSS trick + the verb-loop (or why it's quiet).

Read this to see **how a specific object was faked out of divs** — the ring hole-punch, the bow border-radius, the squash-stretch keyframe are non-obvious and worth reusing. Source of truth = `src/panel/capsule/charms/Charm*.vue`; live versions animate in `charms-gallery.html`.

**But do not template.** Each charm is its own object solved fresh. Copy a *technique* (a gradient body, a z-order occlusion), never clone a silhouette into a new meaning — a blob-with-a-notch that "sort of" means the new thing is the failure mode (SKILL.md §Banned).

## Contents
1. [CharmClock 迷你钟 — 闹钟](#clock) · live
2. [CharmNote 折角便签 — 存为便签](#note) · live
3. [CharmDonut 裸甜甜圈 — 回复汇总](#donut) · **quiet/data**
4. [CharmBallot 投票箱 — 投票](#ballot) · live
5. [CharmPlane 纸飞机 — 发送](#plane) · live · card+pill
6. [CharmGift 礼物盒 — 更新可用](#gift) · live
7. [CharmBot 机器人头 — AI 占位](#bot) · **quiet (forced)**
8. [CharmEnvelope 信封 — 写简讯](#envelope) · live
9. [CharmInbox 开盖纸箱 — 接收](#inbox) · live · card+pill · active-gated
10. [CharmRadar 雷达屏 — 附近的人](#radar) · live

Shared by all: `position:absolute; z-index:3; left:-24 top:-20; ~54–58px; rotate(-8deg)` wrapper + the universal `*-on 450ms cubic-bezier(.18,1.42,.32,1) 240ms both` stick-on entrance + `prefers-reduced-motion` off. Only the differences are noted.

---

<a id="clock"></a>
## 1. CharmClock — 迷你钟（闹钟）
- **设计:** function = "remind me at a time" → an **alarm clock** (the object that tells time *and* rings), not a bell. Props `tint`, `time?` (default 10:08 = 表盘美学位).
- **零件 (7):** dial `.aring` (var(--panel-hi) disc + hairline + drop/inset shadow) · 4 `.tick` pills placed radially by `transform-origin:50% 25px` + `rotate(0/90/180/270)` · 3 hands (`.hh/.mh/.sh`, `transform-origin:50% 100%`) · `.capdot` center cap. **Signature detail = the two hands pointing at the reminder time.**
- **动画:** hands rotate to the real time (`hour=((h%12)+min/60)*30`, `minute=min*6`); `.sh` sweeps `60s linear`; **the dial itself** carries `ringburst` (响一阵歇一阵: busy 0–24% then rest, `transform-origin:50% 8%` = rocks from the top like a hung bell). Two loops, two leaf nodes. Verb = telling time + alarming.

<a id="note"></a>
## 2. CharmNote — 折角黄便签（存为便签）
- **设计:** "save this" → a **paper sticky note**, dog-eared. Props: none — paper is paper, no tint.
- **零件:** `.paper` (yellow `#e5c86e`, light `#ecd27c`) · 3 `.nlines` ink pills (100/70/45%) · `.fold` corner via `clip-path:polygon(100% 0,0 100%,100% 100%)`. **Signature = the dog-eared fold + ink lines.**
- **动画:** `notesway` gentle ±2.6° rock, `transform-origin:50% 10%` = pinned at top like tacked on. Verb = a note fluttering where it's pinned.

<a id="donut"></a>
## 3. CharmDonut — 裸分段甜甜圈（回复汇总）  ·  QUIET
- **设计:** "summarize replies" → a **bare data ring** — the chart *is* the object (root 2: no chart frame). Props `segs:{color,frac}[]`.
- **零件:** `.dring` = a computed `conic-gradient` of segments,余量 filled `color-mix(in srgb, var(--ink) 18%, var(--panel))` (ink-on-panel, **not** context color) · `::after` 26px hole punched to `var(--panel)` + inset shadow. **Signature = the segmented ring itself.**
- **动画:** **none — quiet by design.** Data charms don't move; motion would imply the numbers are changing. The family's proof that "活物件" is a *choice*. Trick to steal: the hole-punch (`::after` filled with `--panel`) turns a solid disc into a real ring.

<a id="ballot"></a>
## 4. CharmBallot — 投票箱（投票）
- **设计:** "take a vote" → a **ballot box** with a slip going in. Props `tint`.
- **零件 + z:** `.slip` white ballot (z0, tint check via `::after` two borders rotated -45°) < `.btop` lid (z2) · `.bbody` box (z2, `radius 0 0 7 7`) < `.bslot` dark slot (z3). **Signature = the slot + the slip.**
- **动画:** `slipdrop` moves the slip down 17px — because it's **z0 behind the lid**, sliding down reads as *dropping into the box*, then fades/resets. **z-order does the storytelling.** Verb = casting a vote.

<a id="plane"></a>
## 5. CharmPlane — 纸飞机 + 地影（发送）  ·  card + pill
- **设计:** "send over LAN" → a **paper airplane** + ground shadow. Props `mode`; fixed paper (no tint).
- **零件:** `.fly` = `.p1` body (`linear-gradient(135deg,#f4f1ea,#c6c2b8)` + `clip-path` triangle) + `.p2` fold-shadow (darker wedge) · `.psh` blurred ellipse ground shadow. **Signature = the folded-triangle silhouette + the cast shadow.**
- **动画:** **synced dual loop** — `planefloat` drifts the plane up/left+tilt while `planeshadow` scales the ellipse down + fades on the *same period* → "flies higher, shadow smaller." pill mode: 46px, shoulder contract, inner `scale(.8)`. Verb = a plane taking off.

<a id="gift"></a>
## 6. CharmGift — 礼物盒（更新可用）
- **设计:** "a new version is out" → a **gift box** that bounces with anticipation. Props `tint`.
- **零件:** `.gbody` (tint gradient box) · `.glid` (lit lid) · `.grib` (bright ribbon, `tint 42% #fff`) · `.gbow` (bow via `::before/::after`, 异形 `border-radius:65% 35% 25% 60%`, right ear mirrored `scaleX(-1)`). **Signature = ribbon + bow.**
- **动画:** `giftjump` = the full **squash-stretch** (蓄力压扁→起跳拉伸→落地挤压→回弹, `transform-origin:50% 92%`); separately `lidpop` lifts lid+bow at the apex = **layer follow-through**. Two loops, same 4.6s period, phase-tuned. **The bounce study — copy this keyframe for any excited object.** Verb = a present bouncing.

<a id="bot"></a>
## 7. CharmBot — 机器人头（AI 占位）  ·  QUIET (forced)
- **设计:** "the AI assistant" → a **metal robot head**. Props `tint` (drives eye + antenna glow).
- **零件:** `.bhead` (metal `linear-gradient(#f0f1f4,#c0c4cd)`, triple inset/drop shadow) · `.bvisor` (near-black inset) · 2 `.beye` (tint, `box-shadow:0 0 5px tint` glow) · 2 `.bear` · `.bant`+`.bdot` (antenna light). **Signature = visor + glowing eyes.**
- **动画:** **fully static — not by taste but by constraint.** Its host AI card morphs/collapses on the transparent window; an infinite layer there caused ghost frames (2026-07-03 二分实锤). See SKILL.md §B6. Tricks to steal: metal = light-top gradient + `inset 0 2px rgba(255,255,255,.75)` top edge; emissive = `box-shadow:0 0 Npx tint`.

<a id="envelope"></a>
## 8. CharmEnvelope — 信封（写简讯）
- **设计:** "compose a message" → an **envelope** with a letter peeking out. Props `tint`.
- **零件 + z:** `.epaper` letter (z0, white, top ink lines via `::after` + `box-shadow:0 5px 0` copy) < `.ebody` body (z1, tint gradient) < `.eflap` triangle flap (z2, `clip-path:polygon(0 0,100% 0,50% 100%)`). **Signature = the flap + the letter.**
- **动画:** `paperpeek` nudges the letter up 5px — z0 behind the body, so it reads as *peeking from inside*. Same z-occlusion as Ballot, opposite direction (out vs in). Verb = a message wanting out.

<a id="inbox"></a>
## 9. CharmInbox — 开盖纸箱（接收）  ·  card + pill · active-gated
- **设计:** "receive a file" → an **open cardboard box** catching sheets. Props `tint`, `mode`, `active`.
- **零件:** `.sheet` falling file (z0, white, 2 ink lines) · 2 `.flap` outward-folded lids (rotate ±34°) · `.mouth` dark slot · `.ibbody` box. **Signature = the open flaps + falling sheet.**
- **动画:** `aib-drop` runs only when `.on` (active) — file falls, lands, is occluded by mouth/body (z-order), fades. **Static state hides the sheet** (`opacity:0`) so a finished transfer shows a quiet box. Same shoulder contract as Plane in pill. Verb = receiving (only while transferring).

<a id="radar"></a>
## 10. CharmRadar — 雷达屏（附近的人）
- **设计:** "find people nearby" → a **radar scope**. The sharpest "轮廓随物体" case: a dark disc is legit *because that's what a radar screen is* (vs a banned dark plate under an icon). Props `tint`.
- **零件:** `.scr` dark scope (`radial-gradient` tint-glow → `#10141a`, edge via `inset 0 0 0 1.5px`, `overflow:hidden`) · 2 `.rring` range rings · `.beam` (`conic-gradient` 75° tail) · 2 `.blip` targets. **Signature = the sweep + the blips.**
- **动画:** `radarspin` rotates the conic beam `3.2s linear`; each `.blip` runs `blipping` on the **same 3.2s period** with a phase `animation-delay` (bp2 = 1.6s) so targets light *as the beam passes*. Verb = scanning, targets pinging.

---

## Cross-cutting patterns (harvest these)
- **z-order narrative (Ballot/Envelope/Inbox):** moving piece *behind* the container; sliding toward the seam reads as in/out. The occlusion is the meaning.
- **synced dual loops (Plane, Radar, Clock, Gift):** two leaf nodes, same period, phase/scale offset → altitude, beam+blip, tick+ring, jump+lidpop. One loop = flat; two synced = alive.
- **the 3-move depth kit (all tinted charms):** vertical gradient body + drop-shadow lift + inset underside, then a lit lid with `inset 0 1.5px rgba(255,255,255,.3)`.
- **material honesty:** paper `#f4f1ea`, note `#e5c86e`, metal `linear-gradient(#f0f1f4,#c0c4cd)`, screen `#10141a` — only *one* surface wears `--tint`.
- **hole-punch for rings (Donut):** solid disc + `::after` filled `var(--panel)` = a real ring showing the surface through it.
