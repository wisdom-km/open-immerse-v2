import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { linkFindings } from "./links.mjs";
import { listMarkdown } from "./list-files.mjs";
import { readText } from "./read-text.mjs";
import { render } from "./report.mjs";
import { statusFindings } from "./status.mjs";
import { treePathFindings } from "./tree-paths.mjs";
import { verbatimFindings } from "./verbatim.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const treeDoc = "docs/arch/03.md";

function option(argv, name) {
  const index = argv.indexOf(name);
  const value = index === -1 ? undefined : argv[index + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }
  return path.resolve(value);
}

export function run(argv, stdout, cwd) {
  const root = option(argv, "--root");
  const verbatim =
    option(argv, "--verbatim") ?? path.join(here, "verbatim.json");
  const base = root ?? cwd;
  const files = listMarkdown(base, root != null);
  const read = (rel) => readText(path.join(base, rel));
  const findings = files
    ? [
        ...linkFindings(files, base, read),
        ...statusFindings(files, read),
        ...verbatimFindings(base, verbatim),
        ...(files.includes(treeDoc)
          ? treePathFindings(read(treeDoc), base)
          : []),
      ]
    : [{ kind: "git-list", file: ".", detail: "git ls-files 失败" }];
  stdout.write(render(findings));
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(invoked).href) {
  run(process.argv.slice(2), process.stdout, process.cwd());
}
