# Leaderboard — ranked named entities (featured spotlight + ranked bars)

Full verified pattern: **`examples/leaderboard.html`** — copy its skeleton, swap data/accent; read it, don't re-derive. **Next tool call after the reads = the Write.**

Shape: a **spotlight** for the selected entity (rank badge + name + big value + share% + rank-delta chip + its **trend sparkline** with single-hue area fade) above **ranked rows** — each row = rank + name + delta chip + leader-relative bar (fill = value/max) + value. **Tap any row → it features in the spotlight** and its bar becomes the lone accent bar (`.row.on .bar i{background:var(--a)}`); every other bar stays muted gray = one loud thing. Default feature = rank 1. The sparkline draws in (`strokeDashoffset` from `getTotalLength()`); rank-delta chips reuse `--up/--dn` (`--up:light-dark(#15803d,#4ade80);--dn:light-dark(#b91c1c,#f87171)` in `:root`). ≤8 rows on the face; more → expand or RICH. Solid fills only — no gradient bars/panels/glow.

A plain category bar chart that isn't named-entity ranks → use `charts/bars.md` instead.
