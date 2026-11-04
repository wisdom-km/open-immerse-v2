import { spawnSync } from "node:child_process";

// Node 在 Windows 上只给无扩展名的命令补 .exe。prettier、eslint、tsc、corepack
// 是 .cmd。补 .cmd，不用 shell：check 的参数含 * 与 {}，交给 cmd 会被展开。

function needsCmdShim(platform, command, result) {
  if (platform !== "win32") {
    return false;
  }
  if (
    command.includes(".") ||
    command.includes("/") ||
    command.includes("\\")
  ) {
    return false;
  }
  return result.error?.code === "ENOENT";
}

export function spawnCommand(input) {
  const platform = input.platform ?? process.platform;
  const spawn = input.spawn ?? spawnSync;
  const options = input.options ?? {};
  const first = spawn(input.command, input.args, options);
  if (!needsCmdShim(platform, input.command, first)) {
    return first;
  }
  const retry = spawn(`${input.command}.cmd`, input.args, options);
  if (retry.error?.code === "ENOENT") {
    return first;
  }
  return retry;
}
