import { Type, type Static } from "@sinclair/typebox";

declare const libraryEntryIdBrand: unique symbol;

/** SHA-256，64 位小写十六进制。运行时仍是字符串（ARCH §2.4）。 */
export type LibraryEntryId = string & {
  readonly [libraryEntryIdBrand]: "LibraryEntryId";
};

const closed = { additionalProperties: false } as const;

/** 64 位小写十六进制。大写、短一截、多一截都不收。 */
export const libraryEntryIdSchema = Type.String({
  pattern: "^[0-9a-f]{64}$",
});

/** 只有文件名。斜杠和反斜杠都拒绝，绝对路径进不了这个字段。 */
export const libraryFileNameSchema = Type.String({
  minLength: 1,
  pattern: "^[^/\\\\]+$",
});

/**
 * 标题可以含斜杠（例如 TCP/IP），但不能本身是绝对路径。
 * 以 `/`、`\\` 或盘符开头的字符串拒绝。
 */
export const libraryTitleSchema = Type.String({
  pattern: "^(?!/)(?!\\\\)(?![A-Za-z]:[\\\\/]).*$",
});

/** UTC 的 ISO-8601，带 `Z`。绝对路径对不上这个形状。 */
export const libraryTimestampSchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z$",
});

export const libraryEntrySchema = Type.Object(
  {
    id: libraryEntryIdSchema,
    fileName: libraryFileNameSchema,
    title: libraryTitleSchema,
    addedAt: libraryTimestampSchema,
    openedAt: Type.Union([libraryTimestampSchema, Type.Null()]),
  },
  closed,
);

/** 返回给 renderer 的文献条目。不含任何路径字段。 */
export type LibraryEntry = {
  readonly id: LibraryEntryId;
  readonly fileName: string;
  readonly title: string;
  readonly addedAt: string;
  readonly openedAt: string | null;
};

/**
 * 仅 main 侧，不得进入 IPC 响应。
 * 原路径只留给 main / core。没有任何 library IPC schema 引用这个类型。
 */
export type LibrarySourceRecord = LibraryEntry & {
  readonly originalPath: string;
};

export const librarySortFieldSchema = Type.Union([
  Type.Literal("title"),
  Type.Literal("status"),
  Type.Literal("openedAt"),
  Type.Literal("addedAt"),
]);

export const librarySortDirSchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);

export const librarySortSchema = Type.Object(
  {
    field: librarySortFieldSchema,
    dir: librarySortDirSchema,
  },
  closed,
);

export const libraryViewSchema = Type.Union([
  Type.Literal("recent"),
  Type.Literal("all"),
]);

export type LibrarySortField = Static<typeof librarySortFieldSchema>;

export type LibrarySortDir = Static<typeof librarySortDirSchema>;

export type LibrarySort = Static<typeof librarySortSchema>;

/**
 * recent：openedAt 非空，由 core 筛，按 openedAt 降序（#166 决定 5）。
 * 启动落在 recent（#166 决定 8）。空列表时去「全部论文」的链接是 UI，不在本契约。
 * all：全部条目。未传 sort 时，openedAt 为空的排后，再按 addedAt 降序（#166 决定 10）。
 * ARCH §9.1 的默认 openedAt desc 用于 recent。all 的默认以决定 10 为准。
 * schema 不填这些默认值。实现在 PR-B。
 * status 保留 ARCH §9.1 的枚举。②没有解析状态，按 status 排序的行为在 PR-B 再定义。
 * sort.dir 是 asc | desc，不是文件系统路径。
 */
export type LibraryView = Static<typeof libraryViewSchema>;
