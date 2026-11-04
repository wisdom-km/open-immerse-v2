import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

// tsc 的 npm 包名是 typescript。其余命令与包名相同。
const packageByCommand = { tsc: "typescript" };

function binRelative(binField, command, packageName) {
  if (typeof binField === "string") {
    return command === packageName ? binField : undefined;
  }
  if (binField && typeof binField === "object") {
    const relative = binField[command];
    return typeof relative === "string" ? relative : undefined;
  }
  return undefined;
}

export function packageBin(command) {
  if (
    command.includes("/") ||
    command.includes("\\") ||
    command.includes(".")
  ) {
    return undefined;
  }
  const packageName = packageByCommand[command] ?? command;
  let pkgPath;
  try {
    pkgPath = require.resolve(`${packageName}/package.json`);
  } catch (error) {
    if (error?.code === "MODULE_NOT_FOUND") {
      return undefined;
    }
    throw error;
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const relative = binRelative(pkg.bin, command, packageName);
  if (!relative) {
    return undefined;
  }
  return path.resolve(path.dirname(pkgPath), relative);
}
