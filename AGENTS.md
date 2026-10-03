# 项目上下文 — 栖居罗盘 · 海外定居指南

## 项目概览

面向数字游民、自由职业者、独立开发者与普通用户的海外城市定居辅助决策网站（纯前端 SPA，界面为简体中文，品牌名「栖居罗盘」）。三 Tab 架构（首页 / 城市对比 / 我的）：测评分**双版本**（第五轮）——简易版永久免费（MBTI 32 题七级量表 + 生活偏好 8 题情景选择 + 兴趣 16 标签，原样保留）、标准版一次性虚拟买断 ¥29.9（IPIP-NEO 120 题 Big Five + 20 道四题型偏好 + 28 兴趣标签二级细化，报告含五维剖面/30 facets/16 型映射卡/两版对比；购买流程 = 商品页 → 模拟支付弹窗 → localStorage 解锁 + 订单留痕，纯前端模拟无真实交易），系统对内置的 100 城加权打分，输出 16 型解读与 Top 5 城市报告，支持一键复制摘要；城市对比页支持临时权重重算（11 维）与最多 4 城对比，含大洲/次区域筛选；「我的」承载双版本测评记录、收藏城市、对比存档与标准版订单/重置入口。数据工程（第四轮）：100 城六洲覆盖 + GeoNames/Open-Meteo/Numbeo/EF EPI 真实数据管道，详见 `DATA.md`。硬约束过滤层 + 国家维度参考 + 待核实清单 + 轻量埋点（第六轮）：测评前「硬性条件」步骤（月预算上限 CNY/USD / 签证底线三档 / 安全阈值，一票否决跑在引擎打分前，不足 5 城时放宽为超上限差距 <15% 降权保留并标注超预算，全部带可解释排除原因）；国家级参考数据 65 国（World Bank/UNDP/TI/Numbeo/手工快照，**参考信息层不进引擎加权**）供报告页国家概况卡、对比页国家级行与城市详情弹层；报告页「搬家前待核实清单」+ 固定免责声明；纯前端 localStorage 漏斗埋点（无 PII），我的 Tab 底部数据概览折叠区。

## 技术栈

- **核心**: React 19, Vite 7, TypeScript 5（`moduleResolution: bundler`）
- **服务**: Express（仅承载 Vite 开发中间件与生产静态文件，无业务 API）
- **UI**: Tailwind CSS 3 + framer-motion 13（过渡动画）
- **字体**（第三轮起，全部 OFL 自托管，禁外部 CDN）：Noto Sans SC（display/heading/body，@fontsource/noto-sans-sc 300-900）、IBM Plex Mono（data/等宽数字）、Source Serif 4（英文点缀，仅 serif-accent）；tailwind fontFamily 层级 token：`display/heading/body/data/serif-accent`（兼容映射 sans/serif/mono）
- **图表**: 自绘 SVG（六维雷达图、维度条形图、世界海图）

## 目录结构

```
├── scripts/
│   ├── dev.sh / start.sh / build.sh / prepare.sh   # 生命周期脚本
│   ├── try-engine.ts        # 匹配引擎离线验证脚本（pnpm tsx 运行）
│   ├── verify-iter1.ts      # 演示档案类型断言 + 39 城优劣势覆盖（pnpm tsx 运行）
│   ├── verify-iter2.ts      # 对比链路冒烟：computeCityFits 一致性(含 null 语义)/临时权重重排/成本结论/份额合计 100
│   ├── verify-data-v2.ts    # 第四轮数据校验：100 城/六洲/必填/null 合法/签证结构化/气候一致性/引擎冒烟
│   └── pipeline/            # 数据管道（Node ESM，产物 → src/data/cities/*.json）
│       ├── selection.mjs    # 61 新城底座：手工清单 × GeoNames cities15000 匹配
│       ├── fetch-numbeo.mjs # Numbeo rankings 两表 + 逐城详情（限速 3.2s + 429 退避，--details 增量）
│       ├── fetch-climate.mjs# Open-Meteo archive 2015-2024 十年均值（增量重跑；argv[2] 可传旧城底座文件）
│       ├── fetch-efepi.mjs  # EF EPI 国家评级提取
│       └── assemble.mjs     # 装配 100 城：39 旧城富化 + 新城派生 + 成本线性拟合 + americas 拆分 → 6 大洲 JSON
│       └── fetch-country.mjs# 第六轮国家级管道：65 国 = World Bank 全表+逐国 GDP/POP + Numbeo country 表解析 + MANUAL 手工快照（GPI/网速源站不可达硬编码 null）→ src/data/countries.json
├── server/
│   ├── routes/              # Express 路由（无业务接口）
│   ├── server.ts            # Express 入口
│   └── vite.ts              # Vite 中间件 / 生产静态服务
├── src/
│   ├── index.tsx            # React 客户端入口（注意是 .tsx）
│   ├── App.tsx              # 屏幕状态机：landing→quiz→report + compare/profile（TAB_SCREENS 三 Tab）
│   ├── index.css            # Tailwind + 纸纹/组件类（字体在 index.tsx 经 @fontsource 自托管导入）
│   ├── components/
│   │   ├── TabBar.tsx       # 顶部三 Tab 导航（首页/城市对比/我的，纯几何 SVG 图标）
│   │   ├── Landing.tsx      # 首页：Hero/演示档案/痛点/流程/城市图集（大洲浏览）/深色城市带/CTA
│   │   ├── Quiz.tsx         # 测评：分页/进度条/回退/三类题型/草稿 localStorage 恢复与清空；第六轮：ConstraintsStep 前置步骤（stage constraints→quiz）+ 阶段埋点 trackStage
│   │   ├── Report.tsx       # 报告：人格解读/权重环图/Top5 卡片/徽标/复制/数据口径脚注/许可署名
│   │   ├── ProfileScreen.tsx# 我的：最近测评入口/收藏城市网格/对比存档列表（载入/删除）
│   │   ├── compare/         # 对比页模块：CompareScreen（选城含大洲/次区域筛选/11 维权重滑杆/排名/存档）、CompareCharts（多城雷达/逐维条形/语义色数值表，null→'—'，含 CityDetailModal 城市详情弹层：城市卡+国家基本信息区）、CompareDataCards（成本卡+公开数据表+国家级对比行（同国合并），仅真实字段）
│   │   ├── report/          # 报告增强模块：WeightDonut/BreakdownSection（11 维）/CityAnalysisSection/TrialSection/SemBar（语义色数据条，支持 null 值显示 '—'）/BigFiveSection（第五轮：五维雷达+30 facets 条+映射卡+两版对比）/ConstraintsNotice（硬约束排除说明可展开）/CountryCards（国家概况卡）/VerificationChecklist（待核实清单+免责声明）
│   │   ├── billing/         # 第五轮虚拟计费：ProIntro（商品介绍页：对比表/题库结构/解锁 CTA，未购可预览）、PayModal（渠道选择+2s 模拟动画+成功态，顶部注明演示环境）
│   │   ├── Quiz.tsx         # 测评（双版本）：version 分支——lite 原 56 题流程不动；pro = IPIP 120（5 点量表，6 题/页）+ 20 道四题型混编（choice/forced/slider/rank）+ 28 兴趣标签（含二级展开）；草稿按版本分键
│   │   ├── RadarChart.tsx   # 六维雷达图（原生多序列 series: RadarSeries[]，对比页复用；缺维城自动剔除）
│   │   ├── RouteChart.tsx   # 世界航线图（内含城市经纬度）
│   │   └── CompassMark.tsx  # 罗盘花品牌符号
│   ├── lib/
│   │   ├── engine.ts        # MBTI 判定 + 加权匹配引擎 v2（PREFERENCE_WEIGHTS 11 维唯一事实源：用户 8 维 0.86 + 客观 3 维 0.14；computeCityFits 单城 8 维原始 fit；类/维 null 降权不惩罚）；第五轮新增 derivePersonalityPro（IPIP 计分→Big Five→16 型映射，McCrae & Costa 1989）/derivePreferenceOrdinals（pro 偏好聚合）/buildProfileTags 子项强化（选子项的一级标签计双倍权重）
│   │   ├── analysis.ts      # 报告增强规则层 v2：11 维偏好细分/优劣势（含医疗/日照/降水/签证待核实）/人格×城市/试住计划（全部 null 安全）
│   │   ├── storage.ts       # localStorage 层（nomadmatch.v1: 前缀）：draft/history/favorites/compare/archives；第五轮计费键：proUnlocked/orders/proDraft/proHistory（PRO_PRICE_CNY=29.9 常量；resetBilling 供演示重置）；第六轮：loadHardConstraints/saveHardConstraints（键 hardConstraints）
│   │   ├── constraints.ts   # 第六轮硬约束过滤层（打分前一票否决，双版通用）：CNY_USD_RATE=7.2/OVER_BUDGET_BAND=0.15/RELAX_MIN_KEEP=5/OVER_BUDGET_PENALTY=3；applyHardConstraints 两阶段（先预算→再签证/安全，放宽回填者仍需过签证/安全）；applyOverBudgetPenalty（match-3+overBudget 标注）；null 数据=无法核验排除，reason 可解释
│   │   ├── telemetry.ts     # 第六轮轻量埋点：FUNNEL_KEY 'nomadmatch.v1:funnel'，track/getFunnel/trackStage（阶段键 stage_start_N_name），纯 localStorage 计数无 PII，node 守卫降级
│   │   └── compare.ts       # 对比页计算层 v2：临时权重重算（null 维/类跳过，与引擎同口径）、rankRows、compareCost（双缺→'暂无数据'）、NEUTRAL_ANSWERS、weightShare 最大余数法
│   └── data/
│       ├── types.ts         # City v2：continent/subregion/population/timezone/climateDetail/六指数/rent1brUSD/mealUSD/visaStatus 三档/visaDetail/englishEpiBand；大量字段可空；第六轮：City.countryCode（ISO2）+ Country 接口（17 字段+cityCount/updatedAt/sources 逐字段来源）
│       ├── index.ts         # 合并六大洲 JSON（europe/asia/africa/north-america/south-america/oceania）
│       ├── regions.ts       # 大洲/次区域 key 顺序与中文标签（REGION_LABEL/SUBREGION_LABEL）
│       ├── questions.ts     # 32 MBTI 七级双极题（OEJTS 1.2 结构）+ 8 生活偏好情景题
│       ├── questionsPro.ts  # 第五轮标准版：IPIP-NEO 120 中文题（30 facets×4，keyed ±1，ref 附英文原句；IPIP 公有领域，见 DATA.md 第六节）+ 20 道四题型偏好题（UserDimKey 6 维 + choice slot 直写 budget/climate）
│       ├── demoProfiles.ts  # 3 个演示档案预设答案（INTJ/ENTP/ESFJ，经 verify-iter1 校验）
│       ├── interests.ts     # 简易版 16 个兴趣标签池（与城市 tags 同 id）
│       ├── interestsPro.ts  # 第五轮标准版：28 个一级标签（16 共用 + 12 新增，城市库已同步标注）+ interestSubs 二级细化（每类 3-5 子项）+ reinforcedTags
│       ├── countries.json   # 第六轮国家级参考数据（65 国，fetch-country.mjs 产物勿手改；逐字段 sources 标注；TW 仅手工快照）
│       ├── countries.ts     # COUNTRIES/BY_CODE/getCountry(code)/countriesUpdatedAt()；getCountry 对 null/未知码返回 null
│       ├── mbtiProfiles.ts  # 16 型人格游民视角解读
│       └── cities/          # europe/asia/africa/north-america/south-america/oceania.json（共 100 城，assemble.mjs 产出勿手改）
├── DATA.md                  # 数据源/许可/派生规则/缺失约定/再生成流程
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
- 迭代验证：`pnpm tsx scripts/verify-iter1.ts`、`pnpm tsx scripts/verify-iter2.ts`
- 数据校验（第四轮）：`pnpm tsx scripts/verify-data-v2.ts`（依赖 /tmp/pipeline/climate.json 与 new-ids.txt，全量重跑见 DATA.md）
- 题库校验（第五轮）：`pnpm tsx scripts/verify-quiz-v2.ts`（IPIP 120 完整性/计分键方向/Big Five→16 型映射回归/四题型覆盖/兴趣子项强化）
- 第六轮校验：`pnpm tsx scripts/verify-country-v3.ts`（国家数据完整性/逐字段来源标注/GPI 网速全 null 预期/硬约束单测：预算排除与 5 城放宽/签证三档/安全阈值/null 无法核验/两阶段过滤/埋点计数/引擎集成冒烟）

## 匹配引擎说明

- 权重：人格特质契合 30% + 生活偏好 48% + 兴趣重合 22%（三大类不变）；偏好 48% 内部 11 维——用户 8 维（budget .18/climate .12/pace .10/size .09/social .10/language .09/visa .09/remote .09 = 0.86）+ 客观 3 维（climateComfort .05/safety .05/englishDepth .04 = 0.14，客观维度数据来自城市库非用户作答）。
- 人格：32 道七级双极量表题（1=完全左、4=中立、7=完全右，OEJTS 1.2 结构、CC BY-NC-SA 4.0）按轴求和（8~56）换算偏好百分比，累计得出四轴向量（E/I、S/N、T/F、J/P，-100..100），与城市 `traits` 向量算距离相似度；恰好中立时归入正向字母（E/N/F/P）。城市 traits 为 null 时人格类整体 null（如 61 座新城）。
- 偏好：预算（与城市成本区间惩罚函数）、气候兼容表、节奏/规模/社交/英语/签证/网络均为 1-5 序数距离打分；客观三维——气候舒适度（19°C 最优锚 + 日照加分 + 降水惩罚）、安全（Numbeo Safety 原值截断 5-100）、英语深度（EF EPI band→95/85/72/55/40，fallback english×20）。
- 兴趣：精度（user 视角，70% 权重）+ 召回（city 视角，30% 权重）；城市 tags 为空数组时兴趣类 null。
- **降权不惩罚（v2 核心）**：任何维度/大类数据缺失（null）时从对应加权的分子与分母中同时剔除，其余维度权重相对放大；极端情况下 raw = classNum/classDen 仍归一化。
- 原始分校准：`match = round(clamp(52 + raw * 0.46, 0, 99))`，输出 Top 5 及分维度分数（可空）。
- `computeCityFits(city, answers)`：导出的单城 8 维偏好原始 fit（未取整，客观 3 维不在此内）。assess 内部消费它；对比页用它做临时权重重算——两处共用保证一致性（verify-iter2 校验含 null 语义）。

## 数据工程（第四轮）

- 100 城 = 39 旧城 + 61 新城；分布：欧洲 33 / 亚洲 30 / 非洲 10 / 北美 11 / 南美 9 / 大洋洲 7。
- 来源与许可（详见 `DATA.md`）：GeoNames cities15000（CC BY 4.0）、Open-Meteo Historical（CC BY 4.0，2015-2024 十年均值）、Numbeo 公开指数（NYC=100 口径）、EF EPI；签证沿用旧城人工快照，新城 null 待核实。
- 派生规则：新城月成本 = 39 城最小二乘拟合（costIndex→monthlyCostUSD，≈39.9x−135.5）±15/20% 区间；english 由 EPI band 映射；size 由人口分档；climateDetail 简评为确定性规则（非 LLM）。
- `src/data/cities/*.json` 是 assemble.mjs 的产物——**禁止手改**；改数据先改管道脚本或 selection 清单再重跑。
- 大洲/次区域中文标签在 `src/data/regions.ts`；新增城市的展示名次区域缺失时 UI 显示「—」。

## 城市对比页说明

- **临时权重**：11 维滑杆（0-5，step 0.1）只在对比页生效，不回写引擎与报告。默认值 = `PREFERENCE_WEIGHTS×10`（份额与引擎一致）；无测评结果时均分 = 1。重算：`prefWeighted = Σ(fit·w)/Σw`（null 维与 0 权重维剔除），`raw` 类聚合与引擎同口径跳过 null 类，`composite = round(clamp(52 + raw·0.46, 0, 99))`。客观 3 维带「客观」小徽标。
- **选城**：上限 4 城（COMPARE_CITY_LIMIT），满员添加走替换弹窗；每城固定一色（COMPARE_COLORS：pine/clay/ochre/teal）；选城、权重、备注、整组结论持久化到 `compare` 键，「保存对比结果」进 `archives`（最多 12 条）。候选区含大洲/次区域级联筛选（regionFilter→subFilter），query 与筛选器任一生效即显示。
- **中性模式**：无测评结果时用 NEUTRAL_ANSWERS（MBTI 全 4、lifestyle 中性值、兴趣空）作为对比基准，页面需注明「未计入你的测评」；此模式只可搜索添加，无推荐区。
- **数据表**：仅列数据库真实字段，null 显示「—」；新城大量字段为 null 属预期——严禁编造城市数据补位。
- **雷达图**：六轴（成本/网络/安全/社区/英语/签证），任一轴缺数据的城自动从雷达序列剔除（仍参与条形与数值表）。
- **本地存储键**（storage.ts，前缀 `nomadmatch.v1:`）：draft（测验草稿，完成后清除）、history（最近一次测评）、favorites（收藏城市）、compare（对比现场）、archives（对比存档）。node 环境（tsx 脚本）无 localStorage，函数内部守卫安全降级。**注意：前缀为内部技术键名，品牌更名「栖居罗盘」时不改**（改了会丢失用户既有草稿/收藏/存档）。

## 设计规范

见 `DESIGN.md`。核心：「现代航海图志」——亚麻纸底、松墨、陶土强调、Fraunces/Noto Serif SC 衬线、制图符号语言；禁止科技蓝渐变与模板化 SaaS 布局。

## 包管理规范

**仅允许使用 pnpm**，严禁 npm / yarn。
- 安装依赖：`pnpm add <pkg>`；开发依赖：`pnpm add -D <pkg>`。
- 注意：`@vitejs/plugin-react` 锁定 v4.7（v6 与 Vite 7 存在 `./internal` 导出不兼容问题）。
- 重要：`server/vite.ts` 创建 Vite 中间件时必须带 `configFile: false`——inline config 已 spread 整个 `vite.config`（含 plugins），若不禁用，Vite 会再次加载配置文件并合并出两份 `react()` 插件，导致 react-refresh 重复注入、所有组件模块 500（页面白屏）。
- 重要：`scripts/build.sh` 中 tsup 打包 server 必须带 `--shims`——`vite.config.ts`（含 `@vitejs/plugin-react`）会被内联进 CJS bundle，ESM 代码里的 `import.meta.url` 在 CJS 输出中为 `undefined`，模块初始化即抛 `ERR_INVALID_ARG_TYPE`（部署崩溃、函数重启 3 次失败）。`--shims` 将其替换为 `pathToFileURL(__filename).href`；refresh-runtime 路径仅 dev 的 react-refresh 使用，prod 只计算不消费。
- 重要：Express 全局错误中间件必须恰好 4 个参数 `(err, req, res, next)`——Express 按 arity=4 识别 error handler，3 参数会被当普通中间件（`server/server.ts`）。

## 编码规范

- TypeScript `strict` + `react-jsx`；含 JSX 的文件必须使用 `.tsx` 扩展名。
- 禁止隐式 `any` / `as any`；函数参数、返回值、事件对象、Express `req`/`res`、`catch` 错误需有明确类型或完成收窄。
- 及时清理未使用的变量与导入。
