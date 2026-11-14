import { expect, it } from "vitest";

import {
  applicationMenuTemplate,
  fileMenu,
  openFileEvent,
  openFileScript,
  returnLibraryEvent,
  returnLibraryScript,
  scriptForMenuEvent,
  type ShellMenuEntry,
} from "../src/main/library-menu.js";

it("describes open and return when the file menu is built", () => {
  expect(fileMenu.label).toBe("文件");
  expect(fileMenu.items).toEqual([
    { label: "打开…", accelerator: "CmdOrCtrl+O", event: "oi-open-file" },
    { label: "返回文献库", event: "oi-return-library" },
  ]);
  expect(openFileEvent).toBe("oi-open-file");
  expect(returnLibraryEvent).toBe("oi-return-library");
  expect(openFileScript()).toBe(
    'window.dispatchEvent(new Event("oi-open-file"))',
  );
  expect(returnLibraryScript()).toBe(
    'window.dispatchEvent(new Event("oi-return-library"))',
  );
  expect(scriptForMenuEvent(openFileEvent)).toBe(openFileScript());
  expect(scriptForMenuEvent(returnLibraryEvent)).toBe(returnLibraryScript());
  expect(scriptForMenuEvent("oi-unknown")).toBeUndefined();
  expect(JSON.stringify(fileMenu)).not.toMatch(
    /打开文件夹|删除|访达|资源管理器/,
  );
});

it("keeps the system roles and adds the file menu", () => {
  expect(labels(applicationMenuTemplate("darwin"))).toEqual([
    "appMenu",
    "文件",
    "显示",
    "editMenu",
    "windowMenu",
  ]);
  expect(labels(applicationMenuTemplate("win32"))).toEqual([
    "文件",
    "视图(&V)",
    "editMenu",
    "windowMenu",
  ]);
  expect(applicationMenuTemplate("linux")).toEqual(
    applicationMenuTemplate("win32"),
  );
  expect(JSON.stringify(applicationMenuTemplate("darwin"))).not.toMatch(
    /打开文件夹|删除|访达|资源管理器/,
  );
});

it("registers one view accelerator per platform and the literal events", () => {
  const rows = [
    ["后退", "oi-history-back", "Cmd+[", "Alt+Left"],
    ["前进", "oi-history-forward", "Cmd+]", "Alt+Right"],
    ["转到页码…", "oi-go-to-page", "Alt+Cmd+G", "Ctrl+G"],
    ["原文", "oi-view-original", "Cmd+1", "Ctrl+1"],
    ["对照", "oi-view-bilingual", "Cmd+2", "Ctrl+2"],
    ["译文", "oi-view-translation", "Cmd+3", "Ctrl+3"],
    ["放大", "oi-zoom-in", "Cmd+=", "Ctrl+="],
    ["缩小", "oi-zoom-out", "Cmd+-", "Ctrl+-"],
    ["实际大小", "oi-zoom-actual", "Cmd+0", "Ctrl+0"],
    ["适合宽度", "oi-zoom-fit-width", "Alt+Cmd+0", "Ctrl+Alt+0"],
  ];
  const line = (label: string, event: string, key: string) =>
    `${label} ${key} ${event}`;
  const text = (index: number) =>
    rows
      .map((row) => line(row[0] ?? "", row[1] ?? "", row[index] ?? ""))
      .join("\n");
  expect(viewText("darwin")).toBe(text(2));
  expect(viewText("win32")).toBe(text(3));
  expect(scriptForMenuEvent("oi-history-back")).toBe(
    'window.dispatchEvent(new Event("oi-history-back"))',
  );
  expect(scriptForMenuEvent("oi-zoom-in")).toBe(
    'window.dispatchEvent(new Event("oi-zoom-in"))',
  );
});

function labels(template: readonly ShellMenuEntry[]): string[] {
  return template.map((entry) => ("role" in entry ? entry.role : entry.label));
}

function viewText(platform: string): string {
  const entry = applicationMenuTemplate(platform).find(
    (item) =>
      "label" in item && (item.label === "显示" || item.label === "视图(&V)"),
  );
  if (entry === undefined || !("items" in entry)) throw new Error(platform);
  return entry.items
    .map((item) => `${item.label} ${item.accelerator ?? ""} ${item.event}`)
    .join("\n");
}
