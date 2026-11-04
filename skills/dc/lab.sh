#!/usr/bin/env bash
# 干什么：给一个项目起 / 关对照版服务（容器）。端口自动分——同一项目尽量同一个端口（上次用的优先，再按路径哈希），被占就往后找；已经在跑就只报地址。
# 怎么跑：~/.claude/skills/dc/lab.sh <项目根>        → 最后一行打印 http://127.0.0.1:<端口>（页面在 <地址>/docs/lab/<topic>.html）
#        ~/.claude/skills/dc/lab.sh <项目根> stop   → 关掉（用完就关；不关也会闲 15 分钟自己关）
# 需要什么：Docker（compose v2）、nc。参数：LAB_WATCH（盯哪个子目录，默认 docs/lab）· LAB_IDLE_MIN（闲多久自己关）；端口段 PORT_BASE / PORT_SPAN 见下。
set -euo pipefail

PORT_BASE=47000   # 端口段起点
PORT_SPAN=1000    # 段长：项目按路径哈希落在段里，被占就顺延
PROBE=50          # 最多往后找几个

[ $# -eq 1 ] || [ "${2:-}" = stop ] || { echo "用法：lab.sh <项目根> [stop]" >&2; exit 2; }
ROOT=$(cd "$1" && pwd -P)   # 解开软链：/tmp 与 /private/tmp 算同一个项目
DIR=$(cd "$(dirname "$0")" && pwd)
HASH=$(printf %s "$ROOT" | cksum | cut -d' ' -f1)
SLUG=$(basename "$ROOT" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//')
NAME="lab-${SLUG:-x}-$((HASH % 10000))"   # 同名目录在不同路径也不撞
COMPOSE=(docker compose -f "$DIR/compose.yaml" -p "$NAME")

if [ "${2:-}" = stop ]; then
  LAB_ROOT="$ROOT" "${COMPOSE[@]}" down >&2
  echo "关了：$NAME" >&2
  exit 0
fi

# 已经在跑：报它现在的端口，不动它（端口变了页面存的状态就丢了）
if RUNNING=$(LAB_ROOT="$ROOT" "${COMPOSE[@]}" port lab 4777 2>/dev/null) && [ -n "$RUNNING" ]; then
  echo "已在跑：$NAME" >&2
  echo "http://127.0.0.1:${RUNNING##*:}"
  exit 0
fi

# 上次用的端口优先（自己关掉过、又被叫起来时端口不变，页面存的状态还在），再从路径哈希那格往后找
PREV=$(docker inspect -f '{{with index .HostConfig.PortBindings "4777/tcp"}}{{(index . 0).HostPort}}{{end}}' "$NAME-lab-1" 2>/dev/null || true)
START=$((PORT_BASE + HASH % PORT_SPAN))
for PORT in $PREV $(seq "$START" $((START + PROBE - 1))); do
  nc -z 127.0.0.1 "$PORT" 2>/dev/null && continue   # 有人在听，换下一个
  LAB_ROOT="$ROOT" LAB_PORT="$PORT" "${COMPOSE[@]}" up -d --wait >&2
  echo "起好了：$NAME → $ROOT" >&2
  echo "http://127.0.0.1:$PORT"
  exit 0
done
echo "从 $START 往后 $PROBE 个端口全被占了，改 PORT_BASE 再跑" >&2
exit 1
