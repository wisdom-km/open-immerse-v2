import { spawnSync } from "node:child_process";

export function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    const detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
    throw new Error(detail || command);
  }
  return result.stdout ?? "";
}

export function assertPinned(reported, pinned) {
  const tokens = reported.trim().split(/\s+/);
  if (!tokens.includes(pinned)) {
    throw new Error("datamodel-code-generator pin");
  }
}
