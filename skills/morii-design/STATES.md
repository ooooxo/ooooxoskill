# Morii States — content states · text density · the explanation layer · failure notices

> **When to read:** the page has async data, regions that may be empty, **something can fail while the screen stays usable**, or you are about to write a line of explanatory gray text.

---

## 1. Async always runs three states

**Loading → empty → content.** Miss one and it is half-finished. Content arrives as a **cross-fade**, never a hard cut. No white screens, no flashes.

## 1b. The interface never waits on the request

**Iron rule: paint the interface first, fetch second.** The shell — page frame, headings, table column headers, card containers, tab bars, KPI labels, empty slots at their reserved size — renders on the **first frame**, before any request resolves. Only the **slots that hold fetched values** carry a loading state, and the data is then **filled into** a layout that never moved.

```
✗  request → (blank page / one big spinner) → whole screen appears at once
✓  interface → request in flight → data slots show loading → values fill in
```

- **Never gate the shell on `await`.** `v-if="loading"` (or its equivalent) wrapped around an entire view is this rule's violation: it hides structure the app already knew at build time, and makes every fetch look like a cold start.
- **The reserved slot is the point.** A slot that collapses when empty is not a rendered interface — give the figure line, row area, and card body a `min-height` derived from the content that is coming, so filling in causes **zero layout shift**.
- **One ring per range that is filling, not per empty slot.** Take the range from what one request feeds: a table's row area, a tab's body, a dashboard's whole data region. Multiple rings blinking together read as a broken screen. If several ranges resolve from the same request, put one ring on their common container (a page header is a legitimate place for it).
- **Structure the app owns is never a loading state.** Column headers, section titles, and fixed labels come from the schema, not the server — showing them immediately also tells the user *what* is coming, which is the one job the skeleton did well.
- **A refetch is not a cold start.** Filters, paging, and sorting keep the already-rendered rows in place (dimmed) or swap them under the same headers; they never return the view to its first-load appearance.
- Applies to every async source, not just HTTP — local DB reads, IPC, workers, and lazily-imported views obey the same order.

## 2. Loading — the goal is "so light it barely intrudes"

A loading indicator is a polite "one moment," not a performance — **the more prominent it is, the longer the wait feels.**

What follows is **criteria and ranges, not fixed parameters**: pick values from container size, information density, and how often it appears. You just have to be able to say why.

**First judgment: show it at all?**
Under **300ms, show nothing** (attach it after a 250–300ms delay) — a spinner that flashes is more annoying than no spinner. For a partial refresh where content already exists, **keep the old content and drop its opacity slightly**; do not clear the block.

**Second judgment: which form?**

| Situation | Form | Why |
|---|---|---|
| Shape is **known** (list rows, tables, cards) | **skeleton** | it also previews what is coming, and is quieter |
| Shape is **unknown**, whole block | ring indicator | there is no structure to preview |
| Task takes **>3s** | determinate progress bar + one status line | short tasks never get copy |

**Third judgment: how light?** Tune a ring indicator toward "light" on these axes:

| Axis | Range | Overshoot looks like |
|---|---|---|
| Size | inline 14–16 · block 16–24 · full page ≤28 | prefer too small over too large |
| Ink step | no darker than `--ink-3` (default `--ink-4`) | accent belongs only to a button's submit state |
| Track | prefer none at all (if needed, the `--hover` step) | a solid track is loud |
| Arc length | 1/4–1/3 of the circumference | shorter is lighter; too short and the rotation stops reading |
| Speed | 0.9–1.2s per revolution | faster reads anxious, slower reads stalled |

No text, no pulse, no shadow.

**When to deviate:** marketing and onboarding pages may go bolder or use an illustration; a button's submit state follows the button's accent and text color; below 14px, drop the stroke to 1.2 and remove the round caps or it smears into a blob.

```css
/* Construction demo, not a template: dasharray comes from the arc ratio; take size and ink step from the criteria above. */
.spinner{width:18px;height:18px;animation:spin 1s linear infinite}
.spinner circle{fill:none;stroke:var(--ink-4);stroke-width:1.8;stroke-linecap:round;
                stroke-dasharray:18 52}          /* 18/(18+52) ≈ 26% arc, no track */
@keyframes spin{to{transform:rotate(360deg)}}
```

## 3. Empty state — it explains that this is empty, and holds no button

- **Two ingredients only:** a flat graphic + **≤12 字 of gray copy**. Graphic size follows the container (~40 for a small block, 56–72 full page), ink step pressed down to `--ink-4` and then one step of opacity lower. **Never a bare 「暂无数据」.**
- **No primary button.** An empty state is a **status explanation**, not a call to action — the action entry point stays where it already belongs on the page (the top bar's primary button, the "new" control above the list). Putting a button in the empty state gives one action two entry points and turns quiet whitespace loud.
  **Only exception:** the empty state *is* the only screen the user can reach (a first-run full-page empty state). There, that button *is* the page's primary action and is not a duplicate.
- **It must be genuinely centered, then optically lifted** (`FOUNDATION.md` §3 visual centering). Geometric centering is the most common failure. Three real causes, rule them out one by one: the parent has **no definite height** · the parent is flex and `align-items` is still the default `stretch` · **SVG defaults to `display:inline`, so its baseline gap makes it sit permanently low.**

```css
/* Construction demo: take min-height from the block's real height; do not copy 240. */
.empty-wrap{display:grid;grid-template-rows:1fr auto 1.2fr;justify-items:center;min-height:240px;text-align:center}
.empty-wrap>.empty{grid-row:2}                      /* free space split 1 : 1.2 = optical lift, no px nudge */
.empty-wrap svg{display:block;margin-bottom:12px}   /* block: kills the baseline gap */
```

## 4. Content density

- **Content floor:** the page carries **no less substance than a plain-text answer would**. Summaries, quotes, and details already gathered are data (they do not count against the shell budget) — never compress them into bare headings. The essentials go above the fold, the rest into a fold-out.
- **Important content is visible above the fold:** core information is visible by default, not hidden behind hover, not below the scroll. Only secondary content goes into folds and overlays.
- **Text as atoms:** in data regions, text exists only as atoms — headings ≤3 words · figures · labels ≤6 字 · chips ≤7 字 · at most one gray line per region. **No paragraphs in metric regions** (editorial long-form excepted).

## 5. Explanation takes no row — one line of copy = one ⓘ + a tooltip layer

The noise that grows most easily in an interface is the "let me just mention this" gray line, permanently parked under a form, at the bottom of a card, at the end of a dialog:

```
✗  [给这台机器起个名____]  [签发]
   离开这台机器等于交出账户权限，吊销即刻生效       ← read again every single time
```

It helps once. From the second time on it is pure visual noise, and it occupies **a full row of layout weight**. Attach it to the thing it explains and fold it into a tooltip layer:

```
✓  访问令牌 [账户级] ⓘ          ← hover/focus reveals the tooltip; one or two sentences
   [给这台机器起个名____]  [签发]
```

- **How to fold it:** put a **14–16px neutral icon** (ⓘ, or the glyph for that semantic) beside the title / control / chip being explained; trigger the tooltip on hover **and** focus (popover hover semantics: does not steal focus, does not trap, single hairline, no tray). Touch input taps the same icon.
- **Criterion — first ask what the sentence is:**
  - **Explanation, risk, scope, or limitation** about "what will happen before/after you do this" → fold it into the tooltip.
  - **Status** about "what the situation is right now" (why this is empty, why this button is disabled, when the last sync was) → keep it on the page; that is content, not annotation.
- **Three that must stay resident and may never be folded:** ① the consequences of a destructive action (the person has to see it before pressing); ② input format requirements (unread means filled in wrong); ③ current status (see above).
- **Density valve:** one or two ⓘ per surface, maximum. Three or more means you are stacking documentation into tooltips — that is documentation's job. Give one entry point that links out; do not spread it across the interface.
- **Say it once:** anything the confirmation or result layer already said, the preceding layer does not repeat.

## 6. Failure notice — the surface speaks the user's language, the diagnostics hide behind hover

A request failed, a device is unreachable, a link dropped — and the screen still has to be usable, so the failure gets a **resident notice** (a tinted bar, or one line in the region that failed). Two rules decide what it says. Build **one notice component per product** and reuse it; a second hand-rolled warning bar is the same defect as a second empty state.

### 6a. The machine's text is not the surface text

Backends, engines, drivers and SDKs return their own strings — socket exceptions, `http_listen 127.0.0.1`, `Bad_NotConnected`, `HTTP 502`, stack fragments. That text was written **for whoever debugs the system**, and it ends up on screen only because it happened to be the field that arrived in the payload. Write the surface line yourself, in the words of the person operating the screen, and let the raw string live behind a **hover/focus layer** (the ⓘ of §5, or a small failure mark) for the one person who needs it.

```
✗  工业平台连不上（由于目标计算机积极拒绝，无法连接。） —— 先确认引擎起没起、以及它的 http_listen 是不是还锁在 127.0.0.1
✓  ⚠ 工业平台连不上  ⓘ          ← ⓘ hover/focus reveals the raw engine string verbatim
     先在「接入配置」里把引擎地址填对
```

- **Two lines maximum:** what happened, and the one thing this user can do about it. Nothing they can do → one line.
- **A curated backend *business* message is human text — use it verbatim** (「令牌无效」「本月已结账，改不动了」). The test is **who the sentence was written for**, not which layer it came from.
- **Enum / status codes never reach the screen:** map them through a lookup (`good` / `uncertain` / `bad` → 「正常」「读数存疑」「读数不可信」). An **unmapped value falls through raw** — inventing 「未知」 hides the real state from the only person who could act on it.
- The accessible name (`aria-label`) carries the **human** sentence; the raw string is the tooltip's own content, not a second copy of the surface.
- Same line for empty states caused by a failure: 「平台连不上，问不到报警」, never 「暂无数据」 and never the exception.

### 6b. Problem and fix are two facts, so they are two lines

Never glue them with `——` / `·` / `|` / a chained clause — an error notice is **not** the "genuine prose sentence" exception in `FOUNDATION.md` §"Banned separator". The same holds for validation lists: what failed on one line, what to do on the next, one step dimmer.

```
✗  还没有分支 —— 至少要一条
✗  分支「审批」没有出线 —— 从它的连接点拖一条线出去
✓  还没有分支
     至少要一条
```

- **Upstream text arrives glued** (backends and validators love 「出事了 —— 怎么办」): **split it at the connector inside the component**, do not wait for the API to change its wording.
- Give the validator's data model a second field (`text` + `hint`), so the fix is never written into the problem string in the first place.
- **One notice per cause.** Two requests failing from the same outage produce **one** loud notice; the second region degrades to its quiet empty state (§3). That is §5's "say it once".
