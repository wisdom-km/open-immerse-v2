import { existsSync, renameSync, unlinkSync } from "node:fs";

const from = "dist/preload/index.js";
const to = "dist/preload/index.cjs";
if (existsSync(to)) {
  unlinkSync(to);
}
renameSync(from, to);
