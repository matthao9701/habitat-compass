# 栖居罗盘 Habitat Compass

这是一个面向数字游民与远程工作者的海外城市定居决策工具，基于 React + Vite + TypeScript + Tailwind CSS，附带一个可选的 Express 静态/SSR 服务端。

**核心特性：**
- 🚀 前端：React 19 + Vite 7 + TypeScript + Tailwind CSS
- 🔧 后端（可选）：Express，本地开发时为 Vite 提供中间件；生产部署为纯静态资源
- 🔥 开发模式：Vite HMR + Express，单进程启动
- 📦 生产模式：静态构建产物 `dist/`（含 543 个 SEO 落地页），可直接部署到任意静态托管

## 快速开始

### 启动开发服务器

```bash
pnpm run dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

开发服务器支持热更新（HMR），修改代码后页面会自动刷新。

### 构建生产版本

```bash
pnpm run build
```

构建产物位于 `dist/` 目录，可直接部署到静态托管服务。

### 预览生产版本

```bash
pnpm run start
```

在本地启动一个服务器，预览生产构建的效果。

## 部署到 Cloudflare

本项目为**纯前端静态应用**（无任何后端 API 调用，数据全部存于浏览器 localStorage），
因此以 Cloudflare 静态资源模式部署，`dist/`（Vite 主应用 + 544 个 SEO 落地页 + 404 页）直接对外服务。

根目录的 `wrangler.jsonc` 是唯一必要的部署配置：

```jsonc
{
  "name": "habitat-compass",
  "compatibility_date": "2025-10-01",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

> 主应用无客户端 URL 路由，故用 `404-page`（未匹配路径返回真正的 HTTP 404），
> 而非 `single-page-application`（会把任意路径都当 200 → 软 404，损害 SEO）。

> ⚠️ **必须提交 `wrangler.jsonc`**：否则 `wrangler deploy` 会进入交互式脚手架，
> 向 `vite.config.ts` 注入 ESM-only 的 `@cloudflare/vite-plugin`，在无 `"type":"module"`
> 的 CommonJS 上下文中 `require` 失败并崩溃。

**Cloudflare Workers Builds（Connect Git）部署配置：**

| 字段 | 值 |
| --- | --- |
| 构建命令 | `pnpm run build:cf` |
| 部署命令 | `npx wrangler deploy` |
| 预览命令 | `npx wrangler preview` |
| 环境变量 `NODE_VERSION` | `24`（Vite 7 要求 Node ≥ 20.19 / 22.12） |
| 环境变量 `SITE_URL` | `https://<你的域名>`（canonical/sitemap/hreflang 用，可省略） |

> 注意：此处**不要**用 `pnpm run build`（它会额外打包一个用不上的 Express 后端）。
> 用 `pnpm run build:cf`。

若在 Cloudflare **Pages** 上部署，则对应填写：Build command `pnpm run build:cf`、
Build output directory `dist`。本地直连 Workers 则执行 `pnpm build:cf && pnpm deploy:cf`
（需设置 `CLOUDFLARE_API_TOKEN`）。

`pnpm build:cf` 等价于 `vite build && tsx scripts/generate-landing.mjs`。

> **sitemap `lastmod` 与浅克隆**：`scripts/generate-landing.mjs` 优先用 `git log` 取每个
> 数据文件的真实最后提交日期作为 `<lastmod>`。Cloudflare 构建默认 `--depth 1` 浅克隆、
> 无 git 历史，此时会回落到已提交的 `scripts/content-dates.json` 清单（由具备完整历史的
> 构建自动生成并提交），因此线上 `lastmod` 仍为真实内容日而非构建日。若希望 CI 直接从
> git 读取，可在 Cloudflare 构建环境变量中设置 `GIT_CLONE_DEPTH=0`（不完全克隆）；两条路径
> 结果一致。修改「数据文件」或生成脚本后，务必在本地跑一次 `pnpm build:cf` 让清单随之更新并提交。

> **必须设置 `NODE_VERSION=24`**：`generate-landing` 用 `tsx` 直接复用 `src/i18n` 的 TS 英译表，
> 需要 Node ≥ 22。Vite 7 本身也要求 Node ≥ 20.19 / 22.12。

## 项目结构

```
├── server/                # 后端服务器目录
│   ├── index.ts          # express 服务器入口
│   ├── routes/           # API 路由目录
│   │   └── index.ts      # 路由定义
│   └── vite.ts           # Vite 集成逻辑
├── src/                   # 前端源码目录
│   ├── index.ts          # 前端应用入口（初始化）
│   ├── main.ts           # 前端主逻辑文件
│   └── index.css         # 全局样式（包含 Tailwind 指令）
├── index.html            # HTML 入口文件
├── vite.config.ts        # Vite 配置
├── tailwind.config.ts    # Tailwind CSS 配置
└── tsconfig.json         # TypeScript 配置
```

**目录说明：**

- **`server/`** - 后端服务器代码
  - `server.ts` - 服务器主入口，负责创建和启动 Express 应用
  - `routes/` - API 路由模块，支持按功能拆分路由
  - `vite.ts` - Vite 开发服务器和静态文件服务集成

- **`src/`** - 前端应用代码
  - 所有前端相关代码都在这里

**工作原理：**

- **开发模式** (`pnpm run dev`)：
  - 运行 `server/server.ts` 启动 Express 服务器
  - Vite 以 middleware 模式集成到 Express
  - 前端支持 HMR（热模块替换）
  - 后端和前端在同一进程，端口 5000

- **生产模式** (`pnpm run start`)：
  - `pnpm run build` 构建前端 → `dist/` 目录
  - `pnpm run build` 构建服务端 → `dist-server/server.js` (CommonJS 格式)
  - 运行 `dist-server/server.js` 启动生产服务器
  - Express 服务静态文件
  - 单一 Node.js 进程，轻量高效；也可仅部署 `dist/` 到纯静态托管

## 核心开发规范

### 1. 后端 API 开发

**添加新的 API 路由**

在 `server/routes/index.ts` 中添加路由：

```typescript
// GET 请求示例
router.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  });
});

// POST 请求示例
router.post('/api/users', (req, res) => {
  const userData = req.body;
  // 处理业务逻辑
  res.json({
    success: true,
    user: userData,
  });
});

// 动态路由参数
router.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    id: userId,
    name: 'User ' + userId,
  });
});
```

**拆分路由模块**（推荐）

当路由变多时，可以按功能拆分：

```typescript
// server/routes/users.ts
import { Router } from 'express';

const router = Router();

router.get('/api/users', (req, res) => {
  // 用户列表逻辑
  res.json({ users: [] });
});

router.post('/api/users', (req, res) => {
  // 创建用户逻辑
  res.json({ success: true });
});

export default router;
```

然后在 `server/server.ts` 中注册：

```typescript
import usersRouter from './routes/users';

// 注册路由
app.use(usersRouter);
```

**前端调用 API**

```typescript
// GET 请求
async function getUsers() {
  const response = await fetch('/api/users');
  const data = await response.json();
  console.log(data);
}

// POST 请求
async function createUser(name: string) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const data = await response.json();
  console.log(data);
}
```

**API 最佳实践**

- ✅ 所有 API 路由以 `/api` 开头，避免与前端路由冲突
- ✅ 使用 RESTful 设计：GET 查询、POST 创建、PUT 更新、DELETE 删除
- ✅ 返回统一的响应格式：`{ success: boolean, data?: any, error?: string }`
- ✅ 添加错误处理和参数验证

### 2. 样式开发

**使用 Tailwind CSS**

本项目使用 Tailwind CSS 进行样式开发，支持亮色/暗色模式自动切换。

```typescript
// 使用 Tailwind 工具类
app.innerHTML = `
  <div class="flex items-center justify-center min-h-screen bg-white dark:bg-black">
    <h1 class="text-4xl font-bold text-black dark:text-white">
      Hello World
    </h1>
  </div>
`;
```

**主题变量**

主题变量定义在 `src/index.css` 中，支持自动适配系统主题：

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**常用 Tailwind 类名**

- 布局：`flex`, `grid`, `container`, `mx-auto`
- 间距：`p-4`, `m-4`, `gap-4`, `space-x-4`
- 颜色：`bg-white`, `text-black`, `dark:bg-black`, `dark:text-white`
- 排版：`text-lg`, `font-bold`, `leading-8`, `tracking-tight`
- 响应式：`sm:`, `md:`, `lg:`, `xl:`

### 2. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# ✅ 安装依赖
pnpm install

# ✅ 添加新依赖
pnpm add package-name

# ✅ 添加开发依赖
pnpm add -D package-name

# ❌ 禁止使用 npm 或 yarn
# npm install  # 错误！
# yarn add     # 错误！
```

项目已配置 `preinstall` 脚本，使用其他包管理器会报错。

### 3. TypeScript 开发

**类型安全**

充分利用 TypeScript 的类型系统，确保代码质量：

```typescript
// 定义接口
interface User {
  id: number;
  name: string;
  email: string;
}

// 使用类型
function createUser(data: User): void {
  console.log(`Creating user: ${data.name}`);
}

// DOM 操作类型推断
const button = document.querySelector<HTMLButtonElement>('#my-button');
if (button) {
  button.addEventListener('click', () => {
    console.log('Button clicked');
  });
}
```

**避免 any 类型**

尽量避免使用 `any`，使用 `unknown` 或具体类型：

```typescript
// ❌ 不推荐
function process(data: any) { }

// ✅ 推荐
function process(data: unknown) {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}
```

## 常见开发场景

### 添加新页面

本项目是单页应用（SPA），如需多页面：

1. 在 `src/` 下创建新的 `.ts` 文件
2. 在 `vite.config.ts` 中配置多入口
3. 创建对应的 `.html` 文件

### DOM 操作

```typescript
// 获取元素
const app = document.getElementById('app');
const button = document.querySelector<HTMLButtonElement>('.my-button');

// 动态创建元素
const div = document.createElement('div');
div.className = 'flex items-center gap-4';
div.textContent = 'Hello World';
app?.appendChild(div);

// 事件监听
button?.addEventListener('click', (e) => {
  console.log('Clicked', e);
});
```

### 数据获取

```typescript
// Fetch API
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

// 使用数据
fetchData().then(data => {
  console.log(data);
});
```

### 环境变量

在 `.env` 文件中定义环境变量（需以 `VITE_` 开头）：

```bash
VITE_API_URL=https://api.example.com
```

在代码中使用：

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
console.log(apiUrl); // https://api.example.com
```

## 技术栈

**前端：**
- **构建工具**: Vite 7.x
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 3.x

**后端：**
- **框架**: Express 4.x
- **内置中间件**: express.json(), express.urlencoded(), express.static()

**工具：**
- **包管理器**: pnpm 9+
- **运行时**: Node.js 18+
- **开发工具**: tsx (TypeScript 执行器)

## 参考文档

**前端：**
- [Vite 官方文档](https://cn.vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/zh/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

**后端：**
- [Express 官方文档](https://expressjs.com/)
- [Express 中文文档](https://expressjs.com/zh-cn/)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **使用 TypeScript** 进行类型安全开发，避免使用 `any`
3. **使用 Tailwind CSS** 进行样式开发，支持响应式和暗色模式
4. **环境变量必须以 `VITE_` 开头** 才能在客户端代码中访问
5. **开发时使用 `pnpm run dev`**，支持热更新和快速刷新
6. **API 路由以 `/api` 开头**，避免与前端路由冲突
7. **单进程架构**：开发和生产环境都是前后端在同一进程中运行

## 常见问题

**Q: 如何分离前后端端口？**

如果需要前后端分离部署，可以：
- 前端：使用 `npx vite` 单独启动（默认端口 5173）
- 后端：修改 `server.ts`，移除 Vite middleware，单独启动

**Q: 如何添加数据库？**

```bash
# 安装数据库客户端（以 PostgreSQL 为例）
pnpm add pg
pnpm add -D @types/pg

# 在 server.ts 中使用
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Q: 如何部署？**

1. 运行 `pnpm run build` 构建前后端
2. 将整个项目上传到服务器
3. 运行 `pnpm install --prod`
4. 运行 `pnpm run start` 启动服务
