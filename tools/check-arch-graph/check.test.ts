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

function repoIo(stdout: string[], stderr: string[]): CheckIo {
  return {
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
  };
}

function withRoot(
  files: Readonly<Record<string, string>>,
  check: (root: string) => void,
): void {
  const root = mkdtempSync(path.join(tmpdir(), "arch-graph-"));
  try {
    for (const [rel, text] of Object.entries(files)) {
      const file = path.join(root, rel);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    }
    check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it("exits 0 against the repository graph and prints the four counts", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = run([], repoIo(stdout, stderr));
  expect(stderr.join("")).toBe("");
  expect(code).toBe(0);
  const text = stdout.join("");
  expect(text).toContain("arch-graph: undocumented 0\n");
  // library realizes APP→DOM, APP→C, APP→K, ADP→APP, ADP→DOM, ADP→PN.
  // desktop wiring realizes MAIN→ADP and MAIN→APP.
  expect(text).toContain("arch-graph: planned 14\n");
  expect(text).toContain("arch-graph: unmapped 0\n");
  expect(text).toContain("arch-graph: index 0\n");
});

it("exits 0 in strict mode against the repository graph", () => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = run(["--strict"], repoIo(stdout, stderr));
  expect(stderr.join("")).toBe("");
  expect(code).toBe(0);
  const text = stdout.join("");
  expect(text).toContain("arch-graph: undocumented 0\n");
  expect(text).toContain("arch-graph: unmapped 0\n");
});

it("exits 1 in strict mode when only an unmapped edge is present", () => {
  const cruise = {
    modules: [
      {
        source: "packages/features/jobs/src/notes.ts",
        dependencies: [
          {
            module: "@oi/contracts",
            resolved: "packages/contracts/src/index.ts",
            dependencyTypes: ["aliased", "import"],
          },
        ],
      },
    ],
  };
  withRoot(
    {
      "docs-arch.md": "```mermaid\nDOM --> C\n```\n",
      "cruise.json": JSON.stringify(cruise),
      "packages/features/jobs/src/notes.ts":
        'import { JobId } from "@oi/contracts";\n',
    },
    (root) => {
      const stdout: string[] = [];
      const args = [
        "--mermaid",
        "docs-arch.md",
        "--cruise-json",
        "cruise.json",
      ];
      expect(run(args, ioFor(root, stdout, []))).toBe(0);
      expect(stdout.join("")).toContain(
        "arch-edge-unmapped\t?\tC\tpackages/features/jobs/src/notes.ts:1",
      );
      expect(run(["--strict", ...args], ioFor(root, [], []))).toBe(1);
    },
  );
});

it("exits 0 in strict mode when a pure index re-export has no importer", () => {
  const cruise = {
    modules: [
      {
        source: "packages/features/jobs/src/index.ts",
        dependencies: [
          {
            module: "./domain/job-id.js",
            resolved: "packages/features/jobs/src/domain/job-id.ts",
            dependencyTypes: ["local", "export"],
          },
        ],
      },
    ],
  };
  withRoot(
    {
      "docs-arch.md": "```mermaid\nDOM --> C\n```\n",
      "cruise.json": JSON.stringify(cruise),
      "packages/features/jobs/src/index.ts":
        'export { parseJobId } from "./domain/job-id.js";\n',
    },
    (root) => {
      const stdout: string[] = [];
      const code = run(
        [
          "--strict",
          "--mermaid",
          "docs-arch.md",
          "--cruise-json",
          "cruise.json",
        ],
        ioFor(root, stdout, []),
      );
      expect(code).toBe(0);
      const text = stdout.join("");
      expect(text).toContain("arch-graph: unmapped 0\n");
      expect(text).toContain("arch-graph: index 0\n");
      expect(text).not.toContain("arch-edge-unmapped");
    },
  );
});

it("reports a feature index that contains a statement other than a re-export", () => {
  const cruise = {
    modules: [
      {
        source: "packages/features/jobs/src/index.ts",
        dependencies: [],
      },
    ],
  };
  withRoot(
    {
      "docs-arch.md": "```mermaid\nDOM --> C\n```\n",
      "cruise.json": JSON.stringify(cruise),
      "packages/features/jobs/src/index.ts": "export const ready = 1;\n",
    },
    (root) => {
      const stdout: string[] = [];
      const args = [
        "--mermaid",
        "docs-arch.md",
        "--cruise-json",
        "cruise.json",
      ];
      expect(run(args, ioFor(root, stdout, []))).toBe(0);
      expect(stdout.join("")).toContain(
        "arch-index\tpackages/features/jobs/src/index.ts:1",
      );
      expect(run(["--strict", ...args], ioFor(root, [], []))).toBe(1);
    },
  );
});
