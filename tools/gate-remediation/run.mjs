import { spawnCommand } from "../spawn-bin/spawn-bin.mjs";
import { remediationBlock, requireGate } from "./format.mjs";

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

function runChild(command, args, cwd) {
  const options =
    cwd === undefined ? { encoding: "utf8" } : { encoding: "utf8", cwd };
  return spawnCommand({ command, args, options });
}

function catalogError(id) {
  try {
    requireGate(id);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function exitForUnknown(status) {
  if (status === null || status === undefined) {
    return 1;
  }
  if (status === 0) {
    return 2;
  }
  return status;
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
  const unknown = catalogError(id);
  const result = runChild(
    command,
    process.argv.slice(separator + 2),
    option(head, "--cwd"),
  );
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (unknown !== undefined) {
    if (result.error) {
      console.error(result.error.message);
    }
    console.error(unknown);
    process.exit(exitForUnknown(result.status));
  }
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
