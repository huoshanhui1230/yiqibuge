/**
 * MySQL 唯一键冲突（ER_DUP_ENTRY）。
 * Drizzle 会把 mysql2 的错误包一层（DrizzleQueryError），原始错误在 cause 里，两处都要看。
 */
export function isDuplicateKey(error: unknown): boolean {
  const direct = (error as { code?: unknown } | null)?.code;
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause?.code;

  return direct === "ER_DUP_ENTRY" || cause === "ER_DUP_ENTRY";
}
