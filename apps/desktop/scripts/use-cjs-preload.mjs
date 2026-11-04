import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

// Sandboxed preload cannot require a sibling file. Inline the generated module.
const directory = argv[2] ?? "dist/preload";
const from = `${directory}/index.js`;
const to = `${directory}/index.cjs`;
const generated = readFileSync(`${directory}/oi.generated.js`, "utf8");
const bundled = bundlePreload(readFileSync(from, "utf8"), generated);
if (existsSync(to)) {
  unlinkSync(to);
}
writeFileSync(to, bundled);
unlinkSync(from);

function bundlePreload(indexSource, generatedSource) {
  const pattern = /require\((["'])\.\/oi\.generated\.js\1\)/g;
  if (!pattern.test(indexSource)) {
    throw new Error("preload bundle is missing oi.generated.js");
  }
  pattern.lastIndex = 0;
  const inlined = `(() => {\nconst exports = {};\n${generatedSource}\nreturn exports;\n})()`;
  return indexSource.replace(pattern, () => inlined);
}
