#!/bin/sh
# 装 wait-band：把 bin/waitfor 链到 ~/.claude/tools/waitfor，把本目录加进 ~/.claude/settings.json 的 env.CLAUDE_CODE_PLUGIN_DIRS
# 怎么跑：sh install.sh（重复跑无副作用），装完重启 Claude Code；CLAUDE_HOME 可改装到别的 ~/.claude
# 需要：macOS 自带的 perl（waitfor 用）和 osascript（改 settings.json；不用 python3，新机没装命令行工具时它会弹安装框）
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
CLAUDE_HOME=${CLAUDE_HOME:-$HOME/.claude}
TOOLS=$CLAUDE_HOME/tools
SETTINGS=$CLAUDE_HOME/settings.json

mkdir -p "$TOOLS"
if [ -e "$TOOLS/waitfor" ] && [ ! -L "$TOOLS/waitfor" ]; then
  mv "$TOOLS/waitfor" "$TOOLS/waitfor.old"
  echo "原来的 waitfor 挪到了 $TOOLS/waitfor.old"
fi
ln -sfn "$HERE/bin/waitfor" "$TOOLS/waitfor"
chmod +x "$HERE/bin/waitfor"

osascript -l JavaScript - "$SETTINGS" "$HERE" <<'EOF'
function run([path, here]) {
  const fm = $.NSFileManager.defaultManager
  const s = fm.fileExistsAtPath(path)
    ? JSON.parse($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js)
    : {}
  const env = s.env = s.env || {}
  const old = (env.CLAUDE_CODE_PLUGIN_DIRS || '').split(':').filter(Boolean)
  // 别处的旧 wait-band 一并摘掉：换了位置（解压包 → git 仓库）还留着旧的，插件会加载两份、每条提醒发两遍
  const dirs = [...old.filter(d => !/\/wait-band\/?$/.test(d)), here]
  if (dirs.join(':') === old.join(':')) return
  env.CLAUDE_CODE_PLUGIN_DIRS = dirs.join(':')
  if (!$(JSON.stringify(s, null, 2) + '\n').writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null))
    throw new Error('写不进 ' + path)
  const gone = old.filter(d => d !== here && !dirs.includes(d))
  return `已把 ${here} 加进 ${path} 的 CLAUDE_CODE_PLUGIN_DIRS` + (gone.length ? `，摘掉旧的 ${gone.join('、')}` : '')
}
EOF

echo "装好了：$TOOLS/waitfor -> $HERE/bin/waitfor。重启 Claude Code 生效；给 agent 的规矩在 claude-md.md，贴进 ~/.claude/CLAUDE.md"
