# 项目上下文 — NomadMatch · 海外定居指南

## 项目概览

面向数字游民、自由职业者、独立开发者与普通用户的海外城市定居辅助决策网站（纯前端 SPA，界面为简体中文）。用户完成三模块测评（MBTI 20 题 + 生活偏好 8 题 + 兴趣 16 标签），系统对内置的 39 城加权打分，输出 MBTI 解读与 Top 5 城市报告，支持一键复制摘要。

## 技术栈

- **核心**: React 19, Vite 7, TypeScript 5（`moduleResolution: bundler`）
- **服务**: Express（仅承载 Vite 开发中间件与生产静态文件，无业务 API）
- **UI**: Tailwind CSS 3 + framer-motion 13（过渡动画）
- **图表**: 自绘 SVG（六维雷达图、维度条形图、世界海图）

## 目录结构

```
├── scripts/
│   ├── dev.sh / start.sh / build.sh / prepare.sh   # 生命周期脚本
│   └── try-engine.ts        # 匹配引擎离线验证脚本（pnpm tsx 运行）
├── server/
│   ├── routes/              # Express 路由（无业务接口）
│   ├── server.ts            # Express 入口
│   └── vite.ts              # Vite 中间件 / 生产静态服务
├── src/
│   ├── index.tsx            # React 客户端入口（注意是 .tsx）
│   ├── App.tsx              # 屏幕状态机：landing → quiz → report
│   ├── index.css            # Tailwind + 字体（fonts.googleapis.cn）+ 纸纹/组件类
│   ├── components/
│   │   ├── Landing.tsx      # 首页：Hero/痛点/流程/深色城市带/CTA
│   │   ├── Quiz.tsx         # 测评：分页/进度条/回退/三类题型
│   │   ├── Report.tsx       # 报告：人格解读/Top5 卡片/复制/免责声明
│   │   ├── RadarChart.tsx   # 六维雷达图
│   │   ├── RouteChart.tsx   # 世界航线图（内含城市经纬度）
│   │   └── CompassMark.tsx  # 罗盘花品牌符号
│   ├── lib/
│   │   └── engine.ts        # MBTI 判定 + 加权匹配引擎 + 格式化工具
│   └── data/
│       ├── types.ts         # City / ClimateType 等类型
│       ├── index.ts         # 合并四个区域 JSON
│       ├── questions.ts     # 20 MBTI 情境题 + 8 生活偏好题
│       ├── interests.ts     # 16 个兴趣标签池（与城市 tags 同 id）
│       ├── mbtiProfiles.ts  # 16 型人格游民视角解读
│       └── cities/          # europe/americas/africa/asia.json（共 39 城）
├── index.html
├── tailwind.config.js       # 纸/墨/陶土配色与字体 token
├── tsconfig.json
└── vite.config.ts
```

## 构建与测试命令

- 开发：`pnpm run dev`（Express + Vite，端口取 `${DEPLOY_RUN_PORT}`，HMR 路径 `/hot/vite-hmr`）
- 生产构建：`pnpm run build`（`vite build` + `tsup` 打包 server）
- 生产启动：`pnpm run start`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint --quiet`
- 引擎验证：`pnpm tsx scripts/try-engine.ts`

## 匹配引擎说明

- 权重：人格特质契合 30% + 生活偏好 48% + 兴趣重合 22%。
- 人格：20 题累计得出四轴向量（E/I、S/N、T/F、J/P，-100..100），与城市 `traits` 向量算距离相似度。
- 偏好：预算（与城市成本区间惩罚函数）、气候兼容表、节奏/规模/社交/英语/签证/网络均为 1-5 序数距离打分。
- 兴趣：精度（user 视角，70% 权重）+ 召回（city 视角，30% 权重）。
- 原始分校准：`match = 52 + raw * 0.46`，输出 Top 5 及分维度分数。

## 设计规范

见 `DESIGN.md`。核心：「现代航海图志」——亚麻纸底、松墨、陶土强调、Fraunces/Noto Serif SC 衬线、制图符号语言；禁止科技蓝渐变与模板化 SaaS 布局。

## 包管理规范

**仅允许使用 pnpm**，严禁 npm / yarn。
- 安装依赖：`pnpm add <pkg>`；开发依赖：`pnpm add -D <pkg>`。
- 注意：`@vitejs/plugin-react` 锁定 v5（v6 与 Vite 7 存在 `./internal` 导出不兼容问题）。

## 编码规范

- TypeScript `strict` + `react-jsx`；含 JSX 的文件必须使用 `.tsx` 扩展名。
- 禁止隐式 `any` / `as any`；函数参数、返回值、事件对象、Express `req`/`res`、`catch` 错误需有明确类型或完成收窄。
- 及时清理未使用的变量与导入。
