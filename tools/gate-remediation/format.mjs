import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const catalogPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "catalog.json");

function fail(message) {
  throw new Error(message);
}

function readMatch(id, value) {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    fail(`gate ${id} match is invalid`);
  }
  const needles = [];
  for (const needle of value) {
    if (typeof needle !== "string" || needle.length === 0) {
      fail(`gate ${id} match is invalid`);
    }
    needles.push(needle);
  }
  return needles;
}

function readGate(value, seen) {
  if (typeof value !== "object" || value === null) {
    fail("gate remediation entry is incomplete");
  }
  const { id, problem, fix, spec, match } = value;
  if (
    typeof id !== "string" ||
    typeof problem !== "string" ||
    typeof fix !== "string" ||
    typeof spec !== "string" ||
    id.length === 0 ||
    problem.length === 0 ||
    fix.length === 0 ||
    spec.length === 0
  ) {
    fail("gate remediation entry is incomplete");
  }
  if (seen.has(id)) {
    fail(`duplicate gate ${id}`);
  }
  seen.add(id);
  const needles = readMatch(id, match);
  const flat = `${id}${problem}${fix}${spec}${needles.join("")}`;
  if (flat.includes("|") || flat.includes("\n")) {
    fail(`gate ${id} text contains a table separator`);
  }
  return { id, problem, fix, spec, match: needles };
}

export function loadCatalog() {
  const parsed = JSON.parse(readFileSync(catalogPath, "utf8"));
  if (typeof parsed !== "object" || parsed === null || !Array.isArray(parsed.gates)) {
    fail("gate remediation catalog is empty");
  }
  if (parsed.gates.length === 0) {
    fail("gate remediation catalog is empty");
  }
  const seen = new Set();
  return parsed.gates.map((gate) => readGate(gate, seen));
}

export function remediationBlock(id) {
  const gate = loadCatalog().find((item) => item.id === id);
  if (!gate) {
    fail(`unknown gate id ${id}`);
  }
  return [
    `gate-remediation: ${gate.id}`,
    `problem: ${gate.problem}`,
    `fix: ${gate.fix}`,
    `spec: ${gate.spec}`,
  ].join("\n");
}

export function matchedIds(output, fallback) {
  const hits = [];
  for (const gate of loadCatalog()) {
    if (gate.match.some((needle) => output.includes(needle))) {
      hits.push(gate.id);
    }
  }
  if (hits.length === 0) {
    return [fallback];
  }
  return hits;
}

export function writeRemediation(ids) {
  for (const id of ids) {
    console.error(remediationBlock(id));
  }
}

export function renderTable(gates) {
  const lines = ["| 编号 | 问题 | 怎么改 | 规格 |", "| --- | --- | --- | --- |"];
  for (const gate of gates) {
    lines.push(`| ${gate.id} | ${gate.problem} | ${gate.fix} | ${gate.spec} |`);
  }
  return lines.join("\n");
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--table") {
    process.stdout.write(`${renderTable(loadCatalog())}\n`);
    return;
  }
  if (args.length === 0) {
    console.error("usage: format.mjs --table | <id> [id...]");
    process.exit(2);
  }
  for (const id of args) {
    process.stdout.write(`${remediationBlock(id)}\n`);
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  return entry !== undefined && path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  runCli();
}
