# 微信云托管用。一个镜像两个入口：
#   web    → node dist/main.js    （HTTP 服务，默认）
#   worker → node dist/worker.js  （定时与延时任务）
# 在云托管里把 worker 部署成第二个服务，启动命令改成 node dist/worker.js、APP_ROLE=worker 即可。
#
# 构建要在仓库根执行，因为要用到 pnpm workspace 和 packages/shared：
#   docker build -f apps/server/Dockerfile -t yiqi-server .

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
