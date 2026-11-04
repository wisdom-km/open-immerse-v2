import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, it } from "vitest";

import { run, type CheckIo } from "./check.mjs";

const mermaid = [
  "```mermaid",
  "flowchart TB",
  "  UI --> C",
  "  ADP --> WC",
  "```",
  "",
].join("\n");

const cruise = {
  modules: [
    {
      source: "packages/features/ingest/src/ui/panel.ts",
      dependencies: [
        {
          module: "../application/run.js",
          resolved: "packages/features/ingest/src/application/run.ts",
          dependencyTypes: ["local", "import"],
          coreModule: false,
        },
      ],
    },
  ],
};

function writeFixture(): string {
  const root = mkdtempSync(path.join(tmpdir(), "arch-graph-"));
  mkdirSync(
    path.dirname(path.join(root, "packages/features/ingest/src/ui/panel.ts")),
    {
      recursive: true,
    },
  );
  writeFileSync(path.join(root, "docs-arch.md"), mermaid);
  writeFileSync(path.join(root, "cruise.json"), JSON.stringify(cruise));
  writeFileSync(
    path.join(root, "packages/features/ingest/src/ui/panel.ts"),
    'import { run } from "../application/run.js";\n',
  );
  return root;
}

function ioFor(root: string, stdout: string[], stderr: string[]): CheckIo {
  return {
    spawn: () => ({ status: 0, stdout: "", stderr: "" }),
    stdout: {
      write(text: string) {
        stdout.push(text);
      },
    },
    stderr: {
      write(text: string) {
        stderr.push(text);
      },
    },
    cwd: root,
    readFile: (file: string) => readFileSync(file, "utf8"),
    exists: () => false,
  };
}

function withFixture(check: (root: string) => void): void {
  const root = writeFixture();
  try {
    check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it("stays at exit 0 in report-only mode when an edge is undocumented", () => {
  withFixture((root) => {
    const stdout: string[] = [];
    const code = run(
      ["--mermaid", "docs-arch.md", "--cruise-json", "cruise.json"],
      ioFor(root, stdout, []),
    );
    expect(code).toBe(0);
    const text = stdout.join("");
    expect(text).toContain(
      "arch-edge-undocumented\tUI\tAPP\tpackages/features/ingest/src/ui/panel.ts:1",
    );
    expect(text).toContain("arch-edge-planned\tADP\tWC");
    expect(text).toContain("修复：");
  });
});

it("exits 1 in strict mode when an undocumented edge is present", () => {
  withFixture((root) => {
    const code = run(
      ["--strict", "--mermaid", "docs-arch.md", "--cruise-json", "cruise.json"],
      ioFor(root, [], []),
    );
    expect(code).toBe(1);
  });
});

it("exits 1 when the mermaid file or cruise JSON cannot be read", () => {
  withFixture((root) => {
    const missing = ioFor(root, [], []);
    expect(run(["--mermaid", "missing.md"], missing)).toBe(1);
    expect(
      run(["--mermaid", "docs-arch.md", "--cruise-json", "nope.json"], missing),
    ).toBe(1);
  });
});

it("exits 0 against the repository graph and prints the three counts", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = run([], {
    spawn: spawnSync,
    stdout: {
      write(text: string) {
        stdout.push(text);
      },
    },
    stderr: {
      write(text: string) {
        stderr.push(text);
      },
    },
    cwd: process.cwd(),
    readFile: (file: string) => readFileSync(file, "utf8"),
    exists: existsSync,
  });
  expect(stderr.join("")).toBe("");
  expect(code).toBe(0);
  const text = stdout.join("");
  expect(text).toMatch(/^arch-graph: undocumented \d+\n/);
  expect(text).toMatch(/arch-graph: planned \d+\n/);
  expect(text).toMatch(/arch-graph: unmapped \d+\n/);
});
