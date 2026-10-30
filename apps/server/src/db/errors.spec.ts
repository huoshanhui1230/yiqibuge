import { describe, expect, it } from "vitest";

import { isDuplicateKey } from "./errors";

describe("唯一键冲突", () => {
  it("mysql2 直接抛的", () => {
    expect(isDuplicateKey({ code: "ER_DUP_ENTRY" })).toBe(true);
  });

  it("Drizzle 包了一层，原始错误在 cause 里（接口测试里两个请求同时登录时就是这样）", () => {
    expect(isDuplicateKey({ message: "Failed query", cause: { code: "ER_DUP_ENTRY" } })).toBe(true);
  });

  it("别的错误不算", () => {
    expect(isDuplicateKey({ code: "ER_LOCK_DEADLOCK" })).toBe(false);
    expect(isDuplicateKey(new Error("boom"))).toBe(false);
    expect(isDuplicateKey(null)).toBe(false);
  });
});
