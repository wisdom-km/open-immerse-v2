const groups = {
  links: new Set(["missing-file"]),
  anchors: new Set(["missing-anchor"]),
  status: new Set([
    "index-table-missing",
    "status-line-missing",
    "status-mismatch",
    "not-in-index",
  ]),
  verbatim: new Set([
    "verbatim-mismatch",
    "verbatim-marker",
    "verbatim-manifest",
  ]),
};

function tally(findings, kinds) {
  return findings.filter((item) => kinds.has(item.kind)).length;
}

export function render(findings) {
  const lines = [
    "check-docs: report-only",
    `links: ${tally(findings, groups.links)}`,
    `anchors: ${tally(findings, groups.anchors)}`,
    `status: ${tally(findings, groups.status)}`,
    `verbatim: ${tally(findings, groups.verbatim)}`,
    `findings: ${findings.length}`,
  ];
  for (const item of findings) {
    lines.push(`${item.kind}\t${item.file}\t${item.detail}`);
  }
  return `${lines.join("\n")}\n`;
}
