import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { execPath } from "node:process";
import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const desktop = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const tsExtension = {
  name: "ts-extension",
  setup(build) {
    build.onResolve({ filter: /^\./ }, (args) => resolveTypeScript(args));
  },
};

await esbuild.build({
  absWorkingDir: desktop,
  entryPoints: ["src/renderer/main.tsx"],
  outfile: "src/renderer/main.js",
  bundle: true,
  format: "iife",
  target: "es2023",
  jsx: "automatic",
  platform: "browser",
  plugins: [tsExtension],
  logLevel: "info",
});

copyPdfWorker();

function copyPdfWorker() {
  const script = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "copy-pdf-worker.mjs",
  );
  const result = spawnSync(execPath, [script], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || "copy pdf.worker.js failed");
  }
}

function resolveTypeScript(args) {
  if (!args.path.endsWith(".js")) {
    return null;
  }
  const base = path.resolve(args.resolveDir, args.path.slice(0, -3));
  const found = [".tsx", ".ts"]
    .map((extension) => `${base}${extension}`)
    .find((file) => existsSync(file));
  if (found === undefined) {
    return null;
  }
  return { path: found };
}
