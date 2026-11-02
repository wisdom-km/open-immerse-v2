import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function copyGenerators(root, generators) {
  for (const generator of generators) {
    const inputPath = path.join(root, generator.input);
    const outputPath = path.join(root, generator.output);
    const source = await readFile(inputPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, source);
  }
}
