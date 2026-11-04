import { mkdir } from "node:fs/promises";
import path from "node:path";

import { copyLf } from "./line-endings.mjs";

export async function copyGenerators(root, generators) {
  for (const generator of generators) {
    const inputPath = path.join(root, generator.input);
    const outputPath = path.join(root, generator.output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyLf(inputPath, outputPath);
  }
}
