import { expect, it } from "vitest";

import {
  applicationMenuTemplate,
  fileMenu,
  goToPageEvent,
  historyBackEvent,
  historyForwardEvent,
  openFileEvent,
  openFileScript,
  returnLibraryEvent,
  returnLibraryScript,
  scriptForMenuEvent,
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
  const win = viewMenu("视图(&V)", "Alt+Left", "Alt+Right", "Ctrl+G");
  const mac = viewMenu("显示", "Cmd+[", "Cmd+]", "Alt+Cmd+G");
  expect(applicationMenuTemplate("darwin")).toEqual([
    { role: "appMenu" },
    fileMenu,
    { role: "editMenu" },
    mac,
    { role: "windowMenu" },
  ]);
  expect(applicationMenuTemplate("win32")).toEqual([
    fileMenu,
    { role: "editMenu" },
    win,
    { role: "windowMenu" },
  ]);
  expect(applicationMenuTemplate("linux")).toEqual(
    applicationMenuTemplate("win32"),
  );
  expect(historyBackEvent).toBe("oi-history-back");
  expect(historyForwardEvent).toBe("oi-history-forward");
  expect(goToPageEvent).toBe("oi-go-to-page");
  for (const entry of applicationMenuTemplate("darwin")) {
    if ("items" in entry) {
      for (const item of entry.items)
        expect(item).not.toHaveProperty("enabled");
    }
  }
  expect(scriptForMenuEvent(historyBackEvent)).toBe(
    `window.dispatchEvent(new Event(${JSON.stringify(historyBackEvent)}))`,
  );
  expect(JSON.stringify(applicationMenuTemplate("darwin"))).not.toMatch(
    /打开文件夹|删除|访达|资源管理器|放大|缩小|适合宽度/,
  );
});

function viewMenu(label: string, back: string, forward: string, goTo: string) {
  return {
    label,
    items: [
      { label: "后退", accelerator: back, event: historyBackEvent },
      { label: "前进", accelerator: forward, event: historyForwardEvent },
      { label: "转到页码…", accelerator: goTo, event: goToPageEvent },
    ],
  };
}
