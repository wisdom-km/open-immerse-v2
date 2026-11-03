import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

import {
  claimOutput,
  commonDirectory,
  relativeOutput,
} from "./schema-output-name.mjs";
import { applySpecifiers, readSpecifiers } from "./schema-specifiers.mjs";

export async function loadProtocolSchemas(schemaPath) {
  const emitRoot = await mkdtemp(path.join(tmpdir(), "oischema-"));
  try {
    const entry = path.resolve(schemaPath);
    const sources = await collectSources(entry);
    const outputs = claimAll(sources, emitRoot);
    for (const source of sources) {
      await emitSource(source, outputs);
    }
    return schemasFrom(await loadEntry(entry, outputs));
  } finally {
    await rm(emitRoot, { recursive: true, force: true });
  }
}

async function collectSources(entry) {
  const found = [];
  await walk(entry, new Set(), found);
  return found;
}

async function walk(sourcePath, seen, found) {
  if (seen.has(sourcePath)) {
    return;
  }
  seen.add(sourcePath);
  found.push(sourcePath);
  const text = await readFile(sourcePath, "utf8");
  for (const spec of readSpecifiers(text, sourcePath)) {
    if (spec.startsWith(".")) {
      await walk(resolveRelative(sourcePath, spec), seen, found);
    }
  }
}

function resolveRelative(sourcePath, spec) {
  return path.resolve(path.dirname(sourcePath), spec.replace(/\.js$/, ".ts"));
}

function claimAll(sources, emitRoot) {
  const root = commonDirectory(sources);
  const claimed = new Map();
  const outputs = new Map();
  for (const source of sources) {
    const relative = relativeOutput(root, source);
    claimOutput(source, relative, claimed);
    outputs.set(source, {
      absolute: path.join(emitRoot, relative),
      relative,
    });
  }
  return outputs;
}

async function emitSource(sourcePath, outputs) {
  const output = outputs.get(sourcePath);
  if (output === undefined) {
    throw new Error("protocol schema");
  }
  const text = await readFile(sourcePath, "utf8");
  const rewritten = applySpecifiers(
    transpile(text, sourcePath),
    hrefs(text, sourcePath, outputs),
  );
  await mkdir(path.dirname(output.absolute), { recursive: true });
  await writeExclusive(output.absolute, output.relative, rewritten);
}

function transpile(text, sourcePath) {
  return ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;
}

function hrefs(text, sourcePath, outputs) {
  const mapped = new Map();
  for (const spec of readSpecifiers(text, sourcePath)) {
    mapped.set(spec, resolveHref(spec, sourcePath, outputs));
  }
  return mapped;
}

function resolveHref(spec, sourcePath, outputs) {
  if (spec.startsWith(".")) {
    const emitted = outputs.get(resolveRelative(sourcePath, spec));
    if (emitted === undefined) {
      throw new Error("protocol schema");
    }
    return pathToFileURL(emitted.absolute).href;
  }
  return pathToFileURL(createRequire(sourcePath).resolve(spec)).href;
}

export async function writeExclusive(output, relative, text) {
  try {
    await writeFile(output, text, { flag: "wx" });
  } catch (error) {
    if (isExist(error)) {
      throw new Error(`schema output collision: ${relative}`, {
        cause: error,
      });
    }
    throw error;
  }
}

function isExist(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EEXIST"
  );
}

async function loadEntry(entry, outputs) {
  const output = outputs.get(entry);
  if (output === undefined) {
    throw new Error("protocol schema");
  }
  const imported = await import(
    `${pathToFileURL(output.absolute).href}?codegen=${Date.now()}`
  );
  return imported.protocolSchemas;
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
