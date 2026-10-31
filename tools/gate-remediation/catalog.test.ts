import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const skipNames = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".venv",
  "gate-fixtures",
  "__pycache__",
]);

const explicitCallers: Record<string, readonly string[]> = {
  G1: [".github/workflows/ci.yml"],
  G2: ["package.json", ".github/workflows/ci.yml"],
  G3: ["tools/typecheck.mjs"],
  "G3-pyright": [".github/workflows/ci.yml"],
  G4: ["tools/check-file-size/check.mjs"],
  G5: ["tools/check-deps/check.mjs"],
  G6: [".github/workflows/ci.yml"],
  G7: ["package.json"],
  G8: [".github/workflows/ci.yml"],
  G9: [".github/workflows/ci.yml"],
  G10: [
    "tools/check-license/check-npm.mjs",
    "tools/check-license/check-pip.mjs",
    "tools/check-license/check-models.mjs",
    ".github/workflows/ci.yml",
  ],
  G11: ["tools/check-hotspots/check.mjs"],
  G12: ["tools/check-pr-size/check.mjs"],
  G14: ["package.json"],
  G16: ["tools/check-core-tests/check.mjs"],
  G18: ["tools/check-one-slice/check.mjs"],
  "E-P1-5": ["tools/check-commits/check.mjs"],
};

function readOne(value: unknown): { id: string; match: string[] } {
  if (typeof value !== "object" || value === null) {
    throw new Error("catalog gate is not an object");
  }
  if (!("id" in value) || typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("catalog gate is missing id");
  }
  const id = value.id;
  if (!("match" in value) || !Array.isArray(value.match)) {
    throw new Error(`catalog gate ${id} match is invalid`);
  }
  const match: string[] = [];
  for (const needle of value.match) {
    if (typeof needle !== "string" || needle.length === 0) {
      throw new Error(`catalog gate ${id} match is invalid`);
    }
    match.push(needle);
  }
  return { id, match };
}

function readCatalog(): Array<{ id: string; match: string[] }> {
  const parsed: unknown = JSON.parse(readFileSync("tools/gate-remediation/catalog.json", "utf8"));
  if (typeof parsed !== "object" || parsed === null || !("gates" in parsed)) {
    throw new Error("catalog.json has no gates");
  }
  if (!Array.isArray(parsed.gates) || parsed.gates.length === 0) {
    throw new Error("catalog.json has no gates");
  }
  return parsed.gates.map((gate: unknown) => readOne(gate));
}

function tableRows(table: string): string[][] {
  return table
    .trim()
    .split("\n")
    .slice(2)
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

function mentions(source: string, id: string): boolean {
  const boundary = "(?![A-Za-z0-9-])";
  const patterns = [
    new RegExp(`--id ${id}${boundary}`),
    new RegExp(`\\["${id}"\\]`),
    new RegExp(`"${id}"${boundary}`),
    new RegExp(`format\\.mjs"? ${id}${boundary}`),
  ];
  return patterns.some((pattern) => pattern.test(source));
}

function collect(dir: string, found: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(full, found);
      continue;
    }
    if (entry.isFile() && /\.(mjs|cjs|js|ts|tsx|py|yml|md|json)$/.test(entry.name)) {
      found.push(full);
    }
  }
}

it("keeps the remediation table equal to catalog.json", () => {
  const rendered = execFileSync("node", ["tools/gate-remediation/format.mjs", "--table"], {
    encoding: "utf8",
  }).trim();
  const docs = readFileSync("docs/gate-remediation.md", "utf8");
  const start = docs.indexOf("<!-- gate-remediation-table:start -->");
  const end = docs.indexOf("<!-- gate-remediation-table:end -->");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const slice = docs.slice(start + "<!-- gate-remediation-table:start -->".length, end).trim();
  expect(slice).toBe(rendered);
  const rows = tableRows(rendered);
  expect(rows.map((row) => row[0])).toEqual(readCatalog().map((gate) => gate.id));
  for (const row of rows) {
    expect(row).toHaveLength(4);
    expect(row.every((cell) => cell.length > 0)).toBe(true);
  }
});

it("does not copy remediation sentences into scripts", () => {
  const rows = tableRows(
    execFileSync("node", ["tools/gate-remediation/format.mjs", "--table"], { encoding: "utf8" }),
  );
  const allowed = new Set([
    path.resolve("tools/gate-remediation/catalog.json"),
    path.resolve("docs/gate-remediation.md"),
  ]);
  const files: string[] = [];
  collect(".", files);
  const copies: string[] = [];
  for (const file of files) {
    if (allowed.has(path.resolve(file))) {
      continue;
    }
    const source = readFileSync(file, "utf8");
    for (const row of rows) {
      const problem = row[1] ?? "";
      const fix = row[2] ?? "";
      if (source.includes(problem) || source.includes(fix)) {
        copies.push(`${file} copies ${row[0] ?? ""}`);
      }
    }
  }
  expect(copies).toEqual([]);
});

it("points every gate id at a script or a dependency-cruiser rule", () => {
  const rules = readFileSync("tools/check-deps/build-rules.mjs", "utf8");
  const gates = readCatalog();
  expect(readFileSync("tools/check-deps/check.mjs", "utf8")).toContain("matchedIds");
  for (const gate of gates) {
    for (const needle of gate.match) {
      expect(rules, needle).toContain(`"${needle}"`);
    }
    const callers = explicitCallers[gate.id];
    if (callers === undefined) {
      expect(gate.match.length, gate.id).toBeGreaterThan(0);
      continue;
    }
    for (const file of callers) {
      expect(mentions(readFileSync(file, "utf8"), gate.id), `${gate.id} in ${file}`).toBe(true);
    }
  }
  for (const id of Object.keys(explicitCallers)) {
    expect(gates.some((gate) => gate.id === id), id).toBe(true);
  }
});
