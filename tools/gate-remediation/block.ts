import { execFileSync } from "node:child_process";
import path from "node:path";

export function remediationBlock(id: string): string {
  return execFileSync("node", [path.resolve("tools/gate-remediation/format.mjs"), id], {
    encoding: "utf8",
  }).trim();
}

export function commandOutput(result: { stdout?: string | null; stderr?: string | null }): string {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}
