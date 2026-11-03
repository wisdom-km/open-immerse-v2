import { readFileSync } from "node:fs";
import { findPackageJSON } from "node:module";
import path from "node:path";

function depcruiseEntry() {
  const pkgPath = findPackageJSON("dependency-cruiser", import.meta.url);
  if (pkgPath === undefined) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const binField = pkg.bin;
  const relative =
    typeof binField === "object" && binField !== null ? binField.depcruise : undefined;
  if (typeof relative !== "string" || relative.length === 0) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  return path.resolve(path.dirname(pkgPath), relative);
}

// Windows 上 node_modules/.bin/depcruise 实际是 .cmd。这里用当前 Node 执行
// dependency-cruiser 包 bin.depcruise 指向的 JS 入口，并且不经过 shell。
export function launchDepcruise(spawn, args) {
  return spawn(process.execPath, [depcruiseEntry(), ...args], { encoding: "utf8" });
}
