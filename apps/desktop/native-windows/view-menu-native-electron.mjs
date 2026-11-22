import { app, Menu } from "electron";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const shapes = ["none", "original", "contrast", "translation"];

app
  .whenReady()
  .then(() => observeShapes())
  .catch((error) => fail(error));

async function observeShapes() {
  const outDir = compiledDir();
  const mirror = await import(fileUrl(outDir, "view-menu-mirror.js"));
  const menuMod = await import(fileUrl(outDir, "library-menu.js"));
  for (const shape of shapes) {
    process.stdout.write(
      `${JSON.stringify(observe(mirror, menuMod, shape))}\n`,
    );
  }
  app.exit(0);
}

function compiledDir() {
  const outDir = process.argv[2];
  if (outDir === undefined || outDir.length === 0) {
    fail(new Error("compiled directory missing"));
  }
  return outDir;
}

function fileUrl(outDir, name) {
  return pathToFileURL(path.join(outDir, name)).href;
}

function observe(mirror, menuMod, shape) {
  const descriptions = mirror.viewSlotDescriptions(shape);
  const view = findView(menuMod.applicationMenuTemplate(process.platform));
  const built = Menu.buildFromTemplate([
    { label: view.label, submenu: applySlots(view.items, descriptions) },
  ]);
  const submenu = built.items[0]?.submenu;
  if (submenu == null) fail(new Error("view submenu missing"));
  if (typeof submenu._menuWillShow !== "function") {
    fail(new Error("missing _menuWillShow"));
  }
  submenu._menuWillShow();
  return {
    shape,
    items: submenu.items.map((item) => ({
      label: item.label,
      type: item.type,
      checked: item.checked,
    })),
  };
}

function findView(template) {
  const label = process.platform === "darwin" ? "显示" : "视图(&V)";
  const view = template.find((entry) => entry.label === label);
  if (view == null || !Array.isArray(view.items)) {
    fail(new Error(`view menu missing: ${label}`));
  }
  return view;
}

function applySlots(items, descriptions) {
  return items.map((item) => {
    const slot = descriptions.find((entry) => entry.event === item.event);
    const next = { label: item.label };
    if (typeof item.accelerator === "string")
      next.accelerator = item.accelerator;
    if (slot != null && slot.type === "radio") {
      next.type = slot.type;
      next.checked = slot.checked;
    }
    return next;
  });
}

function fail(error) {
  const text = error instanceof Error ? error.stack : String(error);
  process.stderr.write(`${text ?? "native view menu failed"}\n`);
  if (app.isReady()) app.exit(1);
  else process.exit(1);
  throw error;
}
