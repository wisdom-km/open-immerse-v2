import { readFile, writeFile } from "node:fs/promises";

// 生成文件与 Prettier 默认、generatedInit 一样用 LF。
// Windows 上 datamodel-codegen 与 ruff 会写出 CRLF，G7 会把整文件看成漂移。

export function toLf(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export async function copyLf(from, to) {
  const text = await readFile(from, "utf8");
  await writeFile(to, toLf(text));
}
