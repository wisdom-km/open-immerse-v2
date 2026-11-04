import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { launchDepcruise } from "../check-deps/launch-depcruise.mjs";
import { compareGraph, renderReport } from "./compare.mjs";
import { parseMermaid } from "./parse-mermaid.mjs";
import { reduceCruise } from "./reduce.mjs";

function option(argv, name) {
  const index = argv.indexOf(name);
  const value = index === -1 ? undefined : argv[index + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }
  return value;
}

function parseCruise(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function launchCruise(io) {
  const roots = ["packages", "apps"].filter((dir) =>
    io.exists(path.join(io.cwd, dir)),
  );
  if (roots.length === 0) {
    return { ok: true, cruise: { modules: [] } };
  }
  const result = launchDepcruise(io.spawn, [
    "--config",
    "dependency-cruiser.config.mjs",
    "--output-type",
    "json",
    ...roots,
  ]);
  const parsed = parseCruise(result.stdout ?? "");
  if (!parsed) {
    const detail = result.stderr ?? "";
    return {
      ok: false,
      message: detail
        ? detail
        : "dependency-cruiser JSON could not be parsed\n",
    };
  }
  return { ok: true, cruise: parsed };
}

function loadCruise(argv, io) {
  const cruisePath = option(argv, "--cruise-json");
  if (!cruisePath) {
    return launchCruise(io);
  }
  try {
    const parsed = parseCruise(io.readFile(path.resolve(io.cwd, cruisePath)));
    if (!parsed) {
      return { ok: false, message: "cruise JSON could not be parsed\n" };
    }
    return { ok: true, cruise: parsed };
  } catch {
    return { ok: false, message: "cruise JSON could not be parsed\n" };
  }
}

export function run(argv, io) {
  const mermaidPath = option(argv, "--mermaid") ?? "docs/arch/05-01.md";
  let markdown;
  try {
    markdown = io.readFile(path.resolve(io.cwd, mermaidPath));
  } catch {
    io.stderr.write(`arch-graph: cannot read ${mermaidPath}\n`);
    return 1;
  }
  const loaded = loadCruise(argv, io);
  if (!loaded.ok) {
    io.stderr.write(loaded.message);
    return 1;
  }
  const report = compareGraph(
    parseMermaid(markdown),
    reduceCruise(loaded.cruise, (rel) => {
      try {
        return io.readFile(path.resolve(io.cwd, rel));
      } catch {
        return "";
      }
    }),
  );
  io.stdout.write(renderReport(report));
  const strictHit =
    report.undocumented.length > 0 ||
    report.unmapped.length > 0 ||
    report.indexes.length > 0;
  if (argv.includes("--strict") && strictHit) {
    return 1;
  }
  return 0;
}

function defaultIo() {
  return {
    spawn: spawnSync,
    stdout: process.stdout,
    stderr: process.stderr,
    cwd: process.cwd(),
    readFile: (file) => readFileSync(file, "utf8"),
    exists: existsSync,
  };
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(invoked).href) {
  process.exitCode = run(process.argv.slice(2), defaultIo());
}
