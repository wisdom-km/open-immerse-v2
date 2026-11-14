# settings

解析服务配置的元数据。本包只读 `set_providers` 里 `purpose = 'parse'` 的那一行，并按所引用的 `credential_slot` 问密钥端口能不能用。不写密钥，不保存配置。

公开 API：`src/index.ts` 只转出 `createGetParseServiceStatus`。SQLite、迁移目录和 `parsing.getParseCapabilities` 的 handler 工厂在 `@oi/feature-settings/main`，不从桶转出。`src/pure.ts` 转出分类函数。

所有者：@wisdom-km。热点文件：无。
