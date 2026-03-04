const fs = require("fs");
const input = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const cmd = input.tool_input?.command || "";

// Check if the command uses npm (but not npx)
if (/\bnpm\b/.test(cmd)) {
  // Replace npm with pnpm, preserving the rest of the command
  const newCmd = cmd.replace(/\bnpm\b/g, "pnpm");
  const reason = "This project uses pnpm. Replaced npm with pnpm: " + newCmd;
  const result = { decision: "modify", tool_input: { ...input.tool_input, command: newCmd }, reason };
  process.stdout.write(JSON.stringify(result));
} else {
  process.stdout.write(JSON.stringify({ decision: "approve" }));
}
