# Morii States — loading, empty, density, explanation, failure

> **Read** when there is async data, a region that may be empty, anything that can fail while the screen stays usable, or a line of explanatory grey text about to be written.

## 1. Three states, and the shell paints first

**Loading → empty → content**, cross-faded — never a hard cut, never a white flash. Miss one and the screen is half-finished.

**Paint the interface first, fetch second.** Frame, headings, column headers, labels, tab bars and containers render on the first frame; only the slots that hold fetched values show loading, and the data fills a layout that never moves.

- Never wrap a whole view in `if (loading)` — it hides structure the app already knew and makes every fetch look like a cold start.
- Reserve each slot's height (from the content that is coming), so filling in shifts nothing.
- **One indicator per range that one request fills** (a table body, a tab, a dashboard's data region) — several blinking together read as broken.
- A refetch (filter, page, sort) keeps the current rows in place, dimmed, under the same headers.
- Applies to every async source — HTTP, local DB, IPC, workers, lazy-loaded views.

## 2. Loading — so light it barely intrudes

The more prominent an indicator, the longer the wait feels.

- **Under ~300ms, show nothing** (attach after a 250–300ms delay). A partial refresh keeps the old content, slightly dimmed.
- **Form:** shape known (rows, tables, cards) → skeleton · shape unknown → a thin ring · longer than ~3s → a determinate bar plus one status line.
- **A ring:** 14–16px inline, 16–24 in a block, ≤28 for a page; `--ink-4` (never darker than `--ink-3`); no track; a ¼–⅓ arc; 0.9–1.2s per turn; no text, no pulse, no shadow. Inside a button it follows the button's ink.

```css
.spinner{width:18px;height:18px;animation:spin 1s linear infinite}
.spinner circle{fill:none;stroke:var(--ink-4);stroke-width:1.8;stroke-linecap:round;stroke-dasharray:18 52}
@keyframes spin{to{transform:rotate(360deg)}}
```

## 3. Empty state — explains, holds no button

- A flat graphic sized to its container (~40 in a block, 56–72 for a page, one step fainter than `--ink-4`) + **≤12 字** of grey copy. Never a bare 「暂无数据」.
- **No primary button** — the action already has a home (the top bar, the "new" control above the list); a second entry point turns quiet space loud. Exception: a first-run page where this *is* the only screen.
- Genuinely centered, then optically lifted. When it won't center, the usual causes are: the parent has no definite height · a flex parent still `align-items: stretch` · an inline SVG's baseline gap.

```css
.empty-wrap{display:grid;grid-template-rows:1fr auto 1.2fr;justify-items:center;min-height:240px;text-align:center}
.empty-wrap>.empty{grid-row:2}
.empty-wrap svg{display:block;margin-bottom:var(--sp-3)}
```

## 4. Content density

- **Content floor:** never carry less substance than a plain-text answer would — summaries and details already gathered are data, not decoration.
- The essentials are visible without hover or scroll; only the secondary goes into folds and layers.
- In data regions, text exists as atoms — headings ≤3 words, labels ≤6 字, chips ≤7 字, at most one grey line per region, no paragraphs (long-form excepted).

## 5. Explanation takes no row — one ⓘ, one tooltip

A permanently parked "let me just mention this" grey line helps once and is noise every time after, while occupying a full row:

```
✗  [给这台机器起个名____]  [签发]
   离开这台机器等于交出账户权限，吊销即刻生效
✓  访问令牌 [账户级] ⓘ          ← hover / focus reveals it
   [给这台机器起个名____]  [签发]
```

- A 14–16px neutral ⓘ beside the thing it explains; the tooltip opens on hover **and** focus, never steals focus; touch taps the icon.
- **Fold** explanations, risks, scope, limits — what will happen. **Keep resident:** the consequence of a destructive action, an input format, the current status (why this is empty or disabled, when it last synced).
- One or two ⓘ per surface at most — more is documentation, which belongs behind one link. Anything a later layer already says, the earlier one doesn't repeat.

## 6. Failure notices — human on the surface, diagnostics behind hover

Build **one notice component per product**; a second hand-rolled warning bar is a defect.

**The machine's text is not the surface text.** Exceptions, `http_listen 127.0.0.1`, `Bad_NotConnected`, `HTTP 502` were written for whoever debugs the system. Write the surface line in the operator's words; the raw string lives behind an ⓘ or a small failure mark, verbatim.

```
✗  工业平台连不上（由于目标计算机积极拒绝，无法连接。） —— 先确认引擎起没起、以及它的 http_listen 是不是还锁在 127.0.0.1
✓  ⚠ 工业平台连不上  ⓘ          ← the raw engine string on hover / focus
     先在「接入配置」里把引擎地址填对
```

- **At most two lines:** what happened, and the one thing this user can do. Nothing they can do → one line.
- A curated business message is human text — use it verbatim (「令牌无效」「本月已结账，改不动了」). The test is *who the sentence was written for*, not which layer sent it.
- Enum and status codes never reach the screen: map them (`good` / `uncertain` / `bad` → 「正常」「读数存疑」「读数不可信」); an unmapped value falls through raw rather than being hidden as 「未知」.
- `aria-label` carries the human sentence; the raw string belongs to the tooltip.
- **Problem and fix are two facts, so two lines** — never glued with `——` / `·` / `|`. Upstream text that arrives glued is split at the connector inside the component; a validator's model carries `text` + `hint` so the fix is never written into the problem.
- **One notice per cause.** Two requests failing from one outage produce one loud notice; the other region falls back to its quiet empty state, worded by the cause (「平台连不上，问不到报警」, never 「暂无数据」).
