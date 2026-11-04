const anchor = "docs/arch/05-01.md#51-层间依赖图";

function constraint(label) {
  if (!label) {
    return null;
  }
  if (label.includes("type-only")) {
    return "type-only";
  }
  if (label.includes("src/pure.ts")) {
    return "pure";
  }
  return null;
}

function violationOf(spec, actual) {
  if (!spec) {
    return "missing";
  }
  const rule = constraint(spec.label);
  if (rule === "type-only" && !actual.typeOnly) {
    return "value-import";
  }
  if (rule === "pure" && !actual.viaPure) {
    return "bypasses-pure";
  }
  return null;
}

function byPair(left, right) {
  return `${left.from}\t${left.to}\t${left.example ?? ""}`.localeCompare(
    `${right.from}\t${right.to}\t${right.example ?? ""}`,
  );
}

function byExample(left, right) {
  return left.example.localeCompare(right.example);
}

function indexFix(example) {
  return `修复：包根 src/index.ts 只允许转出语句（export ... from、export * from、export type ... from）或空的 export {}。${example} 不是转出。把这一行移出该文件。锚点：docs/ci-and-environment.md#依赖图对照`;
}

function fixLine(item) {
  if (item.reason === "value-import") {
    return `修复：docs/arch/05-01.md §5.1 的 ${item.from} → ${item.to} 只允许 type-only。把这处改成 import type，或走 ARCH amendment。锚点：${anchor}`;
  }
  if (item.reason === "bypasses-pure") {
    return `修复：docs/arch/05-01.md §5.1 的 ${item.from} → ${item.to} 只经 src/pure.ts。不要直接 import domain 内部文件。锚点：${anchor}`;
  }
  return `修复：docs/arch/05-01.md §5.1 没有画出 ${item.from} → ${item.to}。删掉这处 import，或走 ARCH amendment 补画这层边。锚点：${anchor}`;
}

export function compareGraph(drawn, reduced) {
  const drawnByPair = new Map();
  for (const edge of drawn.edges) {
    drawnByPair.set(`${edge.from}\t${edge.to}`, edge);
  }
  const undocumented = [];
  const matched = new Set();
  for (const actual of reduced.edges) {
    const key = `${actual.from}\t${actual.to}`;
    const reason = violationOf(drawnByPair.get(key), actual);
    if (reason) {
      undocumented.push({
        from: actual.from,
        to: actual.to,
        example: actual.example,
        reason,
      });
      continue;
    }
    matched.add(key);
  }
  const planned = [];
  for (const edge of drawn.edges) {
    if (!matched.has(`${edge.from}\t${edge.to}`)) {
      planned.push({ from: edge.from, to: edge.to });
    }
  }
  return {
    undocumented: undocumented.sort(byPair),
    planned: planned.sort(byPair),
    unmapped: [...reduced.unmapped].sort(byPair),
    indexes: [...(reduced.indexes ?? [])].sort(byExample),
  };
}

export function renderReport(result) {
  const lines = [
    `arch-graph: undocumented ${result.undocumented.length}`,
    `arch-graph: planned ${result.planned.length}`,
    `arch-graph: unmapped ${result.unmapped.length}`,
    `arch-graph: index ${result.indexes.length}`,
  ];
  for (const item of result.undocumented) {
    lines.push(
      `arch-edge-undocumented\t${item.from}\t${item.to}\t${item.example}`,
    );
    lines.push(fixLine(item));
  }
  for (const item of result.planned) {
    lines.push(`arch-edge-planned\t${item.from}\t${item.to}`);
  }
  for (const item of result.unmapped) {
    lines.push(`arch-edge-unmapped\t${item.from}\t${item.to}\t${item.example}`);
  }
  for (const item of result.indexes) {
    lines.push(`arch-index\t${item.example}`);
    lines.push(indexFix(item.example));
  }
  return `${lines.join("\n")}\n`;
}
