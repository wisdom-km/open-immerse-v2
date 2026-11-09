import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseLibraryEntryId, type LibraryEntryId } from "@oi/feature-library";
import { createLibraryMain, type LibraryMain } from "@oi/feature-library/main";
import { expect, it, vi } from "vitest";

import { startLibrary } from "../src/main/library-wiring.js";
import { createReadingAssetPath } from "../src/main/reading-asset-path.js";
import {
  respondToReadingAsset,
  type ReadingAssetPort,
} from "../src/main/reading-asset-protocol.js";

const shell = vi.hoisted(() => {
  return { quit: (): void => undefined };
});

vi.mock("electron", () => {
  return {
    app: {
      on(_event: string, listener: () => void) {
        shell.quit = listener;
      },
    },
    BrowserWindow: {},
    dialog: {},
    Menu: {
      setApplicationMenu() {
        return undefined;
      },
      buildFromTemplate() {
        return {};
      },
    },
    protocol: {
      handle() {
        throw new Error("protocol.handle");
      },
    },
  };
});

const CODES = [
  "not_found",
  "sender_rejected",
  "rejected",
  "invalid_payload",
  "handler_threw",
  "not_pdf",
  "storage.invalid_path",
];

type Paper = {
  readonly main: LibraryMain;
  readonly dataRoot: string;
  readonly root: string;
  readonly id: LibraryEntryId;
  readonly assetId: string;
  readonly generation: number;
};

it("registers oi-asset through the injected function when startLibrary runs", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-asset-wire-"));
  let seen = false;
  try {
    const handlers = startLibrary(root, (scheme, handler) => {
      seen = true;
      expect(scheme).toBe("oi-asset");
      expect(handler({ url: "oi-asset://1", method: "GET" }).status).toBe(404);
      expect(handler({ url: "oi-asset://1", method: "POST" }).status).toBe(405);
    });
    expect(seen).toBe(true);
    expect(handlers.has("library.bindReadingAsset")).toBe(true);
  } finally {
    shell.quit();
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns 200 when GET reads the current source pdf", async () => {
  await withPaper(async (paper) => {
    const port = createReadingAssetPath(paper.main, paper.dataRoot);
    const filePath = mustPath(port(paper.assetId));
    const response = respondToReadingAsset(
      assetUrl(paper.assetId),
      "GET",
      port,
    );
    await expectPdf(response, filePath, [paper.root]);
  });
});

it("returns 200 without a body when HEAD reads the current source pdf", async () => {
  await withPaper(async (paper) => {
    const port = createReadingAssetPath(paper.main, paper.dataRoot);
    const response = respondToReadingAsset(
      assetUrl(paper.assetId),
      "HEAD",
      port,
    );
    await expectHead(response, [paper.root]);
  });
});

it("returns 404 when the asset id was never bound", async () => {
  await withPaper(async (paper) => {
    const response = respondToReadingAsset(
      "oi-asset://9",
      "GET",
      createReadingAssetPath(paper.main, paper.dataRoot),
    );
    await expectEmpty(response, 404, [paper.root]);
  });
});

it("returns 404 when the asset id was revoked", async () => {
  await withPaper(async (paper) => {
    await paper.main.reading.revokeReadingAsset({
      id: paper.id,
      generation: paper.generation,
    });
    const response = respondToReadingAsset(
      assetUrl(paper.assetId),
      "GET",
      createReadingAssetPath(paper.main, paper.dataRoot),
    );
    await expectEmpty(response, 404, [paper.root]);
  });
});

it("returns 404 when the asset id is from the previous generation", async () => {
  await withPaper(async (paper) => {
    const again = await paper.main.reading.bindReadingAsset({ id: paper.id });
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    const port = createReadingAssetPath(paper.main, paper.dataRoot);
    const stale = respondToReadingAsset(assetUrl(paper.assetId), "GET", port);
    const fresh = respondToReadingAsset(
      assetUrl(again.value.assetId),
      "GET",
      port,
    );
    await expectEmpty(stale, 404, [paper.root]);
    await expectPdf(fresh, mustPath(port(again.value.assetId)), [paper.root]);
  });
});

it("returns 404 when the host is the document id or keeps a leading zero", async () => {
  await withPaper(async (paper) => {
    expect(paper.assetId).toBe("1");
    const port = createReadingAssetPath(paper.main, paper.dataRoot);
    const document = respondToReadingAsset(
      `oi-asset://${paper.id}`,
      "GET",
      port,
    );
    const padded = respondToReadingAsset("oi-asset://01", "GET", port);
    await expectEmpty(document, 404, [paper.root, paper.id]);
    await expectEmpty(padded, 404, [paper.root]);
  });
});

it("returns 404 when the host is an ipv4 spelling of the asset id", async () => {
  await withPaper(async (paper) => {
    expect(paper.assetId).toBe("1");
    const response = respondToReadingAsset(
      "oi-asset://0.0.0.1/",
      "GET",
      createReadingAssetPath(paper.main, paper.dataRoot),
    );
    await expectEmpty(response, 404, [paper.root]);
  });
});

it("returns 404 when dotdot or percent-encoded dotdot is in the url", () => {
  const urls = [
    "oi-asset://../secret",
    "oi-asset://..",
    "oi-asset://%2e%2e",
    "oi-asset://%2E%2E/",
    "oi-asset://1/%2e%2e",
    "oi-asset://1/..",
  ];
  for (const url of urls) {
    const response = respondToReadingAsset(url, "GET", trap());
    expect(response.status).toBe(404);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  }
});

it("returns 404 when the url has userinfo, a port, a query, a fragment, or another scheme", () => {
  const urls = [
    "oi-asset://user:pass@1",
    "oi-asset://1:80",
    "oi-asset://1?x=1",
    "oi-asset://1#frag",
    "oi-asset://1/extra",
    "http://1",
    "not a url",
  ];
  for (const url of urls) {
    expect(respondToReadingAsset(url, "GET", trap()).status).toBe(404);
  }
});

it("returns 405 when the method is not GET or HEAD", () => {
  expect(respondToReadingAsset("oi-asset://1", "POST", trap()).status).toBe(
    405,
  );
  expect(respondToReadingAsset("oi-asset://1", "PUT", trap()).status).toBe(405);
});

it("returns 404 when a source symlink points outside the entry", async () => {
  const fixture = linkedPdf("file");
  try {
    const response = respondToReadingAsset("oi-asset://1", "GET", () => {
      return fixture.filePath;
    });
    await expectEmpty(response, 404, [fixture.root, fixture.outside]);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
    rmSync(fixture.outside, { recursive: true, force: true });
  }
});

it("returns 404 when the entry directory symlink points outside", async () => {
  const fixture = linkedPdf("directory");
  try {
    const response = respondToReadingAsset("oi-asset://1", "GET", () => {
      return fixture.filePath;
    });
    await expectEmpty(response, 404, [fixture.root, fixture.outside]);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
    rmSync(fixture.outside, { recursive: true, force: true });
  }
});

it("returns 404 when the file is not a pdf", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-asset-"));
  const filePath = path.join(root, "ab".repeat(32), "source.pdf");
  try {
    mkdirSync(path.dirname(filePath));
    writeFileSync(filePath, "<svg></svg>\n");
    const response = respondToReadingAsset(
      "oi-asset://1",
      "GET",
      () => filePath,
    );
    await expectEmpty(response, 404, [root, "<svg"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("returns 404 when the copy was deleted", async () => {
  await withPaper(async (paper) => {
    const port = createReadingAssetPath(paper.main, paper.dataRoot);
    unlinkSync(mustPath(port(paper.assetId)));
    const response = respondToReadingAsset(
      assetUrl(paper.assetId),
      "GET",
      port,
    );
    await expectEmpty(response, 404, [paper.root]);
  });
});

it("returns 404 when the data root cannot be opened", async () => {
  const secret = "secret-root-hidden";
  const main = createLibraryMain({
    dataRoot: `${secret}\u0000`,
    clock: { nowMs: () => Date.parse("2026-11-09T12:00:00.000Z") },
    pickPdf: { pick: () => ({ kind: "cancelled" }) },
  });
  try {
    const response = respondToReadingAsset(
      "oi-asset://1",
      "GET",
      createReadingAssetPath(main, `${secret}\u0000`),
    );
    await expectEmpty(response, 404, [secret]);
  } finally {
    main.close();
  }
});

it("returns undefined when locate misses or the id is not a sha256", () => {
  const port = createReadingAssetPath(
    {
      locate(assetId) {
        return assetId === "1" ? "zz" : undefined;
      },
    },
    "/tmp/oitest-asset-root",
  );
  expect(port("9")).toBeUndefined();
  expect(port("1")).toBeUndefined();
});

function trap(): ReadingAssetPort {
  return () => {
    throw new Error("port");
  };
}

function asEntryId(value: string): LibraryEntryId {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}

function assetUrl(assetId: string): string {
  return `oi-asset://${assetId}`;
}

function mustPath(filePath: string | undefined): string {
  if (filePath === undefined) {
    throw new Error("path");
  }
  return filePath;
}

function pdfBytes(): Uint8Array {
  return new TextEncoder().encode("%PDF-1.4\n% paper\n");
}

async function withPaper(run: (paper: Paper) => Promise<void>): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-asset-"));
  const source = path.join(root, "Paper.pdf");
  writeFileSync(source, pdfBytes());
  const dataRoot = path.join(root, "data");
  const main = createLibraryMain({
    dataRoot,
    clock: { nowMs: () => Date.parse("2026-11-09T12:00:00.000Z") },
    pickPdf: { pick: () => ({ kind: "chosen", filePath: source }) },
  });
  try {
    await run(await boundPaper(main, dataRoot, root));
  } finally {
    main.close();
    rmSync(root, { recursive: true, force: true });
  }
}

async function boundPaper(
  main: LibraryMain,
  dataRoot: string,
  root: string,
): Promise<Paper> {
  const imported = await main.handlers.import({});
  if (!imported.ok) {
    throw new Error("import");
  }
  const id = asEntryId(imported.value.entry.id);
  const bound = await main.reading.bindReadingAsset({ id });
  if (!bound.ok) {
    throw new Error("bind");
  }
  return {
    main,
    dataRoot,
    root,
    id,
    assetId: bound.value.assetId,
    generation: bound.value.generation,
  };
}

function linkedPdf(kind: "file" | "directory"): {
  readonly root: string;
  readonly outside: string;
  readonly filePath: string;
} {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-asset-"));
  const outside = mkdtempSync(path.join(tmpdir(), "oitest-asset-out-"));
  const entry = path.join(root, "ab".repeat(32));
  const target = path.join(outside, "source.pdf");
  writeFileSync(target, pdfBytes());
  if (kind === "directory") {
    symlinkSync(outside, entry, "junction");
  } else {
    mkdirSync(entry);
    symlinkSync(target, path.join(entry, "source.pdf"));
  }
  return { root, outside, filePath: path.join(entry, "source.pdf") };
}

async function expectPdf(
  response: Response,
  filePath: string,
  secrets: readonly string[],
): Promise<void> {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("content-security-policy")).toBeNull();
  expect(response.headers.get("accept-ranges")).toBeNull();
  expect(leaks(headerText(response), secrets)).toEqual([]);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(
    new Uint8Array(readFileSync(filePath)),
  );
}

async function expectHead(
  response: Response,
  secrets: readonly string[],
): Promise<void> {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(new Uint8Array(await response.arrayBuffer()).byteLength).toBe(0);
  expect(leaks(headerText(response), secrets)).toEqual([]);
}

async function expectEmpty(
  response: Response,
  status: number,
  secrets: readonly string[],
): Promise<void> {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8",
  );
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("content-security-policy")).toBeNull();
  expect(response.headers.get("accept-ranges")).toBeNull();
  const body = new Uint8Array(await response.arrayBuffer());
  expect(body.byteLength).toBe(0);
  expect(
    leaks(
      `${headerText(response)}\n${new TextDecoder().decode(body)}`,
      secrets,
    ),
  ).toEqual([]);
}

function headerText(response: Response): string {
  return [...response.headers.entries()]
    .map(([name, value]) => `${name}: ${value}`)
    .join("\n");
}

function leaks(text: string, secrets: readonly string[]): string[] {
  const hits = CODES.filter((code) => text.includes(code));
  for (const secret of secrets) {
    if (text.includes(secret)) {
      hits.push(secret);
    }
  }
  return hits;
}
