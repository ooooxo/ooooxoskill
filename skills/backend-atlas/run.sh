#!/usr/bin/env bash
# 一键出系统图：服务端 Roslyn 抽取 → 客户端 TS / Rust 抽取 → 两端拼循环 → 内联成自包含 HTML。任何一步失败即退出。
# 怎么跑：SEM=<语义层.json> ./run.sh <server.csproj | .sln | .slnx> <client-root | -> <out.html>
#        语义层文件不存在 = 按抽取结果生成骨架再出图；客户端写 - = 只有服务端。ICONS=<注册表> 换图标；WORK=<目录> 放中间件；FORCE=1 强制全量；SHARE=1 不写本机路径
# 需要：.NET 10 SDK、bun、bash；首次会编译抽取器、装 typescript / tree-sitter。
# 增量：每一段按「输入内容哈希」判断，没变就跳过（只改语义层时只重出图，约 0.1 秒）；抽取器 / join 自身的代码也算进哈希。
set -euo pipefail

usage() { echo "用法：SEM=<语义层.json> $0 <server.csproj | .sln | .slnx> <client-root | -> <out.html>" >&2; exit 2; }
[ $# -eq 3 ] || usage
: "${SEM:?需要语义层：SEM=path/to/atlas.json（文件不存在会自动生成骨架）}"
command -v dotnet >/dev/null || { echo "没找到 dotnet：装 .NET 10 SDK（https://dotnet.microsoft.com/download）" >&2; exit 2; }
command -v bun >/dev/null || { echo "没找到 bun：curl -fsSL https://bun.sh/install | bash" >&2; exit 2; }
[ -f "$1" ] || { echo "找不到服务端项目：$1" >&2; exit 2; }
[ "$2" = "-" ] || [ -d "$2" ] || { echo "找不到客户端目录：$2（没有客户端就写 -）" >&2; exit 2; }

HERE="$(cd "$(dirname "$0")" && pwd)"
abs() { echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; }
SERVER_PROJ="$(abs "$1")"
CLIENT_ROOT="$([ "$2" = "-" ] && echo - || (cd "$2" && pwd))"
mkdir -p "$(dirname "$3")" "$(dirname "$SEM")"
OUT="$(abs "$3")"
SEM="$(abs "$SEM")"
ICONS="${ICONS:-$HERE/viewer/icons.ts}"
FORCE="${FORCE:-0}"
SUM="$(command -v shasum || command -v sha1sum)"
# 每个项目一个工作目录：多个项目 / 多人同时跑不互相覆盖
WORK="${WORK:-$(cd "${TMPDIR:-/tmp}" && pwd -P)/atlas-$(echo "$SERVER_PROJ" | "$SUM" | cut -c1-10)}"

mkdir -p "$WORK"
cd "$HERE"
[ -d node_modules ] || bun install --silent

# 一组路径下源码的内容哈希（不看 bin / obj / node_modules / dist）；不存在的路径跳过
key() {
  local paths=()
  for p in "$@"; do [ -e "$p" ] && paths+=("$p"); done
  [ ${#paths[@]} -gt 0 ] || { echo none; return; }
  find "${paths[@]}" -type f \( -name '*.cs' -o -name '*.csproj' -o -name '*.sln' -o -name '*.slnx' -o -name '*.props' -o -name '*.ts' -o -name '*.tsx' \
    -o -name '*.js' -o -name '*.jsx' -o -name '*.vue' -o -name '*.rs' -o -name '*.json' -o -name '*.toml' \) \
    -not -path '*/bin/*' -not -path '*/obj/*' -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 \
    | sort -z | xargs -0 "$SUM" | "$SUM" | cut -d' ' -f1
}
# 这一段要不要跑：输入哈希与上次一样、产物还在 → 跳过；否则跑完记下哈希
fresh() { [ "$FORCE" != 1 ] && [ -f "$WORK/$1.key" ] && [ -f "$WORK/$2" ] && [ "$(cat "$WORK/$1.key")" = "$3" ]; }

EXT_KEY="$(key extractor)"
if [ "$FORCE" = 1 ] || [ ! -f extractor/bin/Release/net10.0/atlas-extract.dll ] || [ "$(cat "$WORK/extractor.key" 2>/dev/null)" != "$EXT_KEY" ]; then
  dotnet build extractor -c Release --nologo -v q
  echo "$EXT_KEY" > "$WORK/extractor.key"
fi

# 服务端的输入：解决方案所在目录；给 .csproj 就是它 + 递归引用到的项目目录（分层项目改了 Core 也要重抽）
case "$SERVER_PROJ" in
  *.sln|*.slnx) SRV_DIRS=("$(dirname "$SERVER_PROJ")") ;;
  *) SRV_DIRS=(); while IFS= read -r d; do SRV_DIRS+=("$d"); done < <(bun -e '
       const fs = require("fs"), path = require("path"), seen = new Set();
       const walk = (p) => { p = path.resolve(p); if (seen.has(p) || !fs.existsSync(p)) return; seen.add(p);
         for (const m of fs.readFileSync(p, "utf8").matchAll(/ProjectReference\s+Include="([^"]+)"/g)) walk(path.join(path.dirname(p), m[1].replace(/\\/g, "/"))); };
       walk(process.argv[1]); for (const p of seen) console.log(path.dirname(p));' "$SERVER_PROJ") ;;
esac
SRV_KEY="$EXT_KEY-$(key "${SRV_DIRS[@]}")"
if fresh server server.graph.json "$SRV_KEY"; then echo "服务端没变，跳过抽取"; else
  # 抽取器只加载不还原：新 clone 的项目没 restore 过 NuGet 包会满屏编译错
  for d in "${SRV_DIRS[@]}"; do
    if ls "$d"/*.csproj >/dev/null 2>&1 && [ ! -f "$d/obj/project.assets.json" ]; then dotnet restore "$SERVER_PROJ" -v q; break; fi
  done
  dotnet extractor/bin/Release/net10.0/atlas-extract.dll "$SERVER_PROJ" "$WORK/server.graph.json"
  echo "$SRV_KEY" > "$WORK/server.key"
fi

if [ "$CLIENT_ROOT" = "-" ]; then
  echo '{"schema":1,"project":"client","revision":"none","dirtyFiles":0,"modules":[],"entries":[],"methods":[],"resources":[],"edges":[]}' > "$WORK/client.graph.json"
  CLI_KEY=none
else
  CLI_KEY="$(key client)-$(key "$CLIENT_ROOT/src" "$CLIENT_ROOT/src-tauri/src" "$CLIENT_ROOT"/tsconfig*.json "$CLIENT_ROOT/jsconfig.json" "$CLIENT_ROOT/package.json")"
  # 没有 src/ 的项目（源码在根目录）：连根目录一起算
  [ -d "$CLIENT_ROOT/src" ] || CLI_KEY="$CLI_KEY-$(key "$CLIENT_ROOT")"
  if fresh client client.graph.json "$CLI_KEY"; then echo "客户端没变，跳过抽取"; else
    bun client/extract.ts "$CLIENT_ROOT" "$WORK/client.graph.json"
    echo "$CLI_KEY" > "$WORK/client.key"
  fi
fi

JOIN_KEY="$("$SUM" join.ts viewer/core.js | "$SUM" | cut -d' ' -f1)-$SRV_KEY-$CLI_KEY"
if fresh join system.json "$JOIN_KEY"; then echo "两端都没变，跳过拼接"; else
  bun join.ts "$WORK/server.graph.json" "$WORK/client.graph.json" "$WORK/system.json"
  echo "$JOIN_KEY" > "$WORK/join.key"
fi

# 出图总是跑：语义层、模板、画法随时在改，且只要 0.1 秒
bun viewer/build.ts "$WORK/system.json" "$SEM" "$(dirname "$SERVER_PROJ")" "$CLIENT_ROOT" "$ICONS" "$OUT"
