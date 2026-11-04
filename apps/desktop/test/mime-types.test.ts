import { expect, it } from "vitest";

import { contentTypeFor } from "../src/main/mime-types.js";

it("returns text/html when the extension is html", () => {
  expect(contentTypeFor("index.html")).toBe("text/html; charset=utf-8");
  expect(contentTypeFor("INDEX.HTML")).toBe("text/html; charset=utf-8");
});

it("returns text/javascript when the extension is js or mjs", () => {
  expect(contentTypeFor("app.js")).toBe("text/javascript; charset=utf-8");
  expect(contentTypeFor("APP.JS")).toBe("text/javascript; charset=utf-8");
  expect(contentTypeFor("app.mjs")).toBe("text/javascript; charset=utf-8");
  expect(contentTypeFor("APP.MJS")).toBe("text/javascript; charset=utf-8");
});

it("returns text/css when the extension is css", () => {
  expect(contentTypeFor("app.css")).toBe("text/css; charset=utf-8");
  expect(contentTypeFor("APP.CSS")).toBe("text/css; charset=utf-8");
});

it("returns image/svg+xml when the extension is svg", () => {
  expect(contentTypeFor("icon.svg")).toBe("image/svg+xml");
  expect(contentTypeFor("ICON.SVG")).toBe("image/svg+xml");
});

it("returns image/png when the extension is png", () => {
  expect(contentTypeFor("icon.png")).toBe("image/png");
  expect(contentTypeFor("ICON.PNG")).toBe("image/png");
});

it("returns octet-stream when the extension is unknown or missing", () => {
  expect(contentTypeFor("x.bin")).toBe("application/octet-stream");
  expect(contentTypeFor("README")).toBe("application/octet-stream");
});
