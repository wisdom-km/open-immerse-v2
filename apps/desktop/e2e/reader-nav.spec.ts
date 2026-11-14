import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { type ElectronApplication, type Page } from "@playwright/test";

import { blankPdf } from "./blank-pdf.js";
import { expect, test } from "./fixtures/electron-app.js";

test("counts canvases within the visible page window", async ({ desktop }) => {
  await openSample(desktop.app, desktop.page, 25);
  expectWindow(await canvasReport(desktop.page), 25);
  await desktop.page.evaluate(
    "(() => { const node = document.querySelector('.oi-reader-column'); node.scrollTop = node.scrollHeight / 2; })()",
  );
  await expect
    .poll(async () => (await canvasReport(desktop.page)).visible[0])
    .toBeGreaterThan(1);
  expectWindow(await canvasReport(desktop.page), 25);
});

test("jumps with the menu, steps back, then leaves when history is empty", async ({
  desktop,
}) => {
  const page = desktop.page;
  await openSample(desktop.app, page, 5);
  await openGoTo(desktop.app, page);
  await page.getByRole("textbox").fill("3");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "转到页码，第 3 / 5 页" }),
  ).toBeVisible();
  await menuBack(desktop.app, page);
  await expect(
    page.getByRole("button", { name: "转到页码，第 1 / 5 页" }),
  ).toBeVisible();
  await menuBack(desktop.app, page);
  await expect(page.locator(".oi-reader")).toHaveCount(0);
});

async function openSample(
  app: ElectronApplication,
  page: Page,
  pageCount: number,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "oi-pdf-"));
  const pdfPath = path.join(dir, "sample.pdf");
  await writeFile(pdfPath, blankPdf(pageCount));
  try {
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showOpenDialogSync = () => [filePath];
    }, pdfPath);
    await page.getByRole("button", { name: "打开文件…" }).click();
    await page.getByRole("cell", { name: "sample" }).dblclick();
    await expect(
      page.getByText(`第 1 / ${String(pageCount)} 页`),
    ).toBeVisible();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function openGoTo(app: ElectronApplication, page: Page): Promise<void> {
  await page.keyboard.press("Control+g");
  if ((await page.getByRole("textbox").count()) === 0) {
    await clickMenu(app, "转到页码…");
  }
  await expect(page.getByRole("textbox")).toBeFocused();
}

async function menuBack(app: ElectronApplication, page: Page): Promise<void> {
  const label = page.getByRole("button", { name: /转到页码/ });
  const before = await label.innerText();
  await page.keyboard.press("Alt+ArrowLeft");
  await page.waitForTimeout(300);
  if ((await label.count()) > 0 && (await label.innerText()) === before) {
    await clickMenu(app, "后退");
  }
}

async function clickMenu(
  app: ElectronApplication,
  label: string,
): Promise<void> {
  const clicked: unknown = await app.evaluate(({ Menu }, name) => {
    const isClick = (value: unknown): value is () => void =>
      typeof value === "function";
    const stack = [Menu.getApplicationMenu()];
    while (stack.length > 0) {
      const menu = stack.pop();
      if (menu === null || menu === undefined) continue;
      for (const item of menu.items) {
        if (item.label === name && isClick(item.click)) {
          item.click();
          return true;
        }
        if (item.submenu) stack.push(item.submenu);
      }
    }
    return false;
  }, label);
  expect(clicked).toBe(true);
}

const canvasReportSource =
  '(() => { const column = document.querySelector(".oi-reader-column"); const view = column.getBoundingClientRect(); const visible = []; const kept = []; for (const article of column.querySelectorAll("article")) { const box = article.getBoundingClientRect(); const page = Number(article.getAttribute("data-page")); if (Math.min(box.bottom, view.bottom) > Math.max(box.top, view.top)) visible.push(page); if (article.querySelector("canvas")) kept.push(page); } return { pageCount: column.querySelectorAll("article").length, visible, kept }; })()';

async function canvasReport(page: Page): Promise<CanvasReport> {
  const value: unknown = await page.evaluate(canvasReportSource);
  if (!isReport(value)) throw new Error("canvas report");
  return value;
}

function isReport(value: unknown): value is CanvasReport {
  if (typeof value !== "object" || value === null) return false;
  const report = value as {
    pageCount?: unknown;
    visible?: unknown;
    kept?: unknown;
  };
  return (
    typeof report.pageCount === "number" &&
    Array.isArray(report.visible) &&
    Array.isArray(report.kept)
  );
}

type CanvasReport = {
  pageCount: number;
  visible: number[];
  kept: number[];
};

function expectWindow(report: CanvasReport, pageCount: number): void {
  expect(report.pageCount).toBe(pageCount);
  const first = Math.min(...report.visible);
  const last = Math.max(...report.visible);
  expect(report.kept.length).toBeLessThanOrEqual(report.visible.length + 4);
  for (const page of report.kept) {
    expect(page).toBeGreaterThanOrEqual(Math.max(1, first - 2));
    expect(page).toBeLessThanOrEqual(last + 2);
  }
}
