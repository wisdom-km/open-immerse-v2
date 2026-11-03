import { readFileSync } from "node:fs";

export function readText(absPath) {
  return readFileSync(absPath, "utf8");
}

export function readBytes(absPath) {
  return readFileSync(absPath);
}
