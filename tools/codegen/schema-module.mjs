import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const specifierPattern = /(?:from\s+|import\s+)["']([^"']+)["']/g;
const dynamicImportPattern = /import\s*\(/;

export async function loadProtocolSchemas(schemaPath) {
  const root = await mkdtemp(path.join(tmpdir(), "oischema-"));
  try {
    const entry = await emitFile(path.resolve(schemaPath), root, new Set());
    const imported = await import(`${pathToFileURL(entry).href}?codegen=${Date.now()}`);
    return schemasFrom(imported.protocolSchemas);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function outputPath(root, sourcePath) {
  const id = createHash("sha256").update(sourcePath).digest("hex").slice(0, 16);
  return path.join(root, `${id}.codegen.mjs`);
}

function rejectDynamicImport(code, sourcePath) {
  if (dynamicImportPattern.test(code)) {
    throw new Error(`dynamic import: ${sourcePath}`);
  }
}

async function emitFile(sourcePath, root, seen) {
  const output = outputPath(root, sourcePath);
  if (seen.has(sourcePath)) {
    return output;
  }
  seen.add(sourcePath);
  const transpiled = ts.transpileModule(await readFile(sourcePath, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  }).outputText;
  rejectDynamicImport(transpiled, sourcePath);
  const rewritten = await rewriteSpecifiers(transpiled, sourcePath, root, seen);
  await mkdir(root, { recursive: true });
  await writeFile(output, rewritten);
  return output;
}

async function rewriteSpecifiers(code, sourcePath, root, seen) {
  const mapped = new Map();
  for (const spec of specifiers(code)) {
    mapped.set(spec, await resolveSpecifier(spec, sourcePath, root, seen));
  }
  return applySpecifiers(code, mapped);
}

function specifiers(code) {
  const found = [];
  for (const match of code.matchAll(specifierPattern)) {
    const spec = match[1];
    if (spec !== undefined && !found.includes(spec)) {
      found.push(spec);
    }
  }
  return found;
}

async function resolveSpecifier(spec, sourcePath, root, seen) {
  if (spec.startsWith(".")) {
    const target = path.resolve(path.dirname(sourcePath), spec.replace(/\.js$/, ".ts"));
    const emitted = await emitFile(target, root, seen);
    return pathToFileURL(emitted).href;
  }
  return pathToFileURL(createRequire(sourcePath).resolve(spec)).href;
}

function applySpecifiers(code, mapped) {
  const specs = [...mapped.keys()].sort((left, right) => right.length - left.length);
  let next = code;
  for (const spec of specs) {
    const href = JSON.stringify(mapped.get(spec));
    next = next.split(`"${spec}"`).join(href);
    next = next.split(`'${spec}'`).join(href);
  }
  return next;
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
