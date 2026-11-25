/*
  干什么：动态稿的台子（dc ⑤½）—— 一段交互动效画成「一条时间轴 lin ∈ [0,1] 来回播」：正着放是进、倒着放就是原路退，
         中途打断就地掉头；分拍（beat）各走各的曲线、可从上往下错开；底部一条播放条（两头切换 · 慢放 · 循环 · 辅助层 · 逐帧滑杆）。
         一页只有一条时间轴：dc 里几格一起放，判的是同一瞬间。
  怎么用：<script src="/__lab/motion.js"> 之后 labMotion.define(名, 定义)，页面里放 <lab-motion name="名" opt='{"k":1}'></lab-motion>。
         单独一页（不挂 labStart）或 dc 档的 render 里返回这个元素都行。写法见 dc 的 MOTION.md。
  需要什么：对照版服务（/__lab/motion.js）；曲线读项目 token 的 --ease-in-out / --ease-out / --ease-soft，没有就用同值兜底。
*/
(() => {
  if (window.labMotion) return;

  /* ---- 曲线 ---- */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; }
      return Y(Math.min(1, Math.max(0, t)));
    };
  }
  function tokenEase(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    const m = v.match(/cubic-bezier\(([^)]+)\)/);
    const n = (m ? m[1] : fallback).split(",").map(Number);
    return bezier(n[0], n[1], n[2], n[3]);
  }
  let EASE = null;
  const ease = () => EASE ??= {
    io: tokenEase("--ease-in-out", "0.77,0,0.175,1"),   // 屏内 A→B
    out: tokenEase("--ease-out", "0.23,1,0.32,1"),       // 进出
    soft: tokenEase("--ease-soft", "0.22,1,0.36,1"),     // 要让人看见过程的进场
    lin: (x) => x,
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---- 一页一条时间轴 ---- */
  const T = { lin: 0, target: 0, slow: 1, loop: false, hold: 0, scrubbing: false, grab: false, guides: new Set(), last: 0 };
  /** 按一下要去的那一头：在一头上就去另一头；定格在半路就去远的那头 */
  const next = () => (T.target === 1 || (T.target > 0 && T.lin >= 0.5) ? 0 : 1);
  const defs = new Map();
  const live = new Set();
  const qs = new URLSearchParams(location.search);
  const DUR = () => Math.max(...[...live].map((el) => el.def.dur ?? 900), 300);

  function tick(now) {
    const dt = Math.min(64, now - (T.last || now));
    T.last = now;
    if (!T.scrubbing && T.lin !== T.target) {
      const step = dt / (DUR() * T.slow);
      T.lin = T.target > T.lin ? Math.min(T.target, T.lin + step) : Math.max(T.target, T.lin - step);
      if (T.lin === T.target) T.hold = now;
    } else if (T.loop && !T.scrubbing && now - T.hold > 700) T.target = 1 - T.target;   // 循环：两头各停一会儿再掉头
    for (const el of live) {
      if (!el.isConnected) { live.delete(el); continue; }
      el.draw(dt, now);
    }
    bar.sync();
    requestAnimationFrame(tick);
  }

  /* ---- 播放条：页底正中一条 ---- */
  const bar = {
    el: null,
    mount() {
      if (this.el) return;
      const st = document.createElement("style");
      st.textContent = [
        "lab-motion{width:100%;height:100%}",
        ".lm-bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:6px;padding:6px;border-radius:99px;background:var(--panel-strong,#202022);box-shadow:var(--shadow-pop,0 12px 32px rgb(0 0 0/.5)),0 0 0 1px var(--ring,rgb(255 255 255/.07));font:600 13px var(--font,system-ui)}",
        ".lm-bar button{height:30px;padding:0 13px;border:0;border-radius:99px;background:transparent;color:var(--ink-2,#c8ccd2);font:inherit;cursor:pointer}",
        ".lm-bar button:hover{background:var(--inset,#28282b)}",
        ".lm-bar button.on{background:var(--ink,#f3f4f6);color:var(--bg-content,#0d0d0f)}",
        ".lm-bar button.go{min-width:76px}",
        ".lm-bar input{width:240px;margin:0 8px;accent-color:var(--accent,#2f6bff)}",
        ".lm-bar .lm-t{width:34px;color:var(--ink-4,#5c626c);font:600 11px var(--font-mono,monospace);text-align:right;margin-right:6px}",
      ].join("\n");
      document.head.prepend(st);   // 放最前：页面自己的 lab-motion 尺寸能盖过它
      const el = document.createElement("div");
      el.className = "lm-bar";
      el.innerHTML = '<button class="go" data-k="go" data-tip="空格"></button><button data-k="slow" data-tip="L">慢放</button><button data-k="loop" data-tip="O">循环</button><span class="lm-guides"></span><input type="range" min="0" max="1000" value="0" data-tip="[ ] 逐帧"><span class="lm-t"></span>';
      document.body.appendChild(el);
      this.el = el;
      this.go = el.querySelector(".go");
      this.slow = el.querySelector('[data-k="slow"]');
      this.loop = el.querySelector('[data-k="loop"]');
      this.guidesEl = el.querySelector(".lm-guides");
      this.range = el.querySelector("input");
      this.t = el.querySelector(".lm-t");
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const k = b.dataset.k;
        if (k === "go") api.toggle();
        else if (k === "slow") T.slow = T.slow === 1 ? 4 : 1;
        else if (k === "loop") T.loop = !T.loop;
        else if (k.startsWith("g:")) api.guide(k.slice(2));
      });
      const r = this.range;
      r.addEventListener("pointerdown", () => (T.grab = true));
      r.addEventListener("pointerup", () => (T.grab = false));
      r.addEventListener("input", () => api.set(r.value / 1000));
    },
    guidesShown: "",
    sync() {
      if (!this.el) return;
      const ends = [...live][0]?.def.ends ?? ["起", "止"];
      const word = ends[next()];
      if (this.go.textContent !== word) this.go.textContent = word;
      this.slow.classList.toggle("on", T.slow > 1);
      this.loop.classList.toggle("on", T.loop);
      const all = new Map();
      for (const el of live) for (const [k, n] of Object.entries(el.def.guides ?? {})) all.set(k, n);
      const sig = [...all].join();
      if (sig !== this.guidesShown) {
        this.guidesShown = sig;
        this.guidesEl.innerHTML = [...all].map(([k, n]) => '<button data-k="g:' + k + '" data-tip="' + k.toUpperCase() + '">' + n + "</button>").join("");
      }
      for (const b of this.guidesEl.children) b.classList.toggle("on", T.guides.has(b.dataset.k.slice(2)));
      if (!T.grab) this.range.value = Math.round(T.lin * 1000);
      this.t.textContent = Math.round(T.lin * DUR() * T.slow) + "";
    },
  };

  /* 键：避开 dc 台子占用的（数字 ← → ↑ ↓ S R F M C A G T I P X ?）。辅助层的键由定义给 */
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea,[contenteditable]")) return;
    const fr = 16.7 / (DUR() * T.slow);
    if (e.key === " ") { e.preventDefault(); api.toggle(); }
    else if (e.key === "l" || e.key === "L") T.slow = T.slow === 1 ? 4 : 1;
    else if (e.key === "o" || e.key === "O") T.loop = !T.loop;
    else if (e.key === "[" || e.key === "]") { T.loop = false; api.set(clamp(T.lin + (e.key === "]" ? fr : -fr), 0, 1)); }
    else if (e.key === "Escape" && T.target) api.toggle();
    else {
      const k = e.key.toLowerCase();
      for (const el of live) if (el.def.guides && k in el.def.guides) { api.guide(k); break; }
    }
  });

  /* ---- 元素：<lab-motion name opt> ---- */
  class LabMotion extends HTMLElement {
    connectedCallback() {
      if (this.def) return void live.add(this);
      const def = defs.get(this.getAttribute("name"));
      if (!def) { this.textContent = "labMotion：没有定义「" + this.getAttribute("name") + "」"; return; }
      this.def = def;
      this.opt = JSON.parse(this.getAttribute("opt") || "{}");
      /* 骨架的样式写在元素上：dc 里它在影子里，页头那张表进不去。尺寸归页面（影子里由档的 css 给） */
      Object.assign(this.style, { display: "block", position: "relative", overflow: "hidden" });
      const sc = document.createElement("div");
      sc.className = "lm-scene";
      Object.assign(sc.style, { position: "absolute", left: "0", top: "0", transformOrigin: "0 0" });
      sc.style.width = def.scene.w + "px";
      sc.style.height = def.scene.h + "px";
      sc.innerHTML = def.html(this.opt);
      this.appendChild(sc);
      this.sceneEl = sc;
      this.scale = 1;
      const fit = () => {
        const r = this.getBoundingClientRect();
        if (!r.width || !r.height) return;
        this.scale = Math.min(r.width / def.scene.w, r.height / def.scene.h);
        sc.style.transform = "translate(" + (r.width - def.scene.w * this.scale) / 2 + "px," + (r.height - def.scene.h * this.scale) / 2 + "px) scale(" + this.scale + ")";
      };
      new ResizeObserver(fit).observe(this);
      fit();
      const q = (sel) => sc.querySelector(sel);
      this.frameFn = def.setup({ root: sc, host: this, opt: this.opt, q, qa: (sel) => [...sc.querySelectorAll(sel)] });
      bar.mount();
      live.add(this);
      if (!T.last) requestAnimationFrame(tick);
    }
    disconnectedCallback() { live.delete(this); }
    draw(dt, now) {
      const E = ease();
      const lin = T.lin;
      /** 拍：时间轴上 [a, b] 这一段的进度，过曲线；i / n / stagger 给一组从前往后错开（stagger 占这一拍的份额） */
      const beat = (a, b, o = {}) => {
        let p = clamp((lin - a) / (b - a), 0, 1);
        if (o.n > 1 && o.stagger) p = clamp((p - o.i * o.stagger) / (1 - (o.n - 1) * o.stagger), 0, 1);
        return (typeof o.ease === "function" ? o.ease : E[o.ease ?? "io"])(p);
      };
      this.dataset.guides = [...T.guides].join(" ");
      this.frameFn({ lin, dt, now, dir: Math.sign(T.target - lin), beat, ease: E, lerp, clamp, guide: (k) => T.guides.has(k), scale: this.scale });
    }
  }

  const api = {
    /** 定义一段动态稿。scene {w,h} 设计尺寸（等比缩进容器）· dur 一程毫秒 · ends [起点名, 终点名] · guides { 键: 名 } 辅助层 ·
        html(opt) 场景 DOM · setup({ root, host, opt, q, qa }) → frame(f) 每帧画 */
    define(name, def) {
      defs.set(name, def);
      if (!customElements.get("lab-motion")) customElements.define("lab-motion", LabMotion);
      else for (const el of document.querySelectorAll('lab-motion[name="' + name + '"]')) if (!el.def) el.connectedCallback();
    },
    toggle() { const to = next(); T.scrubbing = false; T.loop = false; T.target = to; },
    play(to) { T.scrubbing = false; T.target = to ? 1 : 0; },
    /** 定格在 v（截图 / 逐帧）：停播，播放条跟着 */
    set(v) { T.scrubbing = true; T.loop = false; T.lin = T.target = clamp(v, 0, 1); },
    guide(k, on) { (on ?? !T.guides.has(k)) ? T.guides.add(k) : T.guides.delete(k); },
    get lin() { return T.lin; },
  };
  window.labMotion = api;

  /* 截图：?mt=0.5 定格在那一刻，?mg=b,c 开辅助层 */
  if (qs.has("mt")) api.set(Number(qs.get("mt")));
  for (const k of (qs.get("mg") ?? "").split(",").filter(Boolean)) T.guides.add(k);

  /* 单独成页（没挂 dc 台子）时也跟服务对版本：页面一改自己刷新，同 lab.js */
  addEventListener("load", () => {
    if (window.labStart || location.protocol === "file:") return;
    const id = Math.random().toString(36).slice(2);
    let ver = null;
    const poll = async () => {
      try {
        const m = await (await fetch("/__lab/state?page=" + encodeURIComponent(location.pathname) + "&id=" + id + "&vis=" + (document.hidden ? 0 : 1), { cache: "no-store" })).json();
        if (ver && m.ver !== ver) return location.reload();
        ver = m.ver;
      } catch {}
      setTimeout(poll, document.hidden ? 5000 : 1500);
    };
    poll();
  });
})();
