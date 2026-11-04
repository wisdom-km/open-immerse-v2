import { createRequire } from "node:module";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

import {
  claimOutput,
  commonDirectory,
  relativeOutput,
} from "./schema-output-name.mjs";
import { applySpecifiers, readSpecifiers } from "./schema-specifiers.mjs";

const fallbackPackage = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../packages/contracts/package.json",
);

export async function importDirectory(inputDir) {
  const entries = await listTypeScript(inputDir);
  const sources = await collectSources(entries);
  const emitRoot = await mkdtemp(path.join(tmpdir(), "oipreload-"));
  try {
    const outputs = claimAll(sources, emitRoot);
    for (const source of sources) {
      await emitSource(source, outputs);
    }
    return await importEntries(entries, outputs);
  } finally {
    await rm(emitRoot, { recursive: true, force: true });
  }
}

async function listTypeScript(inputDir) {
  const found = [];
  await walkDirectory(inputDir, found);
  return found.sort();
}

async function walkDirectory(directory, found) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath, found);
      continue;
    }
    if (isTypeScriptFile(entry.name)) {
      found.push(fullPath);
    }
  }
}

function isTypeScriptFile(name) {
  return name.endsWith(".ts") && !name.endsWith(".d.ts");
}

async function collectSources(entries) {
  const found = [];
  const seen = new Set();
  for (const entry of entries) {
    await walkImports(entry, seen, found);
  }
  return found;
}

async function walkImports(sourcePath, seen, found) {
  if (seen.has(sourcePath)) {
    return;
  }
  seen.add(sourcePath);
  found.push(sourcePath);
  const text = await readFile(sourcePath, "utf8");
  for (const spec of readSpecifiers(text, sourcePath)) {
    if (spec.startsWith(".")) {
      await walkImports(resolveRelative(sourcePath, spec), seen, found);
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
    outputs.set(source, path.join(emitRoot, relative));
  }
  return outputs;
}

async function emitSource(sourcePath, outputs) {
  const output = outputs.get(sourcePath);
  if (output === undefined) {
    throw new Error("preload descriptor");
  }
  const text = await readFile(sourcePath, "utf8");
  const compiled = transpile(text, sourcePath);
  const rewritten = applySpecifiers(
    compiled,
    hrefs(compiled, sourcePath, outputs),
  );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, rewritten);
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
      throw new Error("preload descriptor");
    }
    return pathToFileURL(emitted).href;
  }
  return pathToFileURL(resolveBare(spec, sourcePath)).href;
}

function resolveBare(spec, sourcePath) {
  try {
    return createRequire(sourcePath).resolve(spec);
  } catch {
    return createRequire(fallbackPackage).resolve(spec);
  }
}

async function importEntries(entries, outputs) {
  const loaded = [];
  for (const entry of entries) {
    const output = outputs.get(entry);
    if (output === undefined) {
      throw new Error("preload descriptor");
    }
    const href = `${pathToFileURL(output).href}?preload=${Date.now()}`;
    loaded.push(await import(href));
  }
  return loaded;
}
