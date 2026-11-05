# PR #172 oi-app 放行 js/css

日期：2026-11-05。工作目录是仓库根，e2e 的工作目录是 `apps/desktop`。Node v22.23.4。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。

真机 FAIL 的 tip 是 `6f2b7ee`。根因是 `relativePath` 只放行 `.html`，`main.js` 404，`library.css` 的 404 类型是 `text/plain`，被 `nosniff` 拒绝。MIME 表本来就有 `text/javascript` 和 `text/css`。

没有跑 Windows 真机。没有跑全量 `pnpm test` / `pnpm run check`（RULES §4：同一 tip 的全量只跑一次；这次只跑下面这些）。没有跳过。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run apps/desktop/test/static-file.test.ts apps/desktop/test/protocol-response.test.ts apps/desktop/test/mime-types.test.ts` | 0 | 3 个文件，22 passed |
| `corepack pnpm exec eslint` 对 `static-file.ts`、两份单测、`e2e/static-assets.spec.ts` | 0 | `--max-warnings 0` |
| `corepack pnpm --filter desktop build` | 0 | 含 renderer 打包 |
| `xvfb-run -a corepack pnpm exec playwright test e2e/static-assets.spec.ts e2e/isolation.spec.ts e2e/csp.spec.ts` | 0 | 11 passed。文献库出现「把论文 PDF 拖到这里」和「打开文件…」。`library.css` 的 `cssRules` 长度大于 0。isolation 与 CSP 仍过 |

`fetch("oi-app://app/main.js")` 在页面里是 `Failed to fetch`。方案注册没有 `supportFetchAPI`，ARCH §9 不给这个特权。脚本和样式走的是 `<script>` / `<link>`，不走 `fetch`。e2e 因此不调用 `fetch`。
