-- 接口测试专用库（pnpm test:e2e）。和开发库 yiqibuge 分开，测试会清表，不能碰开发数据。
-- 这个脚本只在 MySQL 容器第一次建数据卷时自动跑；已有的容器跑一次 pnpm dev:db:test-init。
CREATE DATABASE IF NOT EXISTS yiqibuge_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON yiqibuge_test.* TO 'yiqi'@'%';
FLUSH PRIVILEGES;
