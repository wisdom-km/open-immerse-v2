import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const root = path.resolve(option("--root", process.cwd()));
const manifestPath = path.resolve(
  option("--manifest", path.join(scriptDir, "manifest.json")),
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

for (const generator of manifest.generators ?? []) {
  const inputPath = path.join(root, generator.input);
  const outputPath = path.join(root, generator.output);
  const source = await readFile(inputPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, source);
}

console.log(`codegen: ${(manifest.generators ?? []).length} generators`);
