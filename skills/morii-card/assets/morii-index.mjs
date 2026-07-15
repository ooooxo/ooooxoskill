#!/usr/bin/env node
// morii-index.mjs — MoriiCard multi-card index manager (zero deps, node ≥16).
//
//   node morii-index.mjs add <ViewCard/card.html> [--open]   ensure shell + upsert row + print open URL
//   node morii-index.mjs rebuild [ViewCard]                  rescan all cards' card-meta, regenerate CARDS region
//   node morii-index.mjs open <ViewCard/card.html>           print (don't edit) a fresh deep-link URL
//
// Replaces the old manual flow (cp shell → hand-Edit CARDS line → open):
// one command, idempotent, syntax-validated, lock-guarded against concurrent
// runs, and the printed URL carries a cache-buster so an already-open index
// tab never serves a stale CARDS array.

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, statSync, readdirSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const SHELL_TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), 'index-shell.html');
const START = '/*CARDS-START*/';
const END = '/*CARDS-END*/';
const PALETTE = ['#16a34a', '#6366f1', '#0ea5e9', '#f43f5e', '#d97706', '#8b5cf6', '#14b8a6', '#f97316', '#e11d48', '#0891b2', '#65a30d', '#c026d3'];
const META_RE = /<script[^>]*id=["']card-meta["'][^>]*>([\s\S]*?)<\/script>/;

const fail = (msg) => { console.error('morii-index: ' + msg); process.exit(1); };

// ---------- lock (parallel card builds must not interleave read-modify-write) ----------
async function withLock(dir, fn) {
  const lock = join(dir, '.index.lock');
  for (let i = 0; i < 50; i++) {
    try {
      writeFileSync(lock, String(process.pid), { flag: 'wx' });
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - statSync(lock).mtimeMs > 10000) { unlinkSync(lock); continue; } } catch {}
      await sleep(100);
      continue;
    }
    try { return await fn(); } finally { try { unlinkSync(lock); } catch {} }
  }
  fail('could not acquire ' + lock + ' after 5s — stale? delete it and re-run');
}

// ---------- shell ----------
function ensureShell(dir) {
  const idx = join(dir, 'index.html');
  if (existsSync(idx)) return idx;              // never overwrite (user edits + CARDS stay safe)
  if (!existsSync(SHELL_TEMPLATE)) fail('shell template missing: ' + SHELL_TEMPLATE);
  mkdirSync(dir, { recursive: true });
  copyFileSync(SHELL_TEMPLATE, idx);
  console.log('shell copied → ' + idx);
  return idx;
}

// ---------- card-meta ----------
function mtimeDate(p) {
  const t = statSync(p).mtime;
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

function readMeta(cardPath) {
  if (!existsSync(cardPath)) fail('card not found: ' + cardPath);
  const html = readFileSync(cardPath, 'utf8');
  const m = html.match(META_RE);
  if (!m) fail('no <script id="card-meta"> block in ' + cardPath + ' — add it to the card <head>, then re-run');
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { fail('card-meta is not valid JSON in ' + cardPath + ': ' + e.message); }
  if (!meta.t) fail('card-meta missing "t" (title) in ' + cardPath);
  meta.g = meta.g || '未分类';
  if (!meta.d) meta.d = mtimeDate(cardPath);
  return meta;
}

// One row, keys f,t,g,v,s,d then any extras (e.g. sparkline series p:[…]); values
// via JSON.stringify → always double-quoted, apostrophes/quotes inside are safe.
function rowLine(f, meta) {
  const ordered = ['t', 'g', 'v', 's', 'd'];
  const extras = Object.keys(meta).filter(k => !ordered.includes(k));
  const parts = ['f:' + JSON.stringify(f)];
  for (const k of [...ordered, ...extras]) if (meta[k] !== undefined) parts.push(k + ':' + JSON.stringify(meta[k]));
  return '{' + parts.join(',') + '},';
}

function parseRow(line) {
  try { return new Function('return ' + line.replace(/,\s*$/, ''))(); } catch { return null; }
}

// ---------- CARDS region ----------
function splitIndex(idx) {
  const src = readFileSync(idx, 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a < 0 || b < 0 || b < a) fail(idx + ' has no CARDS markers — corrupted or pre-marker shell; move it aside and run rebuild (rows restore from the cards)');
  return { head: src.slice(0, a + START.length), region: src.slice(a + START.length, b), tail: src.slice(b) };
}

function parseRegion(region) {                   // validate: must parse as a JS array
  try {
    const rows = new Function('return [' + region + '\n]')();
    for (const r of rows) if (!r || !r.f || !r.t) throw new Error('row missing f/t: ' + JSON.stringify(r));
    return rows;
  } catch (e) { return e; }
}

function writeRegion(idx, head, lines, tail) {
  const region = lines.length ? '\n' + lines.join('\n') + '\n' : '\n';
  const err = parseRegion(region);
  if (err instanceof Error) fail('refusing to write — generated CARDS region does not parse: ' + err.message);
  writeFileSync(idx, head + region + tail);
}

const regionLines = (region) => region.split('\n').map(s => s.trim()).filter(Boolean);

// ---------- HUE: auto-assign a palette color to unknown tags ----------
function ensureHue(idx, tag) {
  if (!tag || /['"\\{}:,]/.test(tag)) return;
  const src = readFileSync(idx, 'utf8');
  const m = src.match(/const HUE=\{([^}]*)\}/);
  if (!m) return;
  const entries = m[1];
  const keys = [...entries.matchAll(/([^,{\s:'"]+):/g)].map(x => x[1]);
  if (keys.includes(tag)) return;
  const used = [...entries.matchAll(/#[0-9a-fA-F]{6}/g)].map(x => x[0].toLowerCase());
  let h = 0; for (const ch of tag) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  let color = PALETTE[h % PALETTE.length];
  for (let i = 0; i < PALETTE.length; i++) {
    const c = PALETTE[(h + i) % PALETTE.length];
    if (!used.includes(c)) { color = c; break; }
  }
  const insert = (entries.trim() ? ',' : '') + tag + ":'" + color + "'";
  writeFileSync(idx, src.replace(/const HUE=\{[^}]*\}/, () => 'const HUE={' + entries + insert + '}'));
  console.log('HUE + ' + tag + ' → ' + color);
}

// ---------- open URL ----------
function openUrl(idx, f, doOpen) {
  const url = 'file://' + resolve(idx) + '?r=' + Date.now() + (f ? '#' + encodeURIComponent(f) : '');
  console.log(url);
  if (doOpen) {
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
  }
  return url;
}

// ---------- commands ----------
const [cmd, target, ...rest] = process.argv.slice(2);
const doOpen = rest.includes('--open') || target === '--open';

if (cmd === 'add') {
  if (!target || target === '--open') fail('usage: morii-index.mjs add <ViewCard/card.html> [--open]');
  const cardPath = resolve(target);
  const dir = dirname(cardPath);
  const f = basename(cardPath);
  if (/[^\x20-\x7E]/.test(f)) console.log('warning: non-ASCII filename 「' + f + '」 — prefer pinyin/ASCII for encoding-safe hash routes');
  const meta = readMeta(cardPath);
  await withLock(dir, () => {
    const idx = ensureShell(dir);
    const { head, region, tail } = splitIndex(idx);
    const fKey = 'f:' + JSON.stringify(f);
    const fKeySingle = "f:'" + f + "'";          // legacy hand-written single-quote rows
    const lines = [];
    for (const l of regionLines(region)) {
      if (!l.includes(fKey) && !l.includes(fKeySingle)) { lines.push(l); continue; }
      const old = parseRow(l);                   // replaced row with a DIFFERENT title = filename reuse:
      if (old && old.t && old.t !== meta.t)      // the old card's HTML was overwritten at Write time and is gone
        console.log('warning: 「' + f + '」 previously held a different card 「' + old.t + '」 → now 「' + meta.t + '」. Recurring topics need unique filenames: <topic>-<MMDD>-card.html');
    }
    lines.push(rowLine(f, meta));
    writeRegion(idx, head, lines, tail);
    console.log('indexed ' + f + ' (' + lines.length + ' card' + (lines.length > 1 ? 's' : '') + ')');
    ensureHue(idx, meta.g);
    openUrl(idx, f, doOpen);
  });
} else if (cmd === 'rebuild') {
  const dir = resolve(target && target !== '--open' ? target : 'ViewCard');
  if (!existsSync(dir)) fail('directory not found: ' + dir);
  await withLock(dir, () => {
    const idx = ensureShell(dir);
    const rows = [];
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith('.html') || name === 'index.html') continue;
      const html = readFileSync(join(dir, name), 'utf8');
      const m = html.match(META_RE);
      if (!m) { console.log('skip (no card-meta): ' + name); continue; }
      try {
        const meta = JSON.parse(m[1]);
        if (!meta.d) meta.d = mtimeDate(join(dir, name));
        rows.push({ f: name, meta });
      } catch (e) { console.log('skip (bad card-meta JSON): ' + name + ' — ' + e.message); }
    }
    rows.sort((a, b) => (a.meta.d < b.meta.d ? 1 : a.meta.d > b.meta.d ? -1 : 0));
    const { head, tail } = splitIndex(idx);
    writeRegion(idx, head, rows.map(r => rowLine(r.f, r.meta)), tail);
    console.log('rebuilt: ' + rows.length + ' cards');
    for (const g of new Set(rows.map(r => r.meta.g).filter(Boolean))) ensureHue(idx, g);
    openUrl(idx, null, doOpen);
  });
} else if (cmd === 'open') {
  if (!target || target === '--open') fail('usage: morii-index.mjs open <ViewCard/card.html>');
  const cardPath = resolve(target);
  openUrl(join(dirname(cardPath), 'index.html'), basename(cardPath), true);
} else {
  fail('usage: morii-index.mjs add <card.html> [--open] | rebuild [dir] [--open] | open <card.html>');
}
