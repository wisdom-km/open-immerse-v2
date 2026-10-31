import { spawnSync } from "node:child_process";

const limit = 600;
const generated = ["pnpm-lock.yaml", "workers/parser/uv.lock"];

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1) {
    return process.argv[index + 1];
  }
  return process.env.GATE_BASE ?? fallback;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status === null ? 1 : result.status);
  }
  return result.stdout;
}

function countedLines(base) {
  const rows = git(["diff", "--numstat", `${base}...HEAD`]).split("\n").filter(Boolean);
  let total = 0;
  for (const row of rows) {
    const [added, deleted, file] = row.split("\t");
    if (!file || generated.includes(file) || file.startsWith("dist/")) {
      continue;
    }
    const add = added === "-" ? 0 : Number(added);
    const del = deleted === "-" ? 0 : Number(deleted);
    total += add + del;
  }
  return total;
}

function hasReason() {
  const fromEnv = process.env.PR_BODY ?? "";
  if (fromEnv.includes("G12:")) {
    return true;
  }
  const base = option("--base", "main");
  return git(["log", "--format=%B", `${base}..HEAD`]).includes("G12:");
}

function contractsOnly(base) {
  const files = git(["diff", "--name-only", `${base}...HEAD`])
    .split("\n")
    .filter((file) => file.length > 0 && !generated.includes(file) && !file.startsWith("dist/"));
  return files.length > 0 && files.every((file) => file.startsWith("packages/contracts/"));
}

const base = option("--base", "main");
const total = countedLines(base);
const contractLimit = contractsOnly(base) ? 200 : limit;
if (total > contractLimit && !hasReason()) {
  console.error(
    `check-pr-size: ${total} non-generated lines > ${contractLimit} without a G12: reason (G12)`,
  );
  process.exit(1);
}

console.log(`check-pr-size: ${total} non-generated lines`);
