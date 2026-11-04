import { spawnCommand } from "../spawn-bin/spawn-bin.mjs";

const extensions = "**/*.{ts,tsx,mjs,js,cjs}";

const result = spawnCommand({
  command: "prettier",
  args: ["--check", extensions],
  options: { encoding: "utf8" },
});
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) {
  console.error(result.error.message);
}
process.exit(result.status === null ? 1 : result.status);
