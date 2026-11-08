/**
 * 生产装配实际注册的命令。
 * `library-wiring` 的 Map 只从这里取 key。
 * registry 里多出来的命令不能在测试里补。
 */
export const libraryCommandChannels = [
  "library.import",
  "library.importDropped",
  "library.list",
  "library.relocate",
] as const;

export type LibraryCommandChannel = (typeof libraryCommandChannels)[number];
