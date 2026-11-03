/**
 * 保持 Prettier 默认值（printWidth 80），不另设选项。
 * `pnpm check` 只检查 *.ts、*.tsx、*.mjs、*.js、*.cjs。
 * Markdown 不格式化（N-10）。.github 不格式化（N-02）。
 * 排除项写在 .prettierignore。违例样例在 tools/gate-fixtures/g1/，不进入必需检查。
 */
export default {};
