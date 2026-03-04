const fs = require("fs");
const input = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const cmd = input.tool_input?.command || "";

const replacements = [
  [/\bnpx\b/g, "pnpm dlx"],
  [/\bnpm\b/g, "pnpm"],
  [/\byarn\b/g, "pnpm"],
];

let newCmd = cmd;
for (const [pattern, replacement] of replacements) {
  newCmd = newCmd.replace(pattern, replacement);
}

if (newCmd !== cmd) {
  const reason = "This project uses pnpm. Replaced command: " + newCmd;
  const result = { decision: "modify", tool_input: { ...input.tool_input, command: newCmd }, reason };
  process.stdout.write(JSON.stringify(result));
} else {
  process.stdout.write(JSON.stringify({ decision: "approve" }));
}
