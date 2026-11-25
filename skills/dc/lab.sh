#!/usr/bin/env bash
# 干什么：给一个项目起 / 关对照版服务（本机 node 进程：本机开发工具，不进 Docker）。端口自动分——同一项目尽量同一个端口（上次用的优先，再按路径哈希），被占就往后找；已经在跑就只报地址。
# 怎么跑：~/.claude/skills/dc/lab.sh <项目根>        → 最后一行打印 http://127.0.0.1:<端口>（页面在 <地址>/docs/lab/<topic>.html）
#        ~/.claude/skills/dc/lab.sh <项目根> stop   → 关掉（用完就关；不关也会没人看 15 分钟后自己关）
#        ~/.claude/skills/dc/lab.sh <项目根> new <slug> [题目]  → 搭一页 docs/lab/<slug>.html（token 自动找、TOPIC / KEY 填好）、起服务，最后一行打印页面地址
# 需要什么：node 18+、curl、nc、python3。参数：LAB_WATCH（盯哪个子目录，默认 docs/lab）· LAB_IDLE_MIN（没人看多久自己关）；端口段 PORT_BASE / PORT_SPAN 见下；pid / 端口 / 日志 / 标注参考图在 STATE。
set -euo pipefail

PORT_BASE=47000   # 端口段起点
PORT_SPAN=1000    # 段长：项目按路径哈希落在段里，被占就顺延
PROBE=50          # 最多往后找几个
STATE="$HOME/.local/state/dc-lab"

[ $# -eq 1 ] || { [ $# -eq 2 ] && [ "$2" = stop ]; } || { [ $# -ge 3 ] && [ "$2" = new ]; } || { echo "用法：lab.sh <项目根> [stop | new <slug> [题目]]" >&2; exit 2; }
ROOT=$(cd "$1" && pwd -P)   # 解开软链：/tmp 与 /private/tmp 算同一个项目
DIR=$(cd "$(dirname "$0")" && pwd)
HASH=$(printf %s "$ROOT" | cksum | cut -d' ' -f1)
SLUG=$(basename "$ROOT" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//')
NAME="lab-${SLUG:-x}-$((HASH % 10000))"   # 同名目录在不同路径也不撞
mkdir -p "$STATE"
PIDF="$STATE/$NAME.pid" PORTF="$STATE/$NAME.port" LOG="$STATE/$NAME.log" IMG="$STATE/img/$NAME"
IMG_KEEP_DAYS=30   # 标注参考图留多久：起服务时清掉更早的

# pid 还活着、而且确实是 serve.mjs（pid 会被别的进程复用）
alive() { [ -f "$PIDF" ] && ps -p "$(cat "$PIDF")" -o command= 2>/dev/null | grep -q serve.mjs; }

# 搭页：模板 → docs/lab/<slug>.html。token 按常见位置找，再全仓找 tokens.css / Token.css（跳过 node_modules、dist）；
# 同目录有 fonts.css 一起引。都没有就不引——样本吃台子自带的 Token.css 兜底。已有同名页就报错，不覆盖
if [ "${2:-}" = new ]; then
  PAGE_SLUG=$3 TITLE=${4:-$3} DEST="$ROOT/docs/lab/$3.html"
  [ -e "$DEST" ] && { echo "已经有这页了：${DEST}（要重搭就先删掉它）" >&2; exit 1; }
  TOK=""
  for f in src/styles/tokens.css src/panel/shell/tokens.css src/tokens.css styles/tokens.css docs/lab/tokens.css docs/lab/Token.css; do
    [ -f "$ROOT/$f" ] && { TOK=$f; break; }
  done
  [ -n "$TOK" ] || TOK=$(cd "$ROOT" && find . \( -name node_modules -o -name dist -o -name .git \) -prune -o -type f \( -name tokens.css -o -name Token.css \) -print 2>/dev/null | head -1 | sed 's|^\./||')
  LINKS=""
  if [ -n "$TOK" ]; then
    [ -f "$ROOT/$(dirname "$TOK")/fonts.css" ] && LINKS="<link rel=\"stylesheet\" href=\"/$(dirname "$TOK")/fonts.css\">"$'\n'
    LINKS="$LINKS<link rel=\"stylesheet\" href=\"/$TOK\">"
  fi
  mkdir -p "$ROOT/docs/lab"
  python3 - "$DIR/template.html" "$DEST" "$TITLE" "$PAGE_SLUG" "$LINKS" <<'PY'
import json, sys
src, dest, title, slug, links = sys.argv[1:]
t = open(src, encoding="utf-8").read()
for a, b in [("<!--TOKENS-->", links), ("SLUG", slug), ("对照版 · TOPIC", "对照版 · " + title), ("干什么：TOPIC 的", "干什么：" + title + " 的"), ('const TOPIC = "TOPIC";', "const TOPIC = " + json.dumps(title, ensure_ascii=False) + ";")]:
    assert a in t, a
    t = t.replace(a, b)
assert "TOPIC" not in t.replace("const TOPIC =", "").replace("labStart({ TOPIC", ""), "模板里还有没填的 TOPIC"
open(dest, "w", encoding="utf-8").write(t)
PY
  echo "搭好了：${DEST}（token：${TOK:-没找到，样本用台子的 Token.css}）" >&2
  echo "$("$0" "$ROOT")/docs/lab/$PAGE_SLUG.html"
  exit 0
fi

if [ "${2:-}" = stop ]; then
  if alive; then kill "$(cat "$PIDF")"; echo "关了：$NAME" >&2; else echo "本来就没在跑：$NAME" >&2; fi
  rm -f "$PIDF"
  exit 0
fi

# 已经在跑：报它现在的端口，不动它（端口变了页面存的状态就丢了）
if alive; then
  echo "已在跑：$NAME" >&2
  echo "http://127.0.0.1:$(cat "$PORTF")"
  exit 0
fi

# 上次用的端口优先（自己关掉过、又被叫起来时端口不变，页面存的状态还在），再从路径哈希那格往后找
PREV=$(cat "$PORTF" 2>/dev/null || true)
START=$((PORT_BASE + HASH % PORT_SPAN))
for PORT in $PREV $(seq "$START" $((START + PROBE - 1))); do
  nc -z 127.0.0.1 "$PORT" 2>/dev/null && continue   # 有人在听，换下一个
  mkdir -p "$IMG" && find "$IMG" -type f -mtime +"$IMG_KEEP_DAYS" -delete
  LAB_PORT="$PORT" LAB_IMG_DIR="$IMG" nohup node "$DIR/serve.mjs" "$ROOT" >> "$LOG" 2>&1 < /dev/null &
  echo $! > "$PIDF"
  echo "$PORT" > "$PORTF"
  curl -sf -o /dev/null --max-time 2 --retry 10 --retry-connrefused --retry-max-time 15 "http://127.0.0.1:$PORT/__lab/ping" \
    || { echo "起不来，日志 ${LOG}：" >&2; tail -5 "$LOG" >&2; exit 1; }
  echo "起好了：$NAME → ${ROOT}（日志 ${LOG}）" >&2
  echo "http://127.0.0.1:$PORT"
  exit 0
done
echo "从 $START 往后 $PROBE 个端口全被占了，改 PORT_BASE 再跑" >&2
exit 1
