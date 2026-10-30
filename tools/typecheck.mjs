import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

const SKIP_DIRECTORIES = new Set(["node_modules", "dist", "coverage"]);

async function containsTypeScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || SKIP_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (await containsTypeScript(fullPath)) {
        return true;
      }
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      return true;
    }
  }
  return false;
}

if (!(await containsTypeScript(process.cwd()))) {
  console.log("typecheck: no .ts or .tsx sources; skipped.");
  process.exit(0);
}

const result = spawnSync(
  "tsc",
  ["--noEmit", "--pretty", "false", "--project", "tsconfig.json"],
  { stdio: "inherit" },
);
process.exit(result.status === null ? 1 : result.status);
