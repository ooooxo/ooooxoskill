#!/bin/bash

# Git Commit 规范检查 Hook
# 校验格式: [前缀]标题总结\n\n完整总结
# 提交前会去掉文件末尾由工具自动追加的 Co-authored-by 行，避免污染 log

commit_msg_file="$1"

# 去掉末尾的 trailer 块（Co-authored-by / Signed-off-by / Claude-Session 等）及其间空行，写回文件。
# 逐行剥而不是只看最后一行：agent 常把 Claude-Session 追在 Co-authored-by 之后，
# 只认单一键名会在第一行就停手，整块原样漏过去（2026-09-11 实证）。
awk '
  { buf[NR] = $0 }
  END {
    end = NR
    removed = 1
    while (removed) {
      removed = 0
      while (end > 0 && buf[end] ~ /^[[:space:]]*$/) end--
      if (end > 0 && tolower(buf[end]) ~ /^(co-authored-by|co-committed-by|signed-off-by|claude-session):/) {
        end--; removed = 1
      }
    }
    for (i = 1; i <= end; i++) print buf[i]
  }
' "$commit_msg_file" > "${commit_msg_file}.tmp" && mv "${commit_msg_file}.tmp" "$commit_msg_file"

commit_msg=$(cat "$commit_msg_file")

# 提取第一行
first_line=$(echo "$commit_msg" | head -n 1)

# 校验前缀格式
if ! echo "$first_line" | grep -qE '^\[(更新|优化|重构|修复)\].+'; then
    echo "❌ 提交信息格式不规范！"
    echo ""
    echo "正确格式："
    echo "[前缀]标题总结"
    echo ""
    echo "完整总结"
    echo ""
    echo "前缀选项：[更新] [优化] [重构] [修复]"
    echo ""
    echo "示例："
    echo "[更新]增加精力值系统"
    echo ""
    echo "实现了玩家精力值设定，包含精力上限、恢复机制和消耗逻辑"
    exit 1
fi

# 提取行数
line_count=$(echo "$commit_msg" | wc -l | tr -d ' ')

# 校验是否有完整总结（至少3行：标题、空行、总结）
if [ "$line_count" -lt 3 ]; then
    echo "❌ 提交信息格式不规范！"
    echo ""
    echo "需要完整总结部分。格式："
    echo "[前缀]标题总结"
    echo ""
    echo "完整总结"
    exit 1
fi

# 校验第二行是否为空行
second_line=$(echo "$commit_msg" | sed -n '2p')
if [ -n "$second_line" ]; then
    echo "❌ 提交信息格式不规范！"
    echo ""
    echo "标题和总结之间需要空行分隔。格式："
    echo "[前缀]标题总结"
    echo ""
    echo "完整总结"
    exit 1
fi

# 校验第三行是否有内容
third_line=$(echo "$commit_msg" | sed -n '3p')
if [ -z "$third_line" ]; then
    echo "❌ 提交信息格式不规范！"
    echo ""
    echo "需要完整总结部分。格式："
    echo "[前缀]标题总结"
    echo ""
    echo "完整总结"
    exit 1
fi

exit 0
