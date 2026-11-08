import { Type, type Static } from "@sinclair/typebox";

const closed = { additionalProperties: false } as const;

/**
 * 运行时义务（本文件不执行）：没有元数据记录才是 unconfigured。
 * 没有记录指向的密文不参与判断。configured 还要密钥可用。
 * 记录在，但密钥缺失、解密失败或损坏，是错误，不是 unconfigured。
 * 构建是否提供解析、本篇是否已有译文，都不是这个成功体。
 */
export const parseServiceStatusSchema = Type.Object(
  {
    state: Type.Union([
      Type.Literal("configured"),
      Type.Literal("unconfigured"),
    ]),
  },
  closed,
);

/** 写入成功只表示已经 configured。失败留在错误里，不返回 unconfigured。 */
export const parseServiceConfiguredSchema = Type.Object(
  { state: Type.Literal("configured") },
  closed,
);

export type ParseServiceStatus = Static<typeof parseServiceStatusSchema>;
export type ParseServiceConfigured = Static<
  typeof parseServiceConfiguredSchema
>;
