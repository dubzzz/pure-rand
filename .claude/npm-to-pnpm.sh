#!/bin/bash
INPUT=$(cat /dev/stdin)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

NEW_CMD="$CMD"
NEW_CMD=$(printf '%s' "$NEW_CMD" | sed 's/\bnpx\b/pnpm dlx/g')
NEW_CMD=$(printf '%s' "$NEW_CMD" | sed 's/\bnpm\b/pnpm/g')
NEW_CMD=$(printf '%s' "$NEW_CMD" | sed 's/\byarn\b/pnpm/g')

if [ "$NEW_CMD" != "$CMD" ]; then
  printf '%s' "$INPUT" | jq -c --arg cmd "$NEW_CMD" '{decision: "modify", tool_input: (.tool_input | .command = $cmd), reason: ("This project uses pnpm. Replaced command: " + $cmd)}'
else
  echo '{"decision":"approve"}'
fi
