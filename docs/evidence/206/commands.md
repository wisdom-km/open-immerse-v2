# 批次 E 计划换基

Node v22.23.4。工作目录是仓库根。基线 main `a81ae5f317798815e5fb9f4ef1aeaa1586eb9a02`。没有改产品代码。没有 Ready、合入或发版。

## node tools/compare-spec-bytes/compare.mjs

退出码 0。PRD.md 36 段、ARCHITECTURE.md 66 段、RULES.md 与基线 `f8d5d01` 一致。changelog 与 manifest 保留 #206 和 #208 两边的条目。

```
compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (196494 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (374058 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes
```

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。0 个功能切片。`check-pr-size` 含本文件是 491 行。
