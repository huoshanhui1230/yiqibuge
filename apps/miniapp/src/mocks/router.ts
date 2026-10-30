import type { HttpMethod } from "../request/types";

/** 一条假接口：路径里的 :参数、查询参数、请求体 */
export interface MockRequest {
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
}

type Handler = (request: MockRequest) => unknown;

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

/** 很小的路由：「GET /circles/:id/members」这样写，按顺序匹配第一条 */
export class MockRouter {
  private readonly routes: Route[] = [];

  on(method: HttpMethod, path: string, handler: Handler): this {
    const keys: string[] = [];
    const pattern = new RegExp(
      `^${path.replace(/:(\w+)/g, (_, key: string) => {
        keys.push(key);
        return "([^/]+)";
      })}$`,
    );
    this.routes.push({ method, pattern, keys, handler });
    return this;
  }

  /** 找不到返回 undefined */
  match(method: HttpMethod, url: string, body: unknown): (() => unknown) | undefined {
    const [path = "", search = ""] = url.split("?");
    const query = Object.fromEntries(
      search
        .split("&")
        .filter(Boolean)
        .map((pair) => {
          const [key = "", value = ""] = pair.split("=");
          return [decodeURIComponent(key), decodeURIComponent(value)];
        }),
    );

    for (const route of this.routes) {
      const found = route.method === method ? route.pattern.exec(path) : null;
      if (!found) continue;

      const params = Object.fromEntries(
        route.keys.map((key, index) => [key, decodeURIComponent(found[index + 1] ?? "")]),
      );
      return () => route.handler({ params, query, body: (body ?? {}) as Record<string, unknown> });
    }

    return undefined;
  }
}
