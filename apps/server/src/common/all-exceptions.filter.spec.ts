import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  type ArgumentsHost,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AllExceptionsFilter, type ApiError } from "./all-exceptions.filter";

function hostWith(headers: Record<string, string | string[] | undefined> = {}) {
  const sent: { status?: number; body?: ApiError } = {};

  const response = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: unknown) {
      sent.body = body as ApiError;
    },
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: "GET", url: "/api/v1/x", headers }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, sent };
}

describe("统一错误返回", () => {
  const filter = new AllExceptionsFilter();

  beforeEach(() => {
    // 500 的分支会打日志，测试里不需要看
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  it("把 NestJS 自带的英文文案换成中文", () => {
    const { host, sent } = hostWith();

    // 路由找不到时 Nest 给的是「Cannot GET /api/v1/x」
    filter.catch(new NotFoundException("Cannot GET /api/v1/x"), host);

    expect(sent.status).toBe(404);
    expect(sent.body?.code).toBe("NOT_FOUND");
    expect(sent.body?.message).toBe("找不到要看的内容。");
  });

  it("自己抛的中文 message 原样保留", () => {
    const { host, sent } = hostWith();

    filter.catch(new ForbiddenException("只有群主能改群设置。"), host);

    expect(sent.status).toBe(403);
    expect(sent.body?.message).toBe("只有群主能改群设置。");
  });

  it("ValidationPipe 给的数组取第一条", () => {
    const { host, sent } = hostWith();

    filter.catch(new BadRequestException({ message: ["标题不能为空。", "人数要是数字。"] }), host);

    expect(sent.body?.message).toBe("标题不能为空。");
  });

  it("带了 x-request-id 就回传，方便对日志", () => {
    const { host, sent } = hostWith({ "x-request-id": "req-1" });

    filter.catch(new NotFoundException(), host);

    expect(sent.body?.requestId).toBe("req-1");
  });

  it("没带 x-request-id 时不塞这个字段", () => {
    const { host, sent } = hostWith();

    filter.catch(new NotFoundException(), host);

    expect(sent.body).not.toHaveProperty("requestId");
  });

  it("不是 HttpException 的意外错误走 500，文案也是中文", () => {
    const { host, sent } = hostWith();

    filter.catch(new Error("boom"), host);

    expect(sent.status).toBe(500);
    expect(sent.body?.code).toBe("INTERNAL_ERROR");
    expect(sent.body?.message).toBe("服务器出了点问题，稍后再试。");
  });
});
