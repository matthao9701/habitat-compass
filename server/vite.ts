// ABOUTME: Vite integration for Express server
// ABOUTME: Handles dev middleware and production static file serving

import type { Application, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import viteConfig from '../vite.config';

const isDev = process.env.COZE_PROJECT_ENV !== 'PROD';

// 预渲染法律页在 dev 模式的可达性：
// generate-landing.mjs 会把 privacy/terms/disclaimer（zh/en）同步写入 public/，
// 但 Vite dev 的 public 中间件不会命中子目录 index.html（/terms/ 会落入 SPA fallback 返回主应用壳）。
// 这里在 vite.middlewares 之前显式命中这些静态文件，保证 /privacy /terms /disclaimer 及 /en/ 前缀在 dev 直达。
const LEGAL_ROUTE_RE = /^\/(en\/)?(privacy|terms|disclaimer)\/?$/;

export function legalStaticMiddleware(app: Application) {
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.method === 'GET' && LEGAL_ROUTE_RE.test(req.path)) {
      const rel = `${req.path.replace(/\/$/, '')}/index.html`;
      const file = path.join(publicDir, rel);
      if (fs.existsSync(file)) {
        res.sendFile(file);
        return;
      }
    }
    next();
  });
}

/**
 * 集成 Vite 开发服务器（中间件模式）
 */
export async function setupViteMiddleware(app: Application) {
  const vite = await createViteServer({
    ...viteConfig,
    // inline config 已包含 vite.config 的全部内容（含 plugins），
    // 必须禁用 configFile，避免 Vite 再次加载 vite.config.ts 并合并出两份 react() 插件，
    // 导致 react-refresh 代码被重复注入（Duplicate declaration）而使所有组件模块 500。
    configFile: false,
    server: {
      ...viteConfig.server,
      middlewareMode: true,
    },
    appType: 'spa',
  });

  // 法律页静态命中（dev 模式 public 子目录 index.html 不被 vite 命中，见 legalStaticMiddleware 注释）
  legalStaticMiddleware(app);

  // 使用 Vite middleware
  app.use(vite.middlewares);

  console.log('🚀 Vite dev server initialized');
}

/**
 * 设置生产环境静态文件服务
 */
export function setupStaticServer(app: Application) {
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist folder not found. Please run "pnpm build" first.');
    process.exit(1);
  }

  // 1. 服务静态文件（如果存在对应文件则直接返回）
  app.use(express.static(distPath));

  // 2. SPA fallback - 所有未处理的请求返回 index.html
  // 到达这里的请求说明：
  //   - 不是 API 请求（已被前面注册的路由处理）
  //   - 不是静态文件（express.static 未找到对应文件）
  //   - 需要返回 index.html 让前端路由处理
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  console.log('📦 Serving static files from dist/');
}

/**
 * 根据环境设置 Vite
 */
export async function setupVite(app: Application) {
  if (isDev) {
    await setupViteMiddleware(app);
  } else {
    setupStaticServer(app);
  }
}
