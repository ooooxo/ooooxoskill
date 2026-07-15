#!/bin/bash
# PreToolUse(Bash) hook — nudges the agent toward a morii-card SERVE live card
# the moment it launches a test suite / long build. Silent (exit 0, no output)
# on every non-matching command; never blocks anything.
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c "import sys,json;print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null) || exit 0
case "$CMD" in
  ''|*relay.py*|*ViewCard*|*morii-index*|*serve-trigger-hook*) exit 0;;
esac
if printf '%s' "$CMD" | grep -qE '(^|[ /;&(])(pytest|vitest|jest|playwright|phpunit|rspec|ctest|tox)([ "]|$)|(bun|npm|pnpm|yarn)[ ]+(run[ ]+)?test|cargo[ ]+(test|build[ ]+--release)|go[ ]+test|mvn[ ]+test|gradle[ ]+test|docker[ ]+build'; then
  printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"Test/long run detected → morii-card SERVE mode applies: if no live progress card is up for this run, build one FIRST (read ~/.claude/skills/morii-card/SERVE.md), then kick the run. Skip only if the run is seconds-short or a SERVE card is already live."}}'
fi
exit 0
