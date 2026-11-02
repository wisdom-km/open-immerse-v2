/** ARCHITECTURE §4.1：时间由调用方注入。kernel 不读系统时钟。 */
export interface Clock {
  nowMs(): number;
}
