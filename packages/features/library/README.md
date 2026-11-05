# library

文献导入、SHA-256 身份、列表排序、原路径重定位、阅读进度。没有界面。

公开 API：`src/index.ts` 转出导入、列表、重定位、阅读进度的工厂，以及错误与端口类型。适配器在 `src/adapters/`，由 main 以后注入；本包不注册 IPC。`src/pure.ts` 没有展示函数。

所有者：@wisdom-km。热点文件：无。
