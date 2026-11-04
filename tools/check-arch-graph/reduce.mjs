import { layerOf } from "./layer-of.mjs";
import { classifyFeatureIndex, isFeatureIndex } from "./passthrough.mjs";

const thirdParty = new Set([
  "npm",
  "npm-dev",
  "npm-optional",
  "npm-peer",
  "npm-bundled",
  "npm-unknown",
  "undetermined",
  "unknown",
]);
const localTypes = new Set([
  "local",
  "aliased",
  "aliased-tsconfig",
  "aliased-tsconfig-paths",
]);

function norm(ref) {
  return String(ref).replaceAll("\\", "/");
}

function isThirdParty(dep) {
  if (dep.coreModule) {
    return true;
  }
  const types = dep.dependencyTypes ?? [];
  if (types.includes("core")) {
    return true;
  }
  const third = types.some((type) => thirdParty.has(type));
  const local = types.some((type) => localTypes.has(type));
  if (third && !local) {
    return true;
  }
  return (
    dep.couldNotResolve === true && !String(dep.module ?? "").startsWith("@oi/")
  );
}

function depRef(dep) {
  const resolved = dep.resolved ? norm(dep.resolved) : "";
  if (resolved && !resolved.includes("/node_modules/")) {
    return resolved;
  }
  return dep.module ?? "";
}

function isPure(ref) {
  const name = norm(ref);
  return /\/src\/pure\.ts$/.test(name) || /(?:^|\/)pure\.(?:ts|js)$/.test(name);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isTypeClause(line) {
  return /\b(?:import|export)\s+type\b/.test(line);
}

function lineOf(text, specifier, typeOnly) {
  if (!text || !specifier) {
    return 0;
  }
  const quoted = new RegExp(`['"\`]${escapeRegExp(specifier)}['"\`]`);
  const hits = text
    .split("\n")
    .flatMap((line, index) =>
      quoted.test(line) ? [{ line, number: index + 1 }] : [],
    );
  const preferred = hits.find((hit) => isTypeClause(hit.line) === typeOnly);
  return (preferred ?? hits[0])?.number ?? 0;
}

function token(classified) {
  if (classified.kind === "layer") {
    return classified.id;
  }
  if (classified.kind === "seam") {
    return "SEAM";
  }
  return "?";
}

function smallest(rows) {
  return rows.map((row) => row.example).sort()[0];
}

function pickExample(prev, item, typeOnly, viaPure) {
  let rows = [prev, item];
  if (!typeOnly) {
    rows = rows.filter((row) => !row.typeOnly);
  }
  if (!viaPure) {
    const bypass = rows.filter((row) => !row.viaPure);
    if (bypass.length > 0) {
      rows = bypass;
    }
  }
  return smallest(rows);
}

function addEdge(map, item) {
  const key = `${item.from}\t${item.to}`;
  const prev = map.get(key);
  if (!prev) {
    map.set(key, { ...item });
    return;
  }
  const typeOnly = prev.typeOnly && item.typeOnly;
  const viaPure = prev.viaPure && item.viaPure;
  map.set(key, {
    from: item.from,
    to: item.to,
    typeOnly,
    viaPure,
    example: pickExample(prev, item, typeOnly, viaPure),
  });
}

function addUnmapped(map, item) {
  const key = `${item.from}\t${item.to}`;
  const prev = map.get(key);
  if (!prev || item.example < prev.example) {
    map.set(key, item);
  }
}

function collectIndexes(cruise, readText) {
  const passthrough = new Set();
  const indexes = [];
  for (const mod of cruise.modules ?? []) {
    const source = norm(mod.source);
    if (!isFeatureIndex(source)) {
      continue;
    }
    const verdict = classifyFeatureIndex(readText(source));
    if (verdict.kind === "impure") {
      indexes.push({ example: `${source}:${verdict.line}` });
      continue;
    }
    passthrough.add(source);
  }
  return { passthrough, indexes };
}

function moduleMap(cruise) {
  const map = new Map();
  for (const mod of cruise.modules ?? []) {
    map.set(norm(mod.source), mod);
  }
  return map;
}

function followTargets(indexSource, bag, seen) {
  if (seen.has(indexSource)) {
    return [];
  }
  seen.add(indexSource);
  const mod = bag.bySource.get(indexSource);
  const found = [];
  for (const dep of mod?.dependencies ?? []) {
    if (isThirdParty(dep)) {
      continue;
    }
    const ref = depRef(dep);
    const key = norm(ref);
    if (bag.passthrough.has(key)) {
      found.push(...followTargets(key, bag, seen));
      continue;
    }
    found.push(ref);
  }
  return found;
}

function recordEdge(from, ref, meta, bag) {
  const to = layerOf(ref);
  if (to.kind === "excluded" || to.kind === "external") {
    return;
  }
  const item = {
    from: token(from),
    to: token(to),
    example: meta.example,
    typeOnly: meta.typeOnly,
    viaPure: isPure(ref),
  };
  if (from.kind !== "layer" || to.kind !== "layer") {
    addUnmapped(bag.unmapped, {
      from: item.from,
      to: item.to,
      example: meta.example,
    });
    return;
  }
  if (item.from === item.to) {
    return;
  }
  addEdge(bag.edges, item);
}

function absorbDep(source, from, dep, bag) {
  if (isThirdParty(dep)) {
    return;
  }
  const ref = depRef(dep);
  const typeOnly = (dep.dependencyTypes ?? []).includes("type-only");
  const meta = {
    typeOnly,
    example: `${source}:${lineOf(bag.readText(source), dep.module, typeOnly)}`,
  };
  const key = norm(ref);
  if (bag.passthrough.has(key)) {
    for (const target of followTargets(key, bag, new Set())) {
      recordEdge(from, target, meta, bag);
    }
    return;
  }
  recordEdge(from, ref, meta, bag);
}

function absorbModule(mod, bag) {
  const source = norm(mod.source);
  if (bag.passthrough.has(source)) {
    return;
  }
  const from = layerOf(source);
  if (from.kind === "excluded") {
    return;
  }
  for (const dep of mod.dependencies ?? []) {
    absorbDep(source, from, dep, bag);
  }
}

function byPair(left, right) {
  return `${left.from}\t${left.to}\t${left.example ?? ""}`.localeCompare(
    `${right.from}\t${right.to}\t${right.example ?? ""}`,
  );
}

function byExample(left, right) {
  return left.example.localeCompare(right.example);
}

export function reduceCruise(cruise, readText) {
  const edges = new Map();
  const unmapped = new Map();
  const collected = collectIndexes(cruise, readText);
  const bag = {
    readText,
    edges,
    unmapped,
    passthrough: collected.passthrough,
    bySource: moduleMap(cruise),
  };
  for (const mod of cruise.modules ?? []) {
    absorbModule(mod, bag);
  }
  return {
    edges: [...edges.values()].sort(byPair),
    unmapped: [...unmapped.values()].sort(byPair),
    indexes: [...collected.indexes].sort(byExample),
  };
}
