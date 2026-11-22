import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const mainDir = path.join(repoRoot, "apps/desktop/src/main");
const childScript = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "view-menu-native-electron.mjs",
);
const slotLabels = ["原文", "对照", "译文"] as const;

it("reads real menu items after menu will show", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "oi-view-menu-"));
  try {
    const reports = parseReports(await runElectron(await compilePair(dir)));
    expectPlain(reportFor(reports, "none"));
    expectRadio(reportFor(reports, "original"), "原文");
    expectRadio(reportFor(reports, "contrast"), "对照");
    expectRadio(reportFor(reports, "translation"), "译文");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}, 180_000);

async function compilePair(dir: string): Promise<string> {
  const outDir = path.join(dir, "out");
  const configPath = path.join(dir, "tsconfig.json");
  await writeFile(configPath, JSON.stringify(compilerConfig(outDir)));
  const tsc = path.join(repoRoot, "node_modules/typescript/lib/tsc.js");
  const result = await run(process.execPath, [tsc, "-p", configPath]);
  if (result.code !== 0) {
    throw new Error(`tsc exit ${String(result.code)}\n${result.stderr}`);
  }
  await writeFile(path.join(outDir, "package.json"), '{ "type": "module" }\n');
  return outDir;
}

function compilerConfig(outDir: string): {
  readonly compilerOptions: Record<string, unknown>;
  readonly files: readonly string[];
} {
  return {
    compilerOptions: {
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noImplicitOverride: true,
      noFallthroughCasesInSwitch: true,
      useUnknownInCatchVariables: true,
      verbatimModuleSyntax: true,
      noEmit: false,
      module: "nodenext",
      moduleResolution: "nodenext",
      target: "ES2023",
      lib: ["ES2023"],
      types: [],
      skipLibCheck: true,
      isolatedModules: true,
      outDir,
      rootDir: mainDir,
      sourceMap: false,
    },
    files: [
      path.join(mainDir, "library-menu.ts"),
      path.join(mainDir, "view-menu-mirror.ts"),
    ],
  };
}

function electronBinary(): string {
  const required: unknown = createRequire(import.meta.url)("electron");
  if (typeof required !== "string" || required.length === 0) {
    throw new Error("electron binary path missing");
  }
  return required;
}

async function runElectron(outDir: string): Promise<string> {
  const result = await run(electronBinary(), [childScript, outDir]);
  if (result.code !== 0) {
    throw new Error(
      `electron exit ${String(result.code)}\n${result.stderr}\n${result.stdout}`,
    );
  }
  return result.stdout;
}

function run(
  command: string,
  args: readonly string[],
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { windowsHide: true });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

type Observed = {
  readonly label: string;
  readonly type: string;
  readonly checked: boolean;
};

type Report = {
  readonly shape: string;
  readonly items: readonly Observed[];
};

function parseReports(stdout: string): readonly Report[] {
  const reports = stdout
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => readReport(JSON.parse(line) as unknown));
  expect(reports.map((report) => report.shape)).toEqual([
    "none",
    "original",
    "contrast",
    "translation",
  ]);
  return reports;
}

function readReport(value: unknown): Report {
  if (typeof value !== "object" || value === null) throw new Error("report");
  const record = value as { shape?: unknown; items?: unknown };
  if (typeof record.shape !== "string" || !Array.isArray(record.items)) {
    throw new Error("report shape");
  }
  return {
    shape: record.shape,
    items: record.items.map(readItem),
  };
}

function readItem(value: unknown): Observed {
  if (typeof value !== "object" || value === null) throw new Error("item");
  const record = value as {
    label?: unknown;
    type?: unknown;
    checked?: unknown;
  };
  if (
    typeof record.label !== "string" ||
    typeof record.type !== "string" ||
    typeof record.checked !== "boolean"
  ) {
    throw new Error("item fields");
  }
  return { label: record.label, type: record.type, checked: record.checked };
}

function reportFor(reports: readonly Report[], shape: string): Report {
  const found = reports.find((report) => report.shape === shape);
  if (found === undefined) throw new Error(shape);
  return found;
}

function slotsOf(report: Report): readonly Observed[] {
  expect(report.items.some((item) => item.label === "无")).toBe(false);
  return slotLabels.map((label) => {
    const hits = report.items.filter((item) => item.label === label);
    expect(hits).toHaveLength(1);
    const hit = hits[0];
    if (hit === undefined) throw new Error(label);
    return hit;
  });
}

function expectPlain(report: Report): void {
  for (const slot of slotsOf(report)) {
    expect(slot.type).toBe("normal");
    expect(slot.checked).toBe(false);
  }
}

function expectRadio(report: Report, label: string): void {
  const slots = slotsOf(report);
  for (const slot of slots) expect(slot.type).toBe("radio");
  const checked = slots.filter((slot) => slot.checked);
  expect(checked.map((slot) => slot.label)).toEqual([label]);
}
