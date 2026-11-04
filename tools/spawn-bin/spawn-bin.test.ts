import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { expect, it } from "vitest";

import { corepackBin } from "./corepack-bin.mjs";
import { packageBin } from "./package-bin.mjs";
import { spawnCommand } from "./spawn-bin.mjs";
import type { CommandResult, SpawnFn } from "./spawn-bin.mjs";

const JS_BINS = ["prettier", "eslint", "tsc"] as const;

interface SpawnCall {
  command: string;
  args: readonly string[];
  shell: boolean | undefined;
}

function recordSpawn(calls: SpawnCall[]) {
  const spawn: SpawnFn = (command, args, options) => {
    calls.push({ command, args, shell: options?.shell });
    return { status: 0, stdout: "", stderr: "" };
  };
  return spawn;
}

function assertNodeEntry(
  command: string,
  args: readonly string[],
  entry: string,
) {
  expect(command).toBe(process.execPath);
  expect(args[0]).toBe(entry);
  expect(entry.endsWith(".cmd")).toBe(false);
  expect(entry).not.toMatch(/[/\\]\.bin[/\\]/);
  expect(path.isAbsolute(entry)).toBe(true);
  expect(existsSync(entry)).toBe(true);
}

it("spawns node with the package JS entry and does not spawn a .cmd shim", () => {
  for (const name of JS_BINS) {
    const entry = packageBin(name);
    expect(entry).toBeTruthy();
    const calls: SpawnCall[] = [];
    const result = spawnCommand({
      command: name,
      args: ["--version"],
      spawn: recordSpawn(calls),
    });
    expect(result.status).toBe(0);
    expect(calls).toHaveLength(1);
    const call = calls[0];
    if (!call || !entry) {
      throw new Error("missing spawn");
    }
    assertNodeEntry(call.command, call.args, entry);
    expect(call.args.slice(1)).toEqual(["--version"]);
    expect(call.shell).toBeUndefined();
    expect(call.command.endsWith(".cmd")).toBe(false);
  }
});

it("passes the prettier glob as argv to the JS entry and does not enable a shell", () => {
  const glob = "**/*.{ts,tsx,mjs,js,cjs}";
  const entry = packageBin("prettier");
  const calls: SpawnCall[] = [];
  spawnCommand({
    command: "prettier",
    args: ["--check", glob],
    options: { encoding: "utf8" },
    spawn: recordSpawn(calls),
  });
  expect(calls).toEqual([
    {
      command: process.execPath,
      args: [entry, "--check", glob],
      shell: undefined,
    },
  ]);
});

it("spawns git directly and does not wrap it as node or .cmd", () => {
  const calls: SpawnCall[] = [];
  spawnCommand({
    command: "git",
    args: ["diff", "--exit-code"],
    spawn: recordSpawn(calls),
  });
  expect(calls).toEqual([
    {
      command: "git",
      args: ["diff", "--exit-code"],
      shell: undefined,
    },
  ]);
});

it("spawns node with corepack.js from the Unix layout", () => {
  const entry = corepackBin(process.execPath);
  expect(entry).toBe(
    path.resolve(
      path.dirname(process.execPath),
      "..",
      "lib",
      "node_modules",
      "corepack",
      "dist",
      "corepack.js",
    ),
  );
  const calls: SpawnCall[] = [];
  spawnCommand({
    command: "corepack",
    args: ["pnpm", "licenses", "list", "--json"],
    spawn: recordSpawn(calls),
  });
  expect(calls).toHaveLength(1);
  const call = calls[0];
  if (!call || !entry) {
    throw new Error("missing corepack");
  }
  assertNodeEntry(call.command, call.args, entry);
  expect(call.args.slice(1)).toEqual(["pnpm", "licenses", "list", "--json"]);
  expect(call.shell).toBeUndefined();
});

it("spawns node.exe with corepack.js beside it on the Windows layout", () => {
  const execPath = "C:\\Program Files\\nodejs\\node.exe";
  const entry =
    "C:\\Program Files\\nodejs\\node_modules\\corepack\\dist\\corepack.js";
  const calls: SpawnCall[] = [];
  const result = spawnCommand({
    command: "corepack",
    args: ["pnpm", "licenses", "list", "--json"],
    execPath,
    pathApi: path.win32,
    exists: (candidate) => candidate === entry,
    spawn: recordSpawn(calls),
  });
  expect(result.status).toBe(0);
  expect(calls).toEqual([
    {
      command: execPath,
      args: [entry, "pnpm", "licenses", "list", "--json"],
      shell: undefined,
    },
  ]);
  expect(entry.endsWith(".cmd")).toBe(false);
});

it("returns ENOENT when corepack.js is not next to node", () => {
  const calls: string[] = [];
  const spawn: SpawnFn = (command) => {
    calls.push(command);
    return { status: 0, stdout: "", stderr: "" };
  };
  const result: CommandResult = spawnCommand({
    command: "corepack",
    args: [],
    execPath: "C:\\node.exe",
    pathApi: path.win32,
    exists: () => false,
    spawn,
  });
  expect(calls).toEqual([]);
  expect(result.error?.code).toBe("ENOENT");
  expect(result.error?.message).toBe("corepack.js was not found next to node");
});
