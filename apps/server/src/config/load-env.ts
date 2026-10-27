import { config as loadDotenv } from "dotenv";

/**
 * 读 .env 文件，给不经过 NestJS 的脚本用（drizzle.config.ts、db/migrate.ts）。
 *
 * 仓库根的 .env 是唯一一份（和 docker compose 共用），apps/server/.env 只是本地临时覆盖，可以不存在。
 * 已经在 process.env 里的值不会被覆盖，方便 CI 直接注入。
 * 路径相对当前目录，命令都从 apps/server 跑（pnpm -F @yiqi/server ... 就是这个目录）。
 */
export function loadEnvFiles(): void {
  loadDotenv({ path: ["../../.env", ".env"], quiet: true });
}
