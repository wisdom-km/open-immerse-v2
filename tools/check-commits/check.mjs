import { spawnSync } from "node:child_process";

const subjectPattern =
  /^(feat|fix|docs|refactor|test|chore|build|ci)(\([a-z0-9-]+\))?!?: .+/;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1) {
    return process.argv[index + 1];
  }
  return process.env.GATE_BASE ?? fallback;
}

function subjects(base) {
  const result = spawnSync(
    "git",
    ["log", "--no-merges", "--format=%s", `${base}..HEAD`],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status === null ? 1 : result.status);
  }
  return result.stdout.split("\n").filter(Boolean);
}

const failures = subjects(option("--base", "main")).filter(
  (subject) => !subjectPattern.test(subject),
);

if (failures.length > 0) {
  console.error("check-commits: Conventional Commits rejected (RULES §2, E-P1-5)");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log("check-commits: subjects match Conventional Commits");
