import { expect, test } from "./fixtures/electron-app.js";

test("mounts the library when the renderer script loads", async ({
  desktop,
}) => {
  await expect(desktop.page.getByText("把论文 PDF 拖到这里")).toBeVisible();
  await expect(
    desktop.page.getByRole("button", { name: "打开文件…" }),
  ).toBeVisible();
  expect(
    await read(
      desktop.page,
      "document.getElementById('root')?.childElementCount ?? 0",
    ),
  ).toBeGreaterThan(0);
});

test("applies library.css when the stylesheet response is accepted", async ({
  desktop,
}) => {
  expect(
    await read(
      desktop.page,
      `[...document.styleSheets].some((item) => item.href?.endsWith("/library.css") && item.cssRules.length > 0)`,
    ),
  ).toBe(true);
});

function read(
  page: { evaluate: (source: never) => Promise<unknown> },
  expression: string,
): Promise<unknown> {
  return page.evaluate(`JSON.parse(JSON.stringify(${expression}))` as never);
}
