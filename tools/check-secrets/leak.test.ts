import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

const config = path.resolve(".gitleaks.toml");
const runner = path.resolve("tools/gate-remediation/run.mjs");

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

type GitleaksEnv = {
  readonly CI: string | undefined;
  readonly GITLEAKS_BIN: string | undefined;
};

function gitleaksEnvFromProcess(): GitleaksEnv {
  return {
    CI: process.env.CI,
    GITLEAKS_BIN: process.env.GITLEAKS_BIN,
  };
}

function binary(
  context: { skip: (note: string) => void },
  env: GitleaksEnv = gitleaksEnvFromProcess(),
): string {
  const fromEnv = env.GITLEAKS_BIN;
  if (fromEnv === undefined || fromEnv.length === 0) {
    if (env.CI === "true") {
      throw new Error(
        "GITLEAKS_BIN is unset while CI=true. G9 must not skip in CI.",
      );
    }
    context.skip(
      "GITLEAKS_BIN is unset. Point it at the gitleaks binary to run G9.",
    );
    return "";
  }
  return fromEnv;
}

function detect(bin: string, root: string) {
  return spawnSync(
    "node",
    [
      runner,
      "--id",
      "G9",
      "--",
      bin,
      "detect",
      "--source",
      root,
      "--config",
      config,
      "--no-banner",
      "--redact",
    ],
    { encoding: "utf8" },
  );
}

it("fails when CI is true and GITLEAKS_BIN is missing (G9)", () => {
  const env = { CI: "true", GITLEAKS_BIN: undefined };
  expect(() => binary({ skip: () => undefined }, env)).toThrow(
    /GITLEAKS_BIN is unset while CI=true/,
  );
  expect(() =>
    binary({ skip: () => undefined }, { CI: "true", GITLEAKS_BIN: "" }),
  ).toThrow(/GITLEAKS_BIN is unset while CI=true/);
});

it("skips when GITLEAKS_BIN is unset and CI is not true (G9)", () => {
  let note = "";
  const bin = binary(
    {
      skip: (message) => {
        note = message;
      },
    },
    { CI: undefined, GITLEAKS_BIN: undefined },
  );
  expect(bin).toBe("");
  expect(note).toContain("GITLEAKS_BIN is unset");
  expect(note).not.toContain("CI=true");
});

it("uses GITLEAKS_BIN when it is set, including under CI (G9)", () => {
  const bin = binary(
    { skip: () => undefined },
    { CI: "true", GITLEAKS_BIN: "/tmp/gitleaks" },
  );
  expect(bin).toBe("/tmp/gitleaks");
});

it("rejects a committed access key that lacks the oitest_ prefix (G9)", (context) => {
  const bin = binary(context);
  const root = mkdtempSync(path.join(tmpdir(), "oi-leak-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    const suffix = [
      "1WqE2rT3",
      "yU4iO5pA",
      "6sD7fG8h",
      "J9kL0zXc",
      "VbNm",
    ].join("");
    const key = ["ghp_", suffix].join("");
    writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
    git(root, ["add", "secret.txt"]);
    git(root, ["commit", "-m", "chore: leak fixture"]);
    const leaked = detect(bin, root);
    expect(leaked.status).not.toBe(0);
    expect(commandOutput(leaked)).toContain(remediationBlock("G9"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("allows a synthetic key that uses the oitest_ prefix (G9)", (context) => {
  const bin = binary(context);
  const root = mkdtempSync(path.join(tmpdir(), "oi-leak-ok-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    const suffix = [
      "1WqE2rT3",
      "yU4iO5pA",
      "6sD7fG8h",
      "J9kL0zXc",
      "VbNm",
    ].join("");
    const key = ["oitest_", suffix].join("");
    writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
    git(root, ["add", "secret.txt"]);
    git(root, ["commit", "-m", "chore: synthetic key"]);
    const allowed = detect(bin, root);
    expect(allowed.status).toBe(0);
    expect(commandOutput(allowed)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects the same suffix when the prefix is nottest_ (G9)", (context) => {
  const bin = binary(context);
  const root = mkdtempSync(path.join(tmpdir(), "oi-leak-prefix-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    const suffix = [
      "1WqE2rT3",
      "yU4iO5pA",
      "6sD7fG8h",
      "J9kL0zXc",
      "VbNm",
    ].join("");
    const key = ["nottest_", suffix].join("");
    writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
    git(root, ["add", "secret.txt"]);
    git(root, ["commit", "-m", "chore: leak fixture"]);
    const leaked = detect(bin, root);
    expect(leaked.status).not.toBe(0);
    expect(commandOutput(leaked)).toContain(remediationBlock("G9"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
