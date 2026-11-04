import { expect, it } from "vitest";

import { spawnCommand } from "./spawn-bin.mjs";
import type { CommandResult, SpawnFn } from "./spawn-bin.mjs";

const SHIMS = ["prettier", "corepack", "eslint", "tsc"] as const;

function win32Lookup(command: string): CommandResult {
  const executables = new Set(["git", "node", "uv"]);
  const shims = new Set(SHIMS.map((name) => `${name}.cmd`));
  if (executables.has(command) || shims.has(command)) {
    return { status: 0, stdout: "", stderr: "" };
  }
  return {
    status: null,
    stdout: "",
    stderr: "",
    error: { code: "ENOENT", message: `spawn ${command} ENOENT` },
  };
}

function spawnWithoutCmd(
  spawn: SpawnFn,
  command: string,
  args: readonly string[],
): CommandResult {
  return spawn(command, args, {});
}

it("returns ENOENT on win32 when a shim is spawned once without .cmd", () => {
  for (const command of SHIMS) {
    const old = spawnWithoutCmd(win32Lookup, command, ["--check"]);
    expect(old.status).toBeNull();
    expect(old.error?.code).toBe("ENOENT");
  }
});

it("spawns the .cmd shim on win32 after the bare name is missing", () => {
  for (const command of SHIMS) {
    const seen: string[] = [];
    const spawn: SpawnFn = (file, args) => {
      seen.push(`${file} ${args.join(" ")}`);
      return win32Lookup(file);
    };
    const result = spawnCommand({
      command,
      args: ["--check"],
      platform: "win32",
      spawn,
    });
    expect(result.status).toBe(0);
    expect(seen).toEqual([`${command} --check`, `${command}.cmd --check`]);
  }
});

it("keeps the bare name on linux", () => {
  const seen: string[] = [];
  const spawn: SpawnFn = (command) => {
    seen.push(command);
    if (command === "prettier") {
      return { status: 0, stdout: "", stderr: "" };
    }
    return {
      status: null,
      stdout: "",
      stderr: "",
      error: { code: "ENOENT", message: `spawn ${command} ENOENT` },
    };
  };
  const result = spawnCommand({
    command: "prettier",
    args: ["--check"],
    platform: "linux",
    spawn,
  });
  expect(result.status).toBe(0);
  expect(seen).toEqual(["prettier"]);
});

it("does not append .cmd when win32 already resolves an .exe name", () => {
  const seen: string[] = [];
  const spawn: SpawnFn = (command) => {
    seen.push(command);
    return win32Lookup(command);
  };
  const result = spawnCommand({
    command: "git",
    args: ["diff", "--exit-code"],
    platform: "win32",
    spawn,
  });
  expect(result.status).toBe(0);
  expect(seen).toEqual(["git"]);
});

it("passes the prettier glob as argv and does not enable a shell", () => {
  const glob = "**/*.{ts,tsx,mjs,js,cjs}";
  let shell: boolean | undefined;
  const spawn: SpawnFn = (command, args, options) => {
    if (command === "prettier.cmd") {
      expect(args).toEqual(["--check", glob]);
      shell = options?.shell;
      return { status: 0, stdout: "", stderr: "" };
    }
    return win32Lookup(command);
  };
  const result = spawnCommand({
    command: "prettier",
    args: ["--check", glob],
    platform: "win32",
    spawn,
  });
  expect(result.status).toBe(0);
  expect(shell).toBeUndefined();
});

it("returns the bare ENOENT when the .cmd shim is also missing", () => {
  const spawn: SpawnFn = (command) => ({
    status: null,
    stdout: "",
    stderr: "",
    error: { code: "ENOENT", message: `spawn ${command} ENOENT` },
  });
  const result = spawnCommand({
    command: "missing",
    args: [],
    platform: "win32",
    spawn,
  });
  expect(result.error?.message).toBe("spawn missing ENOENT");
});
