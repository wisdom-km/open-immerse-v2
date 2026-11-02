/** ARCHITECTURE §11：调试模式默认关。 */
export const DEBUG_MODE_DEFAULT = false;

/** ARCHITECTURE §11：调试日志最多 7 天。 */
export const DEBUG_LOG_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** ARCHITECTURE §11：调试日志总量上限 50 MB，与 7 天先到先清。 */
export const DEBUG_LOG_MAX_BYTES = 50 * 1024 * 1024;

/** ARCHITECTURE §11：产品日志在应用数据目录下的这个目录名。 */
export const PRODUCT_LOG_DIRECTORY = "diagnostics";

/** ARCHITECTURE §11：调试日志在应用数据目录下的这个目录名。 */
export const DEBUG_LOG_DIRECTORY = "debug";

export type DebugModeChange =
  | { readonly enabled: true }
  | { readonly enabled: false; readonly deleteFiles: boolean };

export interface Logger<TRecord> {
  log(record: TRecord): void;
  setDebugMode(change: DebugModeChange): void;
  clearDebugLogs(): void;
}
