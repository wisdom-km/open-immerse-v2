import { spawnSync } from "node:child_process";

const extensions = "**/*.{ts,tsx,mjs,js,cjs}";

const result = spawnSync("prettier", ["--check", extensions], {
  encoding: "utf8",
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) {
  console.error(result.error.message);
}
process.exit(result.status === null ? 1 : result.status);
