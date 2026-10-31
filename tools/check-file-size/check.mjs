import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skipDirectories = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".venv",
  "__pycache__",
  ".ruff_cache",
  ".pytest_cache",
  "gate-fixtures",
]);
const entryFiles = new Set([
  "apps/desktop/src/main/index.ts",
  "apps/desktop/src/main/composition-root.ts",
  "apps/desktop/src/preload/index.ts",
  "apps/desktop/src/renderer/main.tsx",
  "workers/parser/oi_worker/__main__.py",
]);
const limits = { source: 600, entry: 150, component: 400, test: 800 };

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function lineCount(content) {
  if (content.length === 0) {
    return 0;
  }
  const parts = content.split("\n");
  return content.endsWith("\n") ? parts.length - 1 : parts.length;
}

function globToRegExp(pattern) {
  const body = pattern
    .split("**")
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join(".*");
  return new RegExp(`^${body}$`);
}

function isTest(rel) {
  return (
    rel.includes("/test/") ||
    rel.includes("/tests/") ||
    rel.startsWith("test/") ||
    rel.startsWith("tests/") ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel)
  );
}

function limitFor(rel) {
  if (entryFiles.has(rel)) {
    return limits.entry;
  }
  if (isTest(rel)) {
    return limits.test;
  }
  if (rel.endsWith(".tsx")) {
    return limits.component;
  }
  return limits.source;
}

function isSource(rel) {
  return rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".py");
}

function loadAllowlist(file) {
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  for (const item of parsed.ignore ?? []) {
    if (!item.pattern || !item.reason) {
      throw new Error("ignore entry needs pattern and reason");
    }
  }
  for (const item of parsed.exemptions ?? []) {
    if (!item.path || !item.reason || !item.adr || !item.expiresMilestone) {
      throw new Error("exemption needs path, reason, adr, and expiresMilestone");
    }
  }
  return {
    ignore: (parsed.ignore ?? []).map((item) => globToRegExp(item.pattern)),
    exemptions: new Set((parsed.exemptions ?? []).map((item) => item.path)),
  };
}

async function collect(root, directory, found) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirectories.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(root, fullPath, found);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const rel = path.relative(root, fullPath).split(path.sep).join("/");
    if (isSource(rel)) {
      found.push({ rel, fullPath });
    }
  }
}

const root = path.resolve(option("--root", process.cwd()));
const allowlist = loadAllowlist(
  path.resolve(option("--allowlist", path.join(scriptDir, "allowlist.json"))),
);
const files = [];
await collect(root, root, files);

const failures = [];
for (const file of files) {
  if (allowlist.ignore.some((pattern) => pattern.test(file.rel))) {
    continue;
  }
  const count = lineCount(await readFile(file.fullPath, "utf8"));
  const limit = limitFor(file.rel);
  if (count > limit && !allowlist.exemptions.has(file.rel)) {
    failures.push(`${file.rel}: ${count} lines > ${limit}`);
  }
}

if (failures.length > 0) {
  console.error("check-file-size: hard limit exceeded (G4, ARCHITECTURE §6)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log(`check-file-size: ${files.length} source files within hard limits`);
