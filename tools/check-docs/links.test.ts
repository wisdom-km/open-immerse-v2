import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const checker = path.resolve("tools/check-docs/check.mjs");
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function run(args: string[]) {
  return spawnSync("node", [checker, ...args], { encoding: "utf8" });
}

function fixture(name: string) {
  return path.resolve("tools/check-docs/fixtures", name);
}

function text(result: { stdout: string | Buffer | null | undefined }) {
  return typeof result.stdout === "string" ? result.stdout : "";
}

function slugOf(heading: string): string {
  const script = `import { slugify } from "./tools/check-docs/slug.mjs";
process.stdout.write(slugify(${JSON.stringify(heading)}));
`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8", cwd: root },
  );
  expect(result.status).toBe(0);
  return text(result);
}

it("reports a missing file when the link target is absent", () => {
  const result = run(["--root", fixture("missing-file")]);
  const out = text(result);
  expect(result.status).toBe(1);
  expect(out).toContain("missing-file\tpage.md\tmissing.md");
  expect(out).toContain("missing-file\tpage.md\t/etc/passwd");
  expect(out).toContain("missing-file\tpage.md\t../outside.md");
  expect(out).toContain("links: 3");
  expect(out).toContain("findings: 3");
  expect(out).not.toContain("nope.md");
  expect(out).not.toContain("note.txt");
});

it("skips an external link when the scheme is https", () => {
  const result = run(["--root", fixture("missing-file")]);
  const out = text(result);
  expect(result.status).toBe(1);
  expect(out).not.toContain("example.invalid");
  expect(out).not.toContain("mailto:");
});

it("reports a missing anchor when the slug is absent", () => {
  const result = run(["--root", fixture("missing-anchor")]);
  const out = text(result);
  expect(result.status).toBe(1);
  expect(out).toContain("missing-anchor\tpage.md\t#no-such");
  expect(out).toContain("missing-anchor\tpage.md\tother.md#absent");
  expect(out).toContain("missing-anchor\tpage.md\t#not-a-heading");
  expect(out).toContain("anchors: 3");
  expect(out).not.toContain("missing-anchor\tpage.md\t#title\n");
  expect(out).not.toContain("#title-1");
  expect(out).not.toContain("other.md#present");
  expect(out).not.toContain("#70-服务商");
});

it("accepts an anchor when the heading slug matches", () => {
  const out = text(run(["--root", fixture("missing-anchor")]));
  expect(out).toContain("anchors: 3");
  expect(out).not.toContain("#70-服务商");
  expect(out).toContain("links: 0");
});

it("drops a mark between spaces when the heading contains a left-right arrow", () => {
  // GitHub 渲染 docs/arch/09.md：user-content-9-ipc-协议renderer--main
  expect(slugOf("9. IPC 协议（renderer ↔ main）")).toBe(
    "9-ipc-协议renderer--main",
  );
});

it("drops corner brackets when the heading wraps a note in lenticular brackets", () => {
  // GitHub 渲染 docs/arch/09-01.md：user-content-91-v2-桌面端-ui-新增-seam已采纳adr-0001wisdom-2026-11-04
  expect(
    slugOf(
      "9.1 v2 桌面端 UI 新增 seam**【已采纳，ADR 0001，Wisdom 2026-11-04】**",
    ),
  ).toBe("91-v2-桌面端-ui-新增-seam已采纳adr-0001wisdom-2026-11-04");
});

it("drops the section sign when the heading cites a section", () => {
  // GitHub 渲染 docs/arch/14-01.md：user-content-141-发生了什么数据来自旧仓库只读审查见-v1-审查-3
  expect(
    slugOf(
      "14.1 发生了什么（数据来自旧仓库只读审查，见 [v1 审查](../../docs/v1-review.md) §3）",
    ),
  ).toBe("141-发生了什么数据来自旧仓库只读审查见-v1-审查-3");
});

it("emits a double hyphen when a removed mark leaves adjacent spaces", () => {
  // GitHub 渲染 docs/prd/03-03.md 的 id 含 本地--api；两侧空格各变成一个 -
  expect(slugOf("本地 / API")).toBe("本地--api");
  expect(slugOf("A  B")).toBe("a--b");
});

it("keeps Chinese characters when the heading is Chinese", () => {
  // GitHub 渲染 docs/prd/01.md：user-content-1-一句话
  expect(slugOf("1. 一句话")).toBe("1-一句话");
});

it("suffixes the later heading when the same title is repeated", () => {
  const script = `import { headingSlugs } from "./tools/check-docs/slug.mjs";
process.stdout.write(headingSlugs("# 一句话\\n\\n# 一句话\\n").join("\\n"));
`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", script],
    { encoding: "utf8", cwd: root },
  );
  expect(result.status).toBe(0);
  expect(text(result)).toBe("一句话\n一句话-1");
});
