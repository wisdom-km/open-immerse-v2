import { Type, type Static } from "@sinclair/typebox";

import type { LibraryEntryId } from "./library.js";
import {
  libraryEntryIdSchema,
  libraryFileNameSchema,
  libraryTitleSchema,
} from "./library.js";

const closed = { additionalProperties: false } as const;

/** 断言不改运行时校验。static 让推导类型带上 LibraryEntryId。 */
const sessionIdSchema = libraryEntryIdSchema as typeof libraryEntryIdSchema & {
  readonly static: LibraryEntryId;
};

/**
 * 中文栏位是「原文 / 对照 / 译文」。
 * ③ 临时默认 original（Wisdom 2026-11-05 21:01，批准 1A）。
 * DESIGN.md 正文仍写默认「对照」；本文件不改它。M4 恢复默认对照。
 * schema 不填默认值，缺 viewMode 的对象不通过。
 */
export const readerViewModeSchema = Type.Union([
  Type.Literal("original"),
  Type.Literal("contrast"),
  Type.Literal("translation"),
]);

/** DESIGN §11.3，Wisdom 2026-11-04 03:21。整数百分比。fit 字面量只在 setZoom。 */
export const readerZoomPercentSchema = Type.Integer({
  minimum: 25,
  maximum: 400,
});

const positivePageSchema = Type.Integer({ minimum: 1 });

export const readerSessionSchema = Type.Object(
  {
    id: sessionIdSchema,
    title: libraryTitleSchema,
    fileName: libraryFileNameSchema,
    pageCount: positivePageSchema,
    currentPage: positivePageSchema,
    zoomPercent: readerZoomPercentSchema,
    viewMode: readerViewModeSchema,
  },
  closed,
);

export type ReaderViewMode = Static<typeof readerViewModeSchema>;

/**
 * renderer 可达的阅读会话。没有绝对路径。
 * id 与文献库条目是同一个 SHA-256（LibraryEntryId）。
 * currentPage 与 pageCount 各自为正整数。
 * currentPage ≤ pageCount 由 reader core 保证；这条闭对象 schema 不做跨字段比较。
 * 位置后退栈（最多 50，不持久化）不在本类型里。
 */
export type ReaderSession = {
  readonly [Key in keyof Static<typeof readerSessionSchema>]: Static<
    typeof readerSessionSchema
  >[Key];
};
