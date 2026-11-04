import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prettier from "prettier";

import { toLf } from "./line-endings.mjs";
import { loadExposedDescriptors } from "./preload-descriptors.mjs";
import { renderPreload } from "./preload-render-api.mjs";
import { renderRegistry } from "./preload-render-registry.mjs";
import { renderTypes } from "./preload-render-types.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function generatePreloadSet(root, generator) {
  const outputs = outputPaths(root, generator);
  const descriptors = await loadExposedDescriptors(
    path.join(root, generator.input),
  );
  const texts = [
    renderPreload(descriptors),
    renderTypes(descriptors),
    renderRegistry(descriptors),
  ];
  for (let index = 0; index < texts.length; index += 1) {
    const file = outputs[index];
    const text = texts[index];
    if (file === undefined || text === undefined) {
      throw new Error("preload outputs");
    }
    await writeFormatted(file, text);
  }
}

function outputPaths(root, generator) {
  const outputs = generator.outputs;
  if (!Array.isArray(outputs) || outputs.length !== 3) {
    throw new Error("preload outputs");
  }
  return outputs.map((item) => path.join(root, item));
}

async function writeFormatted(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  const config = await prettier.resolveConfig(path.join(here, "run.mjs"));
  const formatted = await prettier.format(text, {
    ...config,
    filepath: file,
  });
  await writeFile(file, toLf(formatted));
}
