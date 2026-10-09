#!/bin/bash
set -Eeuo pipefail

WORKSPACE_PATH="${WORKSPACE_PATH:-$(pwd)}"
cd "${WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline

echo "Building frontend with Vite..."
pnpm vite build

echo "Generating SEO landing pages (240 cities + 65 countries + indexes + methodology + robots/llms/sitemap + 404)..."
pnpm tsx scripts/generate-landing.mjs

echo "Bundling server with tsup..."
# --shims 修复：plugin-react 等 ESM 依赖被内联进 CJS bundle 后，import.meta.url 会变成 undefined，
# 模块初始化即抛 ERR_INVALID_ARG_TYPE。--shims 让 tsup 在 CJS 输出中把 import.meta.url
# 替换为 pathToFileURL(__filename).href（该路径仅 dev 的 react-refresh 使用，prod 只计算不消费）。
pnpm tsup server/server.ts --format cjs --platform node --target node20 --outDir dist-server --no-splitting --no-minify --external vite --shims

echo "Build completed successfully!"
