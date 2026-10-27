import { defineConfig } from "drizzle-kit";

import { loadEnvFiles } from "./src/config/load-env";

loadEnvFiles();

// 迁移 SQL 入库、要能 code review，所以只用 generate + migrate，不用 push。
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
