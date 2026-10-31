import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const scratch = path.resolve("tools/.gate-scratch");
const eslint = path.resolve("node_modules/.bin/eslint");

function lint(rel: string) {
  try {
    execFileSync(eslint, ["--no-ignore", rel], { encoding: "utf8" });
    return { status: 0, output: "" };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failed.status ?? 1,
      output: `${failed.stdout ?? ""}\n${failed.stderr ?? ""}`,
    };
  }
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
    expect(complexity.output).toContain("complexity");

    const body = Array.from({ length: 90 }, (_, index) => {
      const label = String(index);
      return `  const n${label} = 1;`;
    }).join("\n");
    writeFileSync(path.join(scratch, "long.mjs"), `export function tooLong() {\n${body}\n}\n`);
    const longFile = lint("tools/.gate-scratch/long.mjs");
    expect(longFile.status).not.toBe(0);
    expect(longFile.output).toContain("max-lines-per-function");

    writeFileSync(path.join(scratch, "let.mjs"), "let value = 1;\nexport const n = value;\n");
    expect(lint("tools/.gate-scratch/let.mjs").output).toContain("F-06");

    writeFileSync(path.join(scratch, "katex.mjs"), 'import katex from "katex";\nexport const used = katex;\n');
    expect(lint("tools/.gate-scratch/katex.mjs").output).toContain("katex");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
