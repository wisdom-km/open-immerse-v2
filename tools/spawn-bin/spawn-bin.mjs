import { spawnSync } from "node:child_process";

import { corepackBin } from "./corepack-bin.mjs";
import { packageBin } from "./package-bin.mjs";

function missingCorepack() {
  const message = "corepack.js was not found next to node";
  return {
    status: null,
    stdout: "",
    stderr: `${message}\n`,
    error: { code: "ENOENT", message },
  };
}

// 用当前 Node 跑包里的 JS 入口。不经过 shell，glob 留在 argv 里。
// 不 spawn .cmd：Node 修 CVE-2024-27980 之后那样做会 EINVAL。
export function spawnCommand(input) {
  const spawn = input.spawn ?? spawnSync;
  const options = input.options ?? {};
  const args = input.args;
  const entry = packageBin(input.command);
  if (entry) {
    const execPath = input.execPath ?? process.execPath;
    return spawn(execPath, [entry, ...args], options);
  }
  if (input.command === "corepack") {
    const execPath = input.execPath ?? process.execPath;
    const corepack = corepackBin(execPath, input.pathApi, input.exists);
    if (!corepack) {
      return missingCorepack();
    }
    return spawn(execPath, [corepack, ...args], options);
  }
  return spawn(input.command, args, options);
}
