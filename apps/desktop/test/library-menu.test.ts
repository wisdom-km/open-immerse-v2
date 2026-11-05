import { expect, it } from "vitest";

import {
  applicationMenuTemplate,
  fileMenu,
  openFileEvent,
  openFileScript,
} from "../src/main/library-menu.js";

it("describes only open when the file menu is built", () => {
  expect(fileMenu.label).toBe("文件");
  expect(fileMenu.items).toEqual([
    { label: "打开…", accelerator: "CmdOrCtrl+O" },
  ]);
  expect(openFileEvent).toBe("oi-open-file");
  expect(openFileScript()).toBe(
    'window.dispatchEvent(new Event("oi-open-file"))',
  );
  expect(JSON.stringify(fileMenu)).not.toMatch(
    /打开文件夹|删除|访达|资源管理器/,
  );
});

it("keeps the system roles and adds only open", () => {
  expect(applicationMenuTemplate("darwin")).toEqual([
    { role: "appMenu" },
    fileMenu,
    { role: "editMenu" },
    { role: "windowMenu" },
  ]);
  expect(applicationMenuTemplate("win32")).toEqual([
    fileMenu,
    { role: "editMenu" },
    { role: "windowMenu" },
  ]);
  expect(applicationMenuTemplate("linux")).toEqual(
    applicationMenuTemplate("win32"),
  );
  expect(JSON.stringify(applicationMenuTemplate("darwin"))).not.toMatch(
    /打开文件夹|删除|访达|资源管理器/,
  );
});
