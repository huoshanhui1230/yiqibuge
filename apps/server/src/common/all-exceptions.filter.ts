import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";

/** 统一的错误返回格式。message 一律中文，能直接显示给用户。 */
export interface ApiError {
  code: string;
  message: string;
  /** 客户端带了 request_id 就回传，方便对日志 */
  requestId?: string;
}

// 只用到这几个字段，不引 @types/express
interface MinimalRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

interface MinimalResponse {
  status(code: number): MinimalResponse;
  json(body: unknown): void;
}

const CODE_BY_STATUS = new Map<number, string>([
  [HttpStatus.BAD_REQUEST, "BAD_REQUEST"],
  [HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"],
  [HttpStatus.FORBIDDEN, "FORBIDDEN"],
  [HttpStatus.NOT_FOUND, "NOT_FOUND"],
  [HttpStatus.CONFLICT, "CONFLICT"],
  [HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_REQUESTS"],
]);

const MESSAGE_BY_STATUS = new Map<number, string>([
  [HttpStatus.BAD_REQUEST, "请求内容不对，检查一下再试。"],
  [HttpStatus.UNAUTHORIZED, "还没登录，先登录一下。"],
  [HttpStatus.FORBIDDEN, "没有权限做这件事。"],
  [HttpStatus.NOT_FOUND, "找不到要看的内容。"],
  [HttpStatus.CONFLICT, "和当前状态冲突，刷新一下再试。"],
  [HttpStatus.TOO_MANY_REQUESTS, "操作太频繁，歇一会儿再试。"],
]);

/**
 * 项目规则要求错误 message 一律中文、能直接显示给用户（.claude/rules/server.md）。
 * 但 NestJS 自带的文案是英文，比如路由找不到时的「Cannot GET /api/v1/x」。
 * 所以只认带中文的 message，其余一概换成下面的中文兜底。
 */
const HAS_CHINESE = /[一-鿿]/;

/** 取异常自带的 message，没有就返回 null */
function rawMessage(exception: unknown): string | null {
  if (!(exception instanceof HttpException)) {
    return null;
  }

  const response = exception.getResponse();

  if (typeof response === "string") {
    return response;
  }

  if (typeof response === "object" && response !== null) {
    const { message } = response as { message?: unknown };

    if (typeof message === "string") {
      return message;
    }
    // ValidationPipe 给的是一个数组，取第一条就够用户看了
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }

  return null;
}

function messageOf(exception: unknown, status: number): string {
  const raw = rawMessage(exception);

  if (raw !== null && HAS_CHINESE.test(raw)) {
    return raw;
  }

  return MESSAGE_BY_STATUS.get(status) ?? "服务器出了点问题，稍后再试。";
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<MinimalRequest>();
    const response = ctx.getResponse<MinimalResponse>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ApiError = {
      code: CODE_BY_STATUS.get(status) ?? "INTERNAL_ERROR",
      message: messageOf(exception, status),
    };

    const rawRequestId = request.headers["x-request-id"];
    const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;
    if (requestId) {
      body.requestId = requestId;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url} 出错`, exception);
    }

    response.status(status).json(body);
  }
}
