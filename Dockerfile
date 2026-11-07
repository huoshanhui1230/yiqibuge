# 后端（apps/server）的镜像。一个镜像两个入口：
#   web    → 先跑数据库迁移，再起 HTTP 服务（默认）
#   worker → node dist/worker.js（定时与延时任务，不跑迁移）
# 在云托管里把 worker 部署成第二个服务，启动命令改成 node dist/worker.js、APP_ROLE=worker 即可。
#
# 为什么放在仓库根而不是 apps/server/：
# 构建上下文必须是仓库根（下面 COPY . . 要用到 pnpm workspace、pnpm-lock.yaml 和 packages/shared），
# 而微信云托管要求 Dockerfile 和「目标目录」同级，没有 docker build -f 那种上下文与 Dockerfile 分离的选项。
# 云托管里「目标目录」留空、「Dockerfile 名称」填 Dockerfile 即可。
#
# 本地构建：
#   docker build -t yiqi-server .

FROM node:24-alpine AS build
# 云托管线上构建时官方建议换国内源；corepack 下载 pnpm 也走这里
ENV COREPACK_NPM_REGISTRY=https://mirrors.tencent.com/npm/
ENV npm_config_registry=https://mirrors.tencent.com/npm/
RUN corepack enable
WORKDIR /repo

COPY . .
# 只装后端和共用包的依赖，不装 uni-app 和 Playwright
RUN pnpm install --frozen-lockfile --filter "@yiqi/server..."
RUN pnpm -F @yiqi/shared build && pnpm -F @yiqi/server build
# deploy 会把 @yiqi/shared 的产物一起打进去，并剪掉 devDependencies
RUN pnpm --filter @yiqi/server deploy --prod /out

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV APP_ROLE=web
ENV PORT=3000
WORKDIR /app

COPY --from=build /out .

EXPOSE 3000
# 迁移失败容器就起不来，云托管不会切到这个版本（docs/decisions.md 第 27 条）。
# exec 让 node 成为 1 号进程，收得到停止信号。
CMD ["sh", "-c", "node dist/db/migrate.js && exec node dist/main.js"]
