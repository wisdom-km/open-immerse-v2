# library

文献导入、SHA-256 身份、列表排序、原路径重定位、阅读进度。界面在 `src/ui/`，由 desktop 装配。

公开 API：`src/index.ts` 转出导入、列表、重定位、阅读进度和 `createLibraryIpcHandlers`。`createLibraryMain` 在 `@oi/feature-library/main`，不从桶转出，避免把 Node 拉进 core。desktop 从该子路径装配。界面在 `@oi/feature-library/ui`，renderer 用这条子路径注册，不深引 `src/ui`。这条子路径不进 `tsconfig.build.json` 的 emit，由 esbuild 打包。`src/pure.ts` 没有展示函数。

所有者：@wisdom-km。热点文件：无。
