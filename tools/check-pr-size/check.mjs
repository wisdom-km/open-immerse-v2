import { spawnSync } from "node:child_process";

const limit = 600;
const generated = ["pnpm-lock.yaml", "workers/parser/uv.lock"];
const generatedPrefixes = ["workers/parser/oi_worker/protocol/"];

function isGenerated(file) {
  return (
    generated.includes(file) ||
    file.startsWith("dist/") ||
    generatedPrefixes.some((prefix) => file.startsWith(prefix))
  );
}

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
  const rows = git(["diff", "--numstat", `${base}...HEAD`])
    .split("\n")
    .filter(Boolean);
  let total = 0;
  for (const row of rows) {
    const [added, deleted, file] = row.split("\t");
    if (!file || isGenerated(file)) {
      continue;
    }
    const add = added === "-" ? 0 : Number(added);
    const del = deleted === "-" ? 0 : Number(deleted);
    total += add + del;
  }
  return total;
}

function contractsOnly(base) {
  const files = git(["diff", "--name-only", `${base}...HEAD`])
    .split("\n")
    .filter((file) => file.length > 0 && !isGenerated(file));
  return (
    files.length > 0 &&
    files.every((file) => file.startsWith("packages/contracts/"))
  );
}

const base = option("--base", "main");
const total = countedLines(base);
const hint = contractsOnly(base) ? 200 : limit;
console.log(`check-pr-size: ${total} non-generated lines ("G12")`);
if (total > hint) {
  console.log(`check-pr-size: former hint ${hint}`);
}
