import { existsSync } from "node:fs";
import path from "node:path";

// corepack 随 Node 安装，不是本仓库的依赖，require.resolve 找不到它。
// Windows 安装把 corepack.js 放在 node.exe 旁边；Unix 放在 bin/../lib 下。
// .cmd 垫片做的也是用 node 跑这个文件。CVE-2024-27980 之后不能再直接 spawn .cmd。

export function corepackBin(execPath, pathApi = path, exists = existsSync) {
  const binDir = pathApi.dirname(execPath);
  const candidates = [
    pathApi.join(binDir, "node_modules", "corepack", "dist", "corepack.js"),
    pathApi.resolve(
      binDir,
      "..",
      "lib",
      "node_modules",
      "corepack",
      "dist",
      "corepack.js",
    ),
  ];
  return candidates.find((candidate) => exists(candidate));
}
