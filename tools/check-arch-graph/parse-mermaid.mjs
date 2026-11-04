const solidPlain = /^([A-Za-z][A-Za-z0-9]*)\s+-->\s+([A-Za-z][A-Za-z0-9]*)\s*$/;
const solidLabel =
  /^([A-Za-z][A-Za-z0-9]*)\s+--\s+"([^"]*)"\s+-->\s+([A-Za-z][A-Za-z0-9]*)\s*$/;
const dashedLabel =
  /^([A-Za-z][A-Za-z0-9]*)\s+-\.\s+"([^"]*)"\s+\.->\s+([A-Za-z][A-Za-z0-9]*)\s*$/;
const dashedPlain =
  /^([A-Za-z][A-Za-z0-9]*)\s+-\.->\s+([A-Za-z][A-Za-z0-9]*)\s*$/;
const nodeDef = /^([A-Za-z][A-Za-z0-9]*)\[/;

function edge(from, to, kind, label) {
  return { from, to, kind, label };
}

function parseEdge(line) {
  const labeledSolid = solidLabel.exec(line);
  if (labeledSolid) {
    return edge(labeledSolid[1], labeledSolid[3], "solid", labeledSolid[2]);
  }
  const plainSolid = solidPlain.exec(line);
  if (plainSolid) {
    return edge(plainSolid[1], plainSolid[2], "solid", null);
  }
  const labeledDash = dashedLabel.exec(line);
  if (labeledDash) {
    return edge(labeledDash[1], labeledDash[3], "dashed", labeledDash[2]);
  }
  const plainDash = dashedPlain.exec(line);
  if (plainDash) {
    return edge(plainDash[1], plainDash[2], "dashed", null);
  }
  return null;
}

function firstMermaid(markdown) {
  const start = markdown.indexOf("```mermaid");
  if (start === -1) {
    return "";
  }
  const from = markdown.indexOf("\n", start);
  const end = markdown.indexOf("```", from + 1);
  if (from === -1 || end === -1) {
    return "";
  }
  return markdown.slice(from + 1, end);
}

export function parseMermaid(markdown) {
  const nodes = new Set();
  const edges = [];
  for (const raw of firstMermaid(markdown).split("\n")) {
    const line = raw.trim();
    const node = nodeDef.exec(line);
    if (node) {
      nodes.add(node[1]);
    }
    const parsed = parseEdge(line);
    if (parsed) {
      nodes.add(parsed.from);
      nodes.add(parsed.to);
      edges.push(parsed);
    }
  }
  return { nodes: [...nodes].sort(), edges };
}
