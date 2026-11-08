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

function countsAsCi(value: string | undefined): boolean {
  if (value === undefined || value.length === 0) {
    return false;
  }
  return value !== "false" && value !== "0";
}

function binary(
  context: { skip: (note: string) => void },
  env: GitleaksEnv = gitleaksEnvFromProcess(),
): string {
  const fromEnv = env.GITLEAKS_BIN;
  if (fromEnv === undefined || fromEnv.length === 0) {
    if (countsAsCi(env.CI)) {
      const ci = env.CI ?? "";
      throw new Error(
        `GITLEAKS_BIN is unset while CI=${ci}. G9 must not skip in CI.`,
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

type DetectCase = "reject-access-key" | "allow-oitest" | "reject-nottest";

type PhaseName =
  | "binary"
  | "fixture-dir"
  | "git-init"
  | "git-config-email"
  | "git-config-name"
  | "fixture-write"
  | "git-add"
  | "git-commit"
  | "detect"
  | "cleanup";

type PhaseLog = {
  measure<T>(phase: PhaseName, run: () => T): T;
  flush(): void;
};

/** 单调计时。步骤抛出的异常原样继续抛。全部完成后一次写出。 */
function createPhaseLog(caseId: DetectCase): PhaseLog {
  const rows: { phase: PhaseName; ms: number }[] = [];
  return {
    measure(phase, run) {
      const start = process.hrtime.bigint();
      try {
        return run();
      } finally {
        const elapsed = process.hrtime.bigint() - start;
        rows.push({ phase, ms: Number(elapsed) / 1_000_000 });
      }
    },
    flush() {
      if (rows.length === 0) {
        return;
      }
      const lines = rows.map(
        (row) =>
          `g9-phase case=${caseId} phase=${row.phase} ms=${row.ms.toFixed(3)}`,
      );
      process.stderr.write(`${lines.join("\n")}\n`);
      rows.length = 0;
    },
  };
}

function closeDetect(log: PhaseLog, cleanup: () => void): void {
  try {
    log.measure("cleanup", cleanup);
  } finally {
    log.flush();
  }
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

it("fails when CI is 1 and GITLEAKS_BIN is missing (G9)", () => {
  expect(() =>
    binary({ skip: () => undefined }, { CI: "1", GITLEAKS_BIN: undefined }),
  ).toThrow(/GITLEAKS_BIN is unset while CI=1/);
  expect(() =>
    binary({ skip: () => undefined }, { CI: "1", GITLEAKS_BIN: "" }),
  ).toThrow(/GITLEAKS_BIN is unset while CI=1/);
});

it("skips when CI is 0 and GITLEAKS_BIN is missing (G9)", () => {
  let note = "";
  const bin = binary(
    {
      skip: (message) => {
        note = message;
      },
    },
    { CI: "0", GITLEAKS_BIN: undefined },
  );
  expect(bin).toBe("");
  expect(note).toContain("GITLEAKS_BIN is unset");
  expect(note).not.toContain("must not skip");
});

it("skips when CI is false and GITLEAKS_BIN is missing (G9)", () => {
  let note = "";
  const bin = binary(
    {
      skip: (message) => {
        note = message;
      },
    },
    { CI: "false", GITLEAKS_BIN: undefined },
  );
  expect(bin).toBe("");
  expect(note).toContain("GITLEAKS_BIN is unset");
  expect(note).not.toContain("must not skip");
});

it("rejects a committed access key that lacks the oitest_ prefix (G9)", (context) => {
  const log = createPhaseLog("reject-access-key");
  try {
    const bin = log.measure("binary", () => binary(context));
    const root = log.measure("fixture-dir", () =>
      mkdtempSync(path.join(tmpdir(), "oi-leak-")),
    );
    try {
      log.measure("git-init", () => {
        git(root, ["init"]);
      });
      log.measure("git-config-email", () => {
        git(root, ["config", "user.email", "gate@example.com"]);
      });
      log.measure("git-config-name", () => {
        git(root, ["config", "user.name", "gate"]);
      });
      const suffix = [
        "1WqE2rT3",
        "yU4iO5pA",
        "6sD7fG8h",
        "J9kL0zXc",
        "VbNm",
      ].join("");
      const key = ["ghp_", suffix].join("");
      log.measure("fixture-write", () => {
        writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
      });
      log.measure("git-add", () => {
        git(root, ["add", "secret.txt"]);
      });
      log.measure("git-commit", () => {
        git(root, ["commit", "-m", "chore: leak fixture"]);
      });
      const leaked = log.measure("detect", () => detect(bin, root));
      expect(leaked.status).not.toBe(0);
      expect(commandOutput(leaked)).toContain(remediationBlock("G9"));
    } finally {
      closeDetect(log, () => {
        rmSync(root, { recursive: true, force: true });
      });
    }
  } finally {
    log.flush();
  }
});

it("allows a synthetic key that uses the oitest_ prefix (G9)", (context) => {
  const log = createPhaseLog("allow-oitest");
  try {
    const bin = log.measure("binary", () => binary(context));
    const root = log.measure("fixture-dir", () =>
      mkdtempSync(path.join(tmpdir(), "oi-leak-ok-")),
    );
    try {
      log.measure("git-init", () => {
        git(root, ["init"]);
      });
      log.measure("git-config-email", () => {
        git(root, ["config", "user.email", "gate@example.com"]);
      });
      log.measure("git-config-name", () => {
        git(root, ["config", "user.name", "gate"]);
      });
      const suffix = [
        "1WqE2rT3",
        "yU4iO5pA",
        "6sD7fG8h",
        "J9kL0zXc",
        "VbNm",
      ].join("");
      const key = ["oitest_", suffix].join("");
      log.measure("fixture-write", () => {
        writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
      });
      log.measure("git-add", () => {
        git(root, ["add", "secret.txt"]);
      });
      log.measure("git-commit", () => {
        git(root, ["commit", "-m", "chore: synthetic key"]);
      });
      const allowed = log.measure("detect", () => detect(bin, root));
      expect(allowed.status).toBe(0);
      expect(commandOutput(allowed)).not.toContain("gate-remediation:");
    } finally {
      closeDetect(log, () => {
        rmSync(root, { recursive: true, force: true });
      });
    }
  } finally {
    log.flush();
  }
});

it("rejects the same suffix when the prefix is nottest_ (G9)", (context) => {
  const log = createPhaseLog("reject-nottest");
  try {
    const bin = log.measure("binary", () => binary(context));
    const root = log.measure("fixture-dir", () =>
      mkdtempSync(path.join(tmpdir(), "oi-leak-prefix-")),
    );
    try {
      log.measure("git-init", () => {
        git(root, ["init"]);
      });
      log.measure("git-config-email", () => {
        git(root, ["config", "user.email", "gate@example.com"]);
      });
      log.measure("git-config-name", () => {
        git(root, ["config", "user.name", "gate"]);
      });
      const suffix = [
        "1WqE2rT3",
        "yU4iO5pA",
        "6sD7fG8h",
        "J9kL0zXc",
        "VbNm",
      ].join("");
      const key = ["nottest_", suffix].join("");
      log.measure("fixture-write", () => {
        writeFileSync(path.join(root, "secret.txt"), `token=${key}\n`);
      });
      log.measure("git-add", () => {
        git(root, ["add", "secret.txt"]);
      });
      log.measure("git-commit", () => {
        git(root, ["commit", "-m", "chore: leak fixture"]);
      });
      const leaked = log.measure("detect", () => detect(bin, root));
      expect(leaked.status).not.toBe(0);
      expect(commandOutput(leaked)).toContain(remediationBlock("G9"));
    } finally {
      closeDetect(log, () => {
        rmSync(root, { recursive: true, force: true });
      });
    }
  } finally {
    log.flush();
  }
});
