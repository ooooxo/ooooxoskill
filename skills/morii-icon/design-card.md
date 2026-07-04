# Design card — the project's standing icon dashboard

A **morii-card-styled icon wall**, served on a local port, that is the **single human entry to the project's Morii icon set** — and the review surface for **every** icon task. Not a per-session offer, not just for sets: **always go through it**, whether you're designing a whole set, redesigning, or changing one glyph. The user keeps it open and watches it **update in real time as you save the registry**, with the tiles you touched **this session ringed** so even a one-icon edit is one glance.

**One source of truth.** The builder holds no icon data; it **reads the project's real registry file** (SKILL §8) and indexes **that set only** (not scattered `.svg` assets). So the card is a live view of exactly what ships — never a copy you paste and re-sync.

**Two review layers, always in sync.** You self-check via qlmanage PNGs (SKILL §6 — you can't see the browser, so you must render and look yourself); the user reviews via the live card. Same generator emits both, so they never drift.

**No project files added.** You launch it on demand; the only things written are the regenerated `design-card.html` + `contactsheet.svg` + `-dark.svg` in the project dir (`--out`, default cwd). The server **auto-stops** when the card is closed (`--idle`, default 60s) — "openable anytime" means *ask and it serves*; closing cleans up.

## The flow (always — no opt-out)

1. **Gather + confirm the list.** From the request and context, write out the icons the user needs (name each), present the list, let them **add / remove / rename** before you draw. Collapse **duplicates** here — two names that mean the same thing become one (SKILL root 5, 7). For a single-icon change, the "list" is just that one icon — still go through the card.
2. **Author the registry, start the server.** Put the set into the project's real registry (`export const icons = { … }` or `[{name, inner}]`; §8). Then serve from the project root:
   ```bash
   node ~/.claude/skills/morii-icon/build-gallery.mjs serve [path/to/icons.ts] --port 4321
   ```
   (No path → it auto-detects a registry in cwd, or writes a `morii-icons.draft.js` starter to author into.) **The server auto-opens the card in the default browser** on start (pass `--no-open` to skip, e.g. headless). Also tell the user the URL: **http://localhost:4321** — in case the auto-open is blocked, or they closed it and want to reopen.
3. **Design + self-check live.** Draw each per SKILL §0–§4. As you **edit and save** the registry, the card re-renders, the changed tiles **ring** (soft full-perimeter halo + corner dot — never a `border-left` callout), and the contact sheets in the project dir refresh — run your own light+dark small-size self-check (§6) and fix before pointing the user at it. A parse error shows as a red banner on the card (not a crash); fix the file and save.
4. **Let the user mark up.** With the card open, ask which icons to revise (or note what's off). The **change-ring** shows exactly what you touched this session, so review is fast even for one icon. Edit only those in the registry, save — the card updates in place and re-rings them. Repeat until they confirm.
5. **Finalize + auto-stop.** The registry is already the deliverable (§8). Add the single `Icon` render entry. The server **shuts itself down** once the user closes the card (idle window) — a finished review leaves no leaked process. On confirm, also stop it explicitly (TaskStop, or GET `/quit`) instead of waiting out the idle window. No copy-back step — there was never a copy. The card is relaunchable anytime as the project's icon dashboard.

> One-shot alternative (no live server, no change-highlight): `node ~/.claude/skills/morii-icon/build-gallery.mjs build [path] --out .` writes a self-contained `design-card.html` to the project dir; `open design-card.html`. Use the live server whenever you're iterating.

## The card (morii-card aesthetic — the builder makes it, don't hand-roll)

`build-gallery.mjs` emits the card following morii-card: one self-contained page, neutral surface, **bento grid** of icon tiles (icon + name), single accent, **size / theme / tint** segmented-pill controls (the required interaction), light + dark via `light-dark()`, gentle one-shot fade-up, a **LIVE** badge, a **本次改动 N** chip, and a **change-ring** on this-session's edited/added tiles. Every icon renders inside the live-area frame `<g transform="translate(12 12) scale(.98) translate(-12 -12)">`. No emoji; icons are the content. **The change-highlight is a full-perimeter ring + corner dot, never a colored `border-left` accent callout** (a standing project constraint). If you must tweak it, edit the `card()` function in the generator — never paste a bespoke gallery.

> Why one standing card for everything: the user reviews the set the way it will actually be *used* (sizes, themes, on neutral surface), in the same visual language as the rest of Morii (morii-card), against the **real file you ship**, and sees each fix the instant you make it — the changed tiles ringed. One entry, one source, one review surface, for one icon or the whole set.
