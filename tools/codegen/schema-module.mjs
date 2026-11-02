import { readFile, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import ts from "typescript";

export async function loadProtocolSchemas(schemaPath) {
  const source = await readFile(schemaPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: schemaPath,
  }).outputText;
  const loader = schemaPath.replace(/\.ts$/, ".codegen.mjs");
  await writeFile(loader, transpiled);
  try {
    const imported = await import(`${pathToFileURL(loader).href}?codegen=${Date.now()}`);
    return schemasFrom(imported.protocolSchemas);
  } finally {
    await rm(loader, { force: true });
  }
}

function schemasFrom(value) {
  if (!Array.isArray(value)) {
    throw new Error("protocol schema");
  }
  return value.map(oneSchema);
}

function oneSchema(value) {
  if (!value || typeof value !== "object") {
    throw new Error("protocol schema");
  }
  const name = value.name;
  if (typeof name !== "string" || !/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error("protocol schema");
  }
  if (!value.schema || typeof value.schema !== "object") {
    throw new Error("protocol schema");
  }
  return { name, schema: value.schema };
}
