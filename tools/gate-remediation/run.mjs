import { spawnSync } from "node:child_process";

import { remediationBlock } from "./format.mjs";

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

function runChild(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
  });
}

function main() {
  const separator = process.argv.indexOf("--");
  const head = separator === -1 ? [] : process.argv.slice(2, separator);
  const command = separator === -1 ? undefined : process.argv[separator + 1];
  const id = option(head, "--id");
  if (!id || !command) {
    console.error("usage: run.mjs --id <gate> [--cwd dir] -- <command> [args]");
    process.exit(2);
  }
  const result = runChild(command, process.argv.slice(separator + 2), option(head, "--cwd"));
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if ((result.status ?? 1) === 0) {
    return;
  }
  if (result.error) {
    console.error(result.error.message);
  }
  console.error(remediationBlock(id));
  process.exit(result.status === null ? 1 : result.status);
}

main();
