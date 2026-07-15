# LAB mode — interactive experiment card · load on demand

Read only when about to answer an 「取决于参数/场景」 question with a hands-on experiment (scenario row ②). Needs the LIVE channel only for multi-round (`LIVE.md`).

For questions where the honest text answer is "看情况 / 取决于参数" — offer a hands-on lab instead of more prose.

**Propose only when all three hold:**
1. The answer genuinely depends on scenario/parameters (you caught yourself writing 取决于 / trade-off / 一般来说).
2. The behavior reproduces faithfully in ONE offline file — algorithms, CSS/interaction effects, geometry/physics, parameter curves. No backend, network, or real data.
3. ≥1 user-manipulable variable yields insight prose can't: draw the obstacles, drag the slider, move the mouse. 30 seconds hands-on beats three paragraphs.

**Never** for fact lookups, single-answer questions, behavior needing a real environment (network latency, GPU perf), or mid coding/debug. ONE proposal per topic; a no is final.
**How**: finish the normal answer, append ONE quantified line — 「可出一张可操作实验卡：画障碍实测 A*/Dijkstra/Greedy 三种寻路，要吗?」. Build only on yes. Explicit demo asks ("做个 demo 让我试") skip the question.
**Anatomy**: live readout stat row → full-width stage (`cursor:crosshair`, `touch-action:none`, hint line allowed) → comparison bar/readout → reset button + ONE caption of instructions. Controls = segmented pills / sliders beside the stage.
**Rule deltas from data cards**: no data-collection step (define variables, map each to a control) · runtime loops allowed (rAF is the simulation; entrance still `--ez`) · stage geometry may change (it IS the experiment) · compared modes take versus hues. Everything else holds — **read DESIGN.md + SNIPPETS.md before the Write, build on the skeleton**, neutral page bg, design-token vars, one accent, graphic-first, ≥1 real interaction. The generic AI-demo look (gradient page bg, white rounded container, loose multiline CSS) is a violation, not a style. No emoji, real handlers, light-dark, `tabular-nums`, single file.
