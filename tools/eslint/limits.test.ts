import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

const scratch = path.resolve("tools/.gate-scratch");
const eslint = path.resolve("node_modules/.bin/eslint");
const runner = path.resolve("tools/gate-remediation/run.mjs");

function lint(rel: string) {
  return spawnSync("node", [runner, "--id", "G2", "--", eslint, "--no-ignore", rel], {
    encoding: "utf8",
  });
}

function branchy(name: string) {
  const lines = [`export function ${name}(n) {`];
  for (let index = 0; index < 16; index += 1) {
    const label = String(index);
    lines.push(`  if (n === ${label}) return ${label};`);
  }
  lines.push("  return -1;", "}", "");
  return lines.join("\n");
}

it("rejects complexity over 15 and functions over 80 lines (G2)", () => {
  mkdirSync(scratch, { recursive: true });
  try {
    writeFileSync(path.join(scratch, "complex.mjs"), branchy("tooComplex"));
    const complexity = lint("tools/.gate-scratch/complex.mjs");
    expect(complexity.status).not.toBe(0);
    expect(commandOutput(complexity)).toContain("complexity");
    expect(commandOutput(complexity)).toContain(remediationBlock("G2"));

    const body = Array.from({ length: 90 }, (_, index) => {
      const label = String(index);
      return `  const n${label} = 1;`;
    }).join("\n");
    writeFileSync(path.join(scratch, "long.mjs"), `export function tooLong() {\n${body}\n}\n`);
    const longFile = lint("tools/.gate-scratch/long.mjs");
    expect(longFile.status).not.toBe(0);
    expect(commandOutput(longFile)).toContain("max-lines-per-function");
    expect(commandOutput(longFile)).toContain(remediationBlock("G2"));

    writeFileSync(path.join(scratch, "let.mjs"), "let value = 1;\nexport const n = value;\n");
    const letFile = lint("tools/.gate-scratch/let.mjs");
    expect(commandOutput(letFile)).toContain("F-06");
    expect(commandOutput(letFile)).toContain(remediationBlock("G2"));

    writeFileSync(path.join(scratch, "katex.mjs"), 'import katex from "katex";\nexport const used = katex;\n');
    const katexFile = lint("tools/.gate-scratch/katex.mjs");
    expect(commandOutput(katexFile)).toContain("katex");
    expect(commandOutput(katexFile)).toContain(remediationBlock("G2"));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
