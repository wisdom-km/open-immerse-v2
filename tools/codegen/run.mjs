import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { copyGenerators } from "./copy.mjs";
import { generateProtocol } from "./protocol.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const root = path.resolve(option("--root", process.cwd()));
const manifestPath = path.resolve(option("--manifest", path.join(scriptDir, "manifest.json")));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const generators = manifest.generators ?? [];
await copyGenerators(root, generators);

const schemaFlag = process.argv.includes("--protocol-schema");
const schemaPath = schemaFlag
  ? path.resolve(option("--protocol-schema", ""))
  : path.join(root, "packages/contracts/src/worker-protocol.ts");
if (schemaFlag || existsSync(schemaPath)) {
  await generateProtocol({
    schemaPath,
    outputDir: path.resolve(
      option("--protocol-output", path.join(root, "workers/parser/oi_worker/protocol")),
    ),
    parserRoot: path.resolve(option("--parser-root", path.join(root, "workers/parser"))),
    pinPath: path.join(scriptDir, "pin.json"),
  });
}

console.log(`codegen: ${generators.length} generators`);
