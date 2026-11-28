#!/bin/sh
# 干什么：把 tests/err-cases.txt 每一条喂给真的 waitfor，看它判不判报错行，打出准确率与错判的那几条
# 怎么跑：sh tests/err-regex.sh（重复跑无副作用；不写状态文件）
# 需要什么：本目录的 bin/waitfor、perl
set -eu
HERE=$(cd "$(dirname "$0")/.." && pwd)
tp=0; fn=0; tn=0; fp=0
while IFS= read -r raw; do
  case "$raw" in "+ "*) want=1 ;; "- "*) want=0 ;; *) continue ;; esac
  line=${raw#??}
  got=$(CLAUDE_PID= "$HERE/bin/waitfor" -q 0 5 -- printf '%s\n' "$line" 2>&1 >/dev/null | grep -c '报错行' || true)
  if [ "$want" = 1 ] && [ "$got" -ge 1 ]; then tp=$((tp+1))
  elif [ "$want" = 1 ]; then fn=$((fn+1)); echo "漏判  $line"
  elif [ "$got" -ge 1 ]; then fp=$((fp+1)); echo "误判  $line"
  else tn=$((tn+1)); fi
done < "$HERE/tests/err-cases.txt"
echo "应判 $((tp+fn)) 条：判中 ${tp}、漏 ${fn} ｜ 不应判 $((tn+fp)) 条：放过 ${tn}、误判 ${fp}"
[ $((fn+fp)) = 0 ]
