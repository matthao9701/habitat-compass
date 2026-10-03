#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
bash "$COZE_WORKSPACE_PATH/scripts/prepare-node-modules.sh" --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building frontend with Vite..."
pnpm vite build

echo "Generating SEO landing pages (200 cities + 65 countries + indexes + methodology + robots/llms/sitemap)..."
node scripts/generate-landing.mjs

echo "Bundling server with tsup..."
# --shims 修复：plugin-react 等 ESM 依赖被内联进 CJS bundle 后，import.meta.url 会变成 undefined，
# 模块初始化即抛 ERR_INVALID_ARG_TYPE。--shims 让 tsup 在 CJS 输出中把 import.meta.url
# 替换为 pathToFileURL(__filename).href（该路径仅 dev 的 react-refresh 使用，prod 只计算不消费）。
pnpm tsup server/server.ts --format cjs --platform node --target node20 --outDir dist-server --no-splitting --no-minify --external vite --shims

echo "Build completed successfully!"
