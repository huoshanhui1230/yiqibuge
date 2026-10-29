# 后端（apps/server）的镜像。一个镜像两个入口：
#   web    → node dist/main.js    （HTTP 服务，默认）
#   worker → node dist/worker.js  （定时与延时任务）
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
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
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
CMD ["node", "dist/main.js"]
