# 项目上下文 — 栖居罗盘 · 海外定居指南
       └── generate-landing.mjs # 第十二轮 SEO/GEO：构建后生成 536 落地页（200 城+65 国 zh/en）+ 索引/方法论页 + robots/llms.txt/sitemap.xml → dist/（express.static 自动命中；verify-seo-v9 校验）

## 项目概览

面向数字游民、自由职业者、独立开发者与普通用户的海外城市定居辅助决策网站（纯前端 SPA，界面为简体中文，品牌名「栖居罗盘」）。三 Tab 架构（首页 / 城市对比 / 我的）：测评分**双版本**（第五轮）——简易版永久免费（MBTI 32 题七级量表 + 生活偏好 8 题情景选择 + 兴趣 16 标签，原样保留）、标准版一次性虚拟买断 ¥29.9（IPIP-NEO 120 题 Big Five + 20 道四题型偏好 + 28 兴趣标签二级细化，报告含五维剖面/30 facets/16 型映射卡/两版对比；购买流程 = 商品页 → 模拟支付弹窗 → localStorage 解锁 + 订单留痕，纯前端模拟无真实交易），系统对内置的 100 城加权打分，输出 16 型解读与 Top 5 城市报告，支持一键复制摘要；城市对比页支持临时权重重算（11 维）与最多 4 城对比，含大洲/次区域筛选；「我的」承载双版本测评记录、收藏城市、对比存档与标准版订单/重置入口。数据工程（第四轮）：100 城六洲覆盖 + GeoNames/Open-Meteo 与公开统计测算数据管道，详见 `DATA.md`。硬约束过滤层 + 国家维度参考 + 待核实清单 + 轻量埋点（第六轮）：测评前「硬性条件」步骤（月预算上限 CNY/USD / 签证底线三档 / 安全阈值，一票否决跑在引擎打分前，不足 5 城时放宽为超上限差距 <15% 降权保留并标注超预算，全部带可解释排除原因）；国家级参考数据 65 国（World Bank/UNDP/TI/公开统计测算/手工快照，**参考信息层不进引擎加权**）供报告页国家概况卡、对比页国家级行与城市详情弹层；报告页「搬家前待核实清单」+ 固定免责声明；纯前端 localStorage 漏斗埋点（无 PII），我的 Tab 底部数据概览折叠区。

## 技术栈

- **核心**: React 19, Vite 7, TypeScript 5（`moduleResolution: bundler`）
- **服务**: Express（仅承载 Vite 开发中间件与生产静态文件，无业务 API）
- **UI**: Tailwind CSS 3 + framer-motion 13（过渡动画）
- **字体**（第十五轮改版，全部 OFL 自托管，禁外部 CDN）：Manrope（正文/UI/数字，@fontsource-variable/manrope 可变字体；含真 `tnum` 等宽数字特性）、Fraunces（display/heading 衬线标题）、Newsreader（serif-accent 英文点缀）；中文走系统黑体栈不自托管；tailwind fontFamily 层级 token：`display/heading/body/data/serif-accent`（兼容映射 sans/serif/mono，其中 `data`/`mono` 均指向 Manrope，数字靠 `tabular-nums` 对齐）
- **图表**: 自绘 SVG（六维雷达图、维度条形图、世界海图）
- **i18n（第七轮）**: 自研轻量双语（zh/en）——LangContext + useI18n + REVERSE_ZH 反查，六域词典自托管，无第三方 i18n 依赖

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
│       ├── fetch-cost.mjs      # 公开统计 rankings 两表 + 逐城详情（限速 3.2s + 429 退避，--details 增量）
│       ├── fetch-climate.mjs# Open-Meteo archive 2015-2024 十年均值（增量重跑；argv[2] 可传旧城底座文件）
│       ├── fetch-efepi.mjs  # 公开英语能力排名提取
│       └── assemble.mjs     # 装配 100 城：39 旧城富化 + 新城派生 + 成本线性拟合 + americas 拆分 → 6 大洲 JSON
│       └── fetch-country.mjs# 第六轮国家级管道：65 国 = World Bank 全表+逐国 GDP/POP + 公开统计国家表解析 + MANUAL 手工快照（GPI/网速源站不可达硬编码 null）→ src/data/countries.json
│       └── snapshot-gpispeed.mjs # 第七轮幂等快照回填：GPI（IEP 2024，163 国榜单手工快照，62/65，HK/PR/FJ 豁免显式 null）+ 网速（公开网速榜单固定宽带中位数下行，65/65）→ countries.json 的 gpi/internetMbpsFixed + sources 标注；详见 DATA.md 第八节
│       └── snapshot-passport.mjs   # 第九轮幂等快照回填：65 国 visaPassport（entry 四档+三维适用性+快照日期）+ longStay（税居天数/社保协定/押金惯例）→ countries.json + sources 标注；详见 DATA.md 第十节
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
│   │   ├── Quiz.tsx         # 测评（双版本）：version 分支——lite 原 56 题流程不动；pro = IPIP 120（5 点量表，6 题/页）+ 20 道四题型混编（choice/forced/slider/rank）+ 28 兴趣标签（含二级展开）；草稿按版本分键。第七轮 i18n：IPIPItem 题干 en 模式渲染 question.ref（IPIP 英文原句）、LifestyleItem title/hint/选项经 t() 走 REVERSE_ZH 反查
│   │   ├── LangSwitch.tsx   # 第七轮：顶部导航中/EN 切换（LangContext，localStorage 记忆优先 + navigator.language 兜底）
│   │   ├── RadarChart.tsx   # 六维雷达图（原生多序列 series: RadarSeries[]，对比页复用；缺维城自动剔除）
│   │   ├── RouteChart.tsx   # 世界航线图（内含城市经纬度）
│   │   └── CompassMark.tsx  # 罗盘花品牌符号
│   ├── lib/
│   │   ├── engine.ts        # MBTI 判定 + 加权匹配引擎 v2（PREFERENCE_WEIGHTS 11 维唯一事实源：用户 8 维 0.86 + 客观 3 维 0.14；computeCityFits 单城 8 维原始 fit；类/维 null 降权不惩罚）；第五轮新增 derivePersonalityPro（IPIP 计分→Big Five→16 型映射，McCrae & Costa 1989）/derivePreferenceOrdinals（pro 偏好聚合）/buildProfileTags 子项强化（选子项的一级标签计双倍权重）
│   │   ├── analysis.ts      # 报告增强规则层 v2：11 维偏好细分/优劣势（含医疗/日照/降水/签证待核实）/人格×城市/试住计划（全部 null 安全）
│   │   ├── storage.ts       # localStorage 层（nomadmatch.v1: 前缀）：draft/history/favorites/compare/archives；第五轮计费键：proUnlocked/orders/proDraft/proHistory（PRO_PRICE_CNY=29.9 常量；resetBilling 供演示重置）；第六轮：loadHardConstraints/saveHardConstraints（键 hardConstraints）
│   │   ├── constraints.ts   # 第六轮硬约束过滤层（打分前一票否决，双版通用）：CNY_USD_RATE=7.2/OVER_BUDGET_BAND=0.15/RELAX_MIN_KEEP=5/OVER_BUDGET_PENALTY=3；applyHardConstraints 两阶段（先预算→再签证/安全，放宽回填者仍需过签证/安全）；applyOverBudgetPenalty（match-3+overBudget 标注）；null 数据=无法核验排除，reason 可解释
│   │   ├── telemetry.ts     # 第六轮轻量埋点：FUNNEL_KEY 'nomadmatch.v1:funnel'，track/getFunnel/trackStage（阶段键 stage_start_N_name），纯 localStorage 计数无 PII，node 守卫降级
│   │   ├── compare.ts       # 对比页计算层 v2：临时权重重算（null 维/类跳过，与引擎同口径）、rankRows、compareCost（双缺→'暂无数据'）、NEUTRAL_ANSWERS、weightShare 最大余数法
│   │   └── riasec.ts        # 第八轮：deriveRiasec（六维 5-25→百分位→top2 组合）/tagRepeats（RIASEC 高分维 ≥60 给映射标签 +1 重复，与子项强化叠加封顶 2）/deriveRisk（风险 10 题 → 0-100 指数 + high/mid/low band，keyed 反向计分）
│   │   ├── format.ts        # 第七轮 i18n 展示层：cityName/countryName（按 lang 取 nameEn/nameZh，Country.nameEn 可空回退）、formatMoney（zh: ¥xxx（≈$usd）· en: $usd，CNY_USD_RATE=7.2）、formatDate（en-US/zh-CN locale）、cityById/cityNameById（ExcludedEntry 快照回退）
│   │   └── colors.ts        # 第七轮图表色常量（SVG 图表与 Tailwind token 解耦的 JS 侧取值）
│   ├── i18n/                # 第七轮双语基础设施（zh/en）
│   │   ├── index.tsx        # LangContext + useI18n(){ lang, setLang, t }；t() 插值 {var}；translate() 键查不到时走 REVERSE_ZH 反查（中文值→key），使规则层中文文案在展示层 {t(reason)} 自动双语；导出 translate/getCurrentLang/makeStaticT；Provider useEffect 同步 html lang / title / meta description / og:* 随语言切换；语言持久化键 nomadmatch.v1:lang
│   │   ├── title.ts         # TITLE_BY_LANG / DESCRIPTION_BY_LANG（SEO 双语文案）
│   │   └── dict/            # 六域词典（zh/en 各一套扁平 Record）：ui（全站 UI）/analysis（报告规则）/questions（题库：mbti.*/ls.*/pro.*）/interests（tag.*/sub.*/fac.*）/mbti（16 型）/extra（杂项）；index.ts 组装 DICTS（extra 后合并可覆盖）+ REVERSE_ZH
│   └── data/
│       ├── types.ts         # City v2：continent/subregion/population/timezone/climateDetail/六指数/livingScore/housingLevel/mealUSD（仅内部参考 UI 不展示）/visaStatus 三档/visaDetail/englishBand；大量字段可空；第六轮：City.countryCode（ISO2）+ Country 接口（17 字段+cityCount/updatedAt/sources 逐字段来源；国家级五指数 safetyScore/healthcareScore/qolScore/pollutionScore/climateScore）
│       ├── index.ts         # 合并六大洲 JSON（europe/asia/africa/north-america/south-america/oceania）
│       ├── regions.ts       # 大洲/次区域 key 顺序与中文标签（REGION_LABEL/SUBREGION_LABEL）
│       ├── questions.ts     # 32 MBTI 七级双极题（OEJTS 1.2 结构）+ 8 生活偏好情景题
│       ├── questionsPro.ts  # 第五轮标准版：IPIP-NEO 120 中文题（30 facets×4，keyed ±1，ref 附英文原句；IPIP 公有领域，见 DATA.md 第六节）+ 20 道四题型偏好题（UserDimKey 6 维 + choice slot 直写 budget/climate）
│       ├── demoProfiles.ts  # 3 个演示档案预设答案（INTJ/ENTP/ESFJ，经 verify-iter1 校验）
│       ├── interests.ts     # 简易版 16 个兴趣标签池（与城市 tags 同 id）
│       ├── interestsPro.ts  # 第五轮标准版：28 个一级标签（16 共用 + 12 新增，城市库已同步标注）+ interestSubs 二级细化（每类 3-5 子项）+ reinforcedTags
│       ├── riasec.ts        # 第八轮：O*NET Interest Profiler Short Form 30 题（六维 × 5，Public Domain，ref 官方 activity 英文短语）+ RIASEC_SCALE 喜好 5 档
│       ├── riskTaking.ts    # 第八轮：IPIP Risk-Taking 精选 10 题（6 正 4 反 keyed，Public Domain，ref IPIP 英文原句）
│       └── riasecMap.ts     # 第八轮：六维 → 28 标签池映射常量（可调）
│       ├── countries.json   # 第六轮国家级参考数据（65 国，fetch-country.mjs 产物勿手改；逐字段 sources 标注；TW 仅手工快照）
│       ├── countries.ts     # COUNTRIES/BY_CODE/getCountry(code)/countriesUpdatedAt()；getCountry 对 null/未知码返回 null
│       ├── mbtiProfiles.ts  # 16 型人格游民视角解读
│       └── cities/          # europe/asia/africa/north-america/south-america/oceania.json（共 100 城，assemble.mjs 产出勿手改）
│   ├── verify-seo-v9.ts     # 第十二轮 SEO/GEO 校验（dist 产物断言）
│   └── verify-legal.ts      # 第十三轮法律页校验（GDPR 要素/清除按钮/footer/sitemap）
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
- 第六轮校验：`pnpm tsx scripts/verify-country-v3.ts`（国家数据完整性/逐字段来源标注/GPI 覆盖与豁免/网速覆盖/硬约束单测：预算排除与 5 城放宽/签证三档/安全阈值/null 无法核验/两阶段过滤/埋点计数/引擎集成冒烟；第七轮已更新：GPI 62/65 + 网速 65/65 断言替代全 null 预期）
- i18n 校验（第七轮）：`pnpm tsx scripts/verify-i18n-v4.ts`（zh/en 键集合一致/IPIP ref 与题库词典双语/16 型与 facets/REVERSE_ZH 反查抽样/analysis 规则串反查覆盖率/HTML lang 同步/城市国家 nameEn 覆盖）
- 第八轮校验：`pnpm tsx scripts/verify-onet-v5.ts`（RIASEC 30 题完整性/计分与 top2 单测/六维→标签映射全在池/风险 10 题 keyed 方向与计分/tagRepeats 有界叠加封顶 ×3/双语键/Quiz 流程接入；注意 verify-data-v2 依赖 /tmp/pipeline/climate.json 管道中间产物，被清理后需按 DATA.md 第五节重跑管道）
- 第九轮校验：`pnpm tsx scripts/verify-passport-v6.ts`（护照枚举与默认值/65 国快照覆盖与枚举/CN+visaFree 过滤联动与快照独立重算一致/非 CN 降级全保留/两阶段排除无重复/引擎集成冒烟/双语键完整/reason 串与词典一致）
- 第十轮校验：`pnpm tsx scripts/verify-engine-v7.ts`（分层权重表完整性/值域/三类相对优先级/Tier 3 上限/airFit 分档/冒险友好度与风险联动算例/RIASEC 迁移解耦/双版本回归/200 城覆盖）
- 第十一轮校验：`pnpm tsx scripts/verify-iter-v8.ts`（入口收纳结构/报告样例 demo 完整性与 expectedType/样例模式不污染/Tab 栏防重叠语义/编辑部风色板 token 一致性与旧 hex 清零/新键双语与 REVERSE_ZH 反查）
- 第十二轮校验：`pnpm tsx scripts/verify-seo-v9.ts`（536 落地页生成完整性与内容要素/null 不编造/JSON-LD 全量可解析/robots 8 爬虫/llms.txt/sitemap ≥536 URL/hreflang 互链/主站 @graph/方法论页权重与许可）
- 第十三轮校验：`pnpm tsx scripts/verify-legal.ts`（212 项：3 类法律页存在与结构/GDPR 信息义务逐项关键词/清除数据按钮实现/协议免责与开源署名+O*NET CC BY 4.0/footer 三链接/不退款与 EU 撤回权确认/商标词与弃用命名清零/无第三方脚本外链/方法论字体 OFL 声明/sitemap 全量 URL→dist 文件存在/public 同步 dev 可达）

## 匹配引擎说明

- 权重（引擎 v3 分层，常量块在 engine.ts 为唯一事实源，设计依据见 DESIGN.md 第十/十一轮章节）：Tier 2 三大类 `TIER2_WEIGHTS` = 偏好 0.42 + 人格 0.30 + 兴趣 0.18（保持偏好 > 人格 > 兴趣）；偏好内部 `PREFERENCE_SPLIT` = 用户 8 维 0.86（budget .18/climate .12/pace .10/size .09/social .10/language .09/visa .09/remote .09）+ 客观 3 维 0.14（climateComfort .05/safety .05/englishDepth .04，数据来自城市库非用户作答）；Tier 3 `TIER3_WEIGHTS` = riasecBoost 0.05 + riskLink 0.03 + airFit 0.02（合计 ≤10%）。
- 人格：32 道七级双极量表题（1=完全左、4=中立、7=完全右，OEJTS 1.2 结构、CC BY-NC-SA 4.0）按轴求和（8~56）换算偏好百分比，累计得出四轴向量（E/I、S/N、T/F、J/P，-100..100），与城市 `traits` 向量算距离相似度；恰好中立时归入正向字母（E/N/F/P）。城市 traits 为 null 时人格类整体 null（如 61 座新城）。
- 偏好：预算（与城市成本区间惩罚函数）、气候兼容表、节奏/规模/社交/英语/签证/网络均为 1-5 序数距离打分；客观三维——气候舒适度（19°C 最优锚 + 日照加分 + 降水惩罚）、安全（公开统计安全分原值截断 5-100）、英语深度（公开英语排名 band→95/85/72/55/40，fallback english×20）。
- 兴趣：精度（user 视角，70% 权重）+ 召回（city 视角，30% 权重）；城市 tags 为空数组时兴趣类 null。
- **降权不惩罚（v2→v3 一脉相承）**：任何维度/大类数据缺失（null）时从对应加权的分子与分母中同时剔除，其余维度权重相对放大；极端情况下 raw = classNum/classDen 仍归一化。Tier 3 三信号任一存在才按 0.9/0.1 与 Tier 2 混合，全缺回落纯 Tier 2；简易版 tier3Fit 恒 null。
- 原始分校准：`match = round(clamp(52 + raw * 0.46, 0, 99))`，输出 Top 5 及分维度分数（可空）。
- `computeCityFits(city, answers)`：导出的单城 8 维偏好原始 fit（未取整，客观 3 维不在此内）。assess 内部消费它；对比页用它做临时权重重算——两处共用保证一致性（verify-iter2 校验含 null 语义）。

## 数据工程（第四轮）

- 100 城 = 39 旧城 + 61 新城；分布：欧洲 33 / 亚洲 30 / 非洲 10 / 北美 11 / 南美 9 / 大洋洲 7。
- 来源与许可（详见 `DATA.md`）：GeoNames cities15000（CC BY 4.0）、Open-Meteo Historical（CC BY 4.0，2015-2024 十年均值）、公开统计测算指数（NYC=100 口径）、公开英语能力排名；签证沿用旧城人工快照，新城 null 待核实。
- 派生规则：新城月成本 = 39 城最小二乘拟合（livingScore→monthlyCostUSD，≈39.9x−135.5）±15/20% 区间；english 由公开英语排名 band 映射；size 由人口分档；climateDetail 简评为确定性规则（非 LLM）。
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

见 `DESIGN.md`。核心（第七轮起）：「现代航海图志 · 海洋蓝白」——雾蓝白底（paper #F0F7FA）、深海蓝（deep-sea #0A4D68）、海洋青（ocean #088395）、珊瑚暖点缀（coral #E76F51）、白卡片大圆角 + 波浪纹理 SVG；五层字体 token（display/heading/body/data/serif-accent）不变；禁止科技蓝紫渐变与模板化 SaaS 布局。

## 第七轮：海洋蓝白改版 / 全站双语 / 国家数据补录

- **视觉换肤**：tailwind 语义 token 名不变只换值（paper/paper-deep/card/ink/ink-soft/pine/clay/clay/ochre/teal/moss/sea → 海洋蓝白系），卡片圆角加大 + 波浪纹理 SVG（`src/index.css` 纹理类）；品牌名「栖居罗盘」与五层字体 token 不动；组件结构零重构。图表 JS 侧取色统一走 `src/lib/colors.ts`。
- **i18n 架构**（zh/en）：
  - `src/i18n/index.tsx`：LangContext + useI18n；语言优先级 localStorage（`nomadmatch.v1:lang`）> navigator.language > zh；t() 支持 `{var}` 插值；**REVERSE_ZH 反查**——键查不到时用 zh 值→key 映射反查，规则层（analysis.ts/constraints.ts）产出的中文文案在展示层 `{t(reason)} 自动按语言输出；模块级常量工厂（如 `phaseLabels()`/`channels()`）内部用 `translate(getCurrentLang(), k)`，避免与组件内 t shadow。
  - 词典六域 `src/i18n/dict/`（ui/analysis/questions/interests/mbti/extra），`dict/index.ts` 组装 DICTS + REVERSE_ZH；改文案先查 extra（后合并可覆盖）再改域文件。
  - 题目双语：MBTI 32 题走 `mbti.{id}.left/right`；简易偏好 8 题走 `ls.{id}.*`（数据字段中文值与词典 zh 值完全一致，反查前提——改题目文案必须**同步**数据与词典）；IPIP 120 题干 en 渲染 `question.ref`（英文原句）；pro 20 题走 `pro.{qid}.*`。
  - 名称/金额/日期：`src/lib/format.ts`——cityName/countryName 按语言取 nameEn/nameZh；formatMoney zh 双币（¥+≈$）en 单币 USD；formatDate locale 化。
  - SEO：html lang / title / meta description / og:* 随语言切换（index.html 静态 zh 默认 + og:locale zh_CN/en_US alternate）。
- **国家数据补录**：`scripts/pipeline/snapshot-gpispeed.mjs` 幂等回填 GPI（IEP 2024 手工快照 62/65，HK/PR/FJ 榜单不含显式 null + sources 注明豁免）与固定宽带网速（公开网速榜单中位数下行 65/65）；GPI/网速属「参考信息层」不进引擎加权（与第六轮一致）；来源口径见 DATA.md 第八节。

## 包管理规范

**仅允许使用 pnpm**，严禁 npm / yarn。
- 安装依赖：`pnpm add <pkg>`；开发依赖：`pnpm add -D <pkg>`。
- 注意：`@vitejs/plugin-react` 锁定 v4.7（v6 与 Vite 7 存在 `./internal` 导出不兼容问题）。
- 重要：`server/vite.ts` 创建 Vite 中间件时必须带 `configFile: false`——inline config 已 spread 整个 `vite.config`（含 plugins），若不禁用，Vite 会再次加载配置文件并合并出两份 `react()` 插件，导致 react-refresh 重复注入、所有组件模块 500（页面白屏）。
- 重要：`scripts/build.sh` 中 tsup 打包 server 必须带 `--shims`——`vite.config.ts`（含 `@vitejs/plugin-react`）会被内联进 CJS bundle，ESM 代码里的 `import.meta.url` 在 CJS 输出中为 `undefined`，模块初始化即抛 `ERR_INVALID_ARG_TYPE`（部署崩溃、函数重启 3 次失败）。`--shims` 将其替换为 `pathToFileURL(__filename).href`；refresh-runtime 路径仅 dev 的 react-refresh 使用，prod 只计算不消费。
- 重要：Express 全局错误中间件必须恰好 4 个参数 `(err, req, res, next)`——Express 按 arity=4 识别 error handler，3 参数会被当普通中间件（`server/server.ts`）。

## 第八轮：O*NET RIASEC + IPIP 风险偏好（标准版只增不改）

- **题库**：RIASEC 30 题（O*NET Interest Profiler Short Form，Public Domain，每维 5 题，ref 为官方 activity 英文短语）与 IPIP Risk-Taking 10 题（ipip.ori.org 语句池精选，6 正 4 反）均为 `text` 中文 + `ref` 英文模式，en 模式渲染 ref（与 IPIP 120 同构）。
- **流程**：标准版 pro 流程 = IPIP 120（20 页）→ transition → 偏好 20 题（5 页）→ **风险 10 题（2 页，module 仍为 lifestyle）** → transition → 28 标签（3 页）→ **RIASEC 30 题（6 页，module 仍为 interests）**；进度条三阶段不变，总作答约 180 题量级。
- **草稿兼容**：UserAnswers 新增可选 `riasec`/`risk` 字段；旧草稿缺字段由 `(draft.riasec ?? {})` / `(prev.riasec ?? {})` 兜底，恢复后补答新页即可。
- **加权机制（引擎打分结构零改动）**：RIASEC 高分维（百分位 ≥60）给映射标签 +1 次重复权重，与「子项双倍」有界叠加、重复次数封顶 2（标签 ×3）；只强化**已勾选**标签，不凭空新增兴趣。风险分只进报告画像，不进引擎。
- **报告**：`report/RiasecSection.tsx` = 六维雷达（复用 RadarChart 通用 axes/series）+ top2 组合画像卡（16 组合词典）+ 标签联动行 + 风险偏好卡（band 语义色徽标）；仅在 `result.riasecProfile` 存在时渲染。
- **不动清单**：引擎 30/48/22 与 11 维、硬约束、简易版题库、计费、16Personalities 类逆向题库（版权风险，明确不采用）。

## 第九轮：护照维度 + 签证匹配升级 + 长期定居模块

- **护照选择器**：硬约束步骤新增（12 选项 PASSPORT_OPTIONS：CN/HK/MO/TW/SG/JP/US/GB/CA/AU/EU/OTHER），存 `HardConstraints.passport`（默认 'CN'）+ `UserAnswers.passport`，`storage.loadPassport/savePassport` 独立键跨会话记忆。
- **免签快照**：`scripts/pipeline/snapshot-passport.mjs` 幂等回填 `Country.visaPassport`（entry 四档 + entryNote + work/digitalNomad/longTerm 三维 friendly/restricted/unknown + snapshotDate，65/65）与 `Country.longStay`（taxResidencyDays / socialSecurityCn treaty|none|negotiating / rentalCustom，65/65，字段级允许 null）；**仅覆盖中国大陆护照**，来源与日期见 DATA.md 第十节。
- **过滤联动**：VisaLine 新增 'visaFree' 首档——CN 护照按 `getCountry(city.countryCode)?.visaPassport` 过滤（免签/落地签通过；无快照 = 无法核验排除，与 safety null 语义一致）；**非 CN 护照降级不过滤**（`ConstraintResult.passportSkipped = true`），ConstraintsNotice 显示降级标注。visaFree 档**不走城市 visaStatus 档位检查**（official/alternative 才走）。
- **展示**：共享组件 `report/PassportVisaBlock.tsx`（PassportVisaBlock 持当前护照签证卡 + LongStayBlock 长期定居注意）——报告页 CountryCards 与对比页 CityDetailModal 复用，非 CN 护照显示降级文案，固定免责声明「签证政策多变，出行前务必核实官方渠道」；对比页国家级对比行追加「税居天数」列（cmp.taxDays）。
- **两阶段去重**：applyHardConstraints 的 pushExcluded 按 cityId 去重——放宽回填失败者不再重复登记（阶段 1 预算原因保留）。
- **约束**：引擎 30/48/22 与 11 维不动；简易版题库与流程不动；标准版题量不变；visaPassport/longStay 均为参考信息层（引擎加权不消费）。

## 第十轮：200 城扩容 + 引擎 v3 分层评分 + 空气质量

- **城市库 200 城**：`scripts/pipeline/selection2.mjs`（100 新城清单 × GeoNames 匹配，queenstown 走 fallback 坐标兜底）→ `fetch-cost.mjs --new`（详情幂等补抓 + curl 转录脚本 `patch-cost-curl.mjs`，75/100 城有 rent/meal 详情，其余公开统计源无详情页 → null）→ `fetch-climate.mjs`（100 新城气候，argv 传展开后的数组底座）→ `assemble-v2.mjs` **以当前六大洲 JSON 为基底只追加**（旧 100 城数据值与顺序不变；`assemble.mjs` 会用当月公开统计数据重建污染旧城，禁用）；分布 欧 68 / 亚 57 / 非 18 / 北美 22 / 南美 18 / 大洋 17。
- **引擎 v3 分层**（`src/lib/engine.ts` 常量块为唯一事实源，设计依据见 DESIGN.md 第十轮章节）：`TIER2_WEIGHTS`（preference .42 / personality .30 / interest .18）+ `TIER3_WEIGHTS`（riasecBoost .05 / riskLink .03 / airFit .02，合计 ≤10%）+ `PREFERENCE_SPLIT`（user .86 / objective .14）；聚合入口 `aggregateV3Raw`（Tier 2 null 类降权归一 → Tier 3 任一存在才 0.9/0.1 混合，全缺回落纯 Tier 2）。`WEIGHTS` 别名（0.30/0.42/0.18）保留兼容。
- **Tier 3 三信号**：① riasecFit——RIASEC 强化标签（`riasecBoostedTags` 差集）× 城市 tags 加权重合率，兴趣类本体分解耦（`tagRepeats(answers, { includeRiasec: false })`）；② riskFit——`riskLinkFit` = 100−|风险指数−冒险友好度|，`adventureFriendly` = safety .40 + 签证灵活 .30 + nightlife .20 + outdoor 标签覆盖 .10（null 分量剔除重归一）；③ airFit——WHO 分档映射 优 90/良 72/一般 48/差 25，**标准版专属**（lite 版 tier3Fit 恒 null）。风险画像仍只进报告，不单独进引擎。
- **airQuality 数据**：`City.airQuality { pm25, band, period } | null`；`scripts/pipeline/snapshot-airquality.mjs` 幂等快照 200/200（Open-Meteo Air Quality CAMS 2022-08~2024-12 均值 + WHO 2021 分档，坐标 = GeoNames 匹配 + EXTRA_COORD 9 城兜底）；展示 = 详情弹层「空气质量」Stat + 对比页数据表列（`AIR_BAND_TONE` 语义色，`src/lib/colors.ts`）。
- **全站文案 100→200**：Landing 统计/图集/CTA、ui/extra 词典 hero 与 atlas 描述、index.html og、title.ts 已同步；`air.*` 词典键（ui 域）双语齐全。
- **验证**：`verify-engine-v7.ts`（55 项：分层权重/值域/优先级/Tier3 上限/airFit 分档算例/冒险友好度与风险联动/RIASEC 迁移解耦/双版本回归/200 城覆盖）；`verify-data-v2.ts` 200 城口径（NEW_ROUND_IDS 读 selection2，兼容数组或 {cities} 顶层）；`verify-iter1` 优劣势分代阈值（39 旧城 3+2 / 其余 1+1）；`verify-passport-v6` 保留区间改为 ≥5 且 < 全量；`verify-i18n-v4` nameEn 断言 cities.length >= 100。

## 第十一轮：Tab 栏防重叠 + 天空蓝白换肤 + 入口收纳 + 报告样例

- **Tab 栏防重叠**：`TabBar.tsx` LangSwitch 不再 `absolute right-*` 叠放（窄屏会盖住「我的」Tab）——改为 `justify-between` 流式布局：窄屏 nav 左对齐（gap-1.5 / px-2.5 收紧）+ LangSwitch `shrink-0` 靠右；桌面 `md:mx-auto` 居中。新增 header 元素必须走正常流并核对 375px 宽度预算。
- **天空蓝白换肤**：token 名不变只换值（第七轮机制），`tailwind.config.js` 为唯一事实源——pine #0369A1（sky-700 主操作，白字 ≥5:1）/ teal #17A2C6 / paper #F0F9FF / paper-deep #E0F2FE / ink #082F49 / ink-soft #4E7A96 / sea #57B4E0 / clay #EE6C4D（deep #D14E2F）/ ochre·moss 不变；`src/lib/colors.ts` CHART_COLORS 逐项对齐；**全 src/ 旧 hex 清零**（散落色一律 import CHART_COLORS 或用 token 类，verify-iter-v8 全源码扫描把关）。禁紫色调；深色区块仍用 ink 不用 pine。**（第十一轮的天空蓝白已被后续「编辑部杂志风」取代：现行 token 为 pine #1D3557 航海蓝 / paper #F9F8F6 燕麦羊皮纸 / ink #1F2421 炭墨 / clay #C96A52 暖赤陶 / ochre #B98A2F / teal #3E7C8F / sea #7FA8B8 / moss #5F7A5A；`CHART_COLORS` 与 `COMPARE_COLORS`/`RADAR_COLORS` 等散落色（RouteChart·CompassMark·RadarChart·WeightDonut·BigFiveSection·CompareScreen·ConstraintsStep）均已对齐，verify-iter-v8 第 5 节同时清零两代旧 hex）**
- **入口收纳**：`VersionPicker.tsx` 新组件（版本选择弹层：lite「永久免费」徽章 + pro「PRO」徽章并列）；Landing 的 header 按钮 / Hero CTA / 底部 freeCta 统一弹层，`onStart()` 直调仅剩结尾 lite 介绍卡一处（直连 lite）；pro 介绍卡保持 onProIntro。
- **报告样例**：Hero CTA 旁「查看报告样例」次入口（`onDemo(DEMO_PROFILES[0].id)`，ghost 层级）——与快速演示档案**同一数据源同一渲染**（buildDemoAnswers → assess → Report isDemo）；样例标注 = Report 顶部 `rep.demo.badge`（样例报告 · demo）+ 底部引导 CTA；**纯只读**：openDemo 不写 draft/history/billing 任何键（verify-iter-v8 源码断言 + node 守卫降级测试）。
- **验证**：`pnpm tsx scripts/verify-iter-v8.ts`（51 项：入口收纳结构 / 样例 demo 数据完整性与 expectedType / 不污染断言 / Tab 布局语义 / 换肤 token 一致性与旧 hex 清零 / 新键双语 + REVERSE_ZH 反查）。注意 `verify-data-v2` 依赖 /tmp 管道中间产物，被清理后需按 DATA.md 第五节重跑管道。

## 编码规范

- TypeScript `strict` + `react-jsx`；含 JSX 的文件必须使用 `.tsx` 扩展名。
- 禁止隐式 `any` / `as any`；函数参数、返回值、事件对象、Express `req`/`res`、`catch` 错误需有明确类型或完成收窄。
- 及时清理未使用的变量与导入。

## 第十二轮：SEO/GEO 基建——预渲染落地页 + AI 可见性

- **架构定位**：落地页是主应用外的新增静态层，主应用（测评/报告/对比）零改动；无路由库——落地页不进 SPA，由构建管道生成自包含静态 HTML，生产环境 `express.static(dist)` 自动命中 `dist/city/<id>/index.html` 等目录（fallback 顺序在后不吞）；dev 模式 /city/* 走 SPA fallback 属预期。
- **生成管道**：`scripts/generate-landing.mjs`（vite build 之后由 `tsx` 运行以便复用 src/i18n 的 TS 英译表）——读 `src/data/cities/*.json` + `countries.json`，token 色值从 `tailwind.config.js` 正则提取（config 为唯一事实源）；域名取 `SITE_URL`（或 Cloudflare 的 `CF_PAGES_URL`），本地兜底 `https://gethabitatcompass.com`（构建时固化进 canonical/sitemap/robots）。产物：`city/<id>/` + `en/city/<id>/`（200×2）+ `country/<code>/` + `en/country/<code>/`（65×2）+ `cities|countries|methodology`（zh+en）+ `en/index.html` + `404.html` = 544 页 + robots.txt + llms.txt + sitemap.xml（544 URL）。EN 城市/国家页经 countryGlossary/entryNotes 英译，无中文残留。
- **页面要素（answer-first）**：首屏直答段（50-80 字）→ 6 张数据卡（成本/安全/气候/网速/空气/签证，**每卡标注来源与日期**：官方开放数据与公开统计测算/Open-Meteo 2015-2024/CAMS+WHO 2021 分档/公开网速榜单/快照日期）→ FAQ 3-5 问（`<details>` 零 JS）+ FAQPage JSON-LD + BreadcrumbList JSON-LD → CTA 链回主应用；每页 canonical + OG/Twitter 卡 + hreflang（zh-Hans/en/x-default）双语互链。
- **null 不编造**：无公开统计详情的城直答段与 FAQ 用「待核实/待补充」措辞并给出国家级参考（verify-seo-v9 第 3 节断言）。
- **自包含 HTML**：内联精简 CSS（CSS 变量 = 主站 token 值）、系统字体栈（不加载 webfont，LCP 最优）、零 JS；英文版 meta+直答+FAQ 完整、数据卡与中文版同构。
- **AI 可见性文件**：robots.txt 显式 Allow OAI-SearchBot/GPTBot/ClaudeBot/Claude-Web/PerplexityBot/Google-Extended/Bingbot/Googlebot/Applebot-Extended + Sitemap 行；llms.txt（H1+简介+关键页链接+示例城市/国家页+引擎口径）；sitemap.xml 全量 538 URL。
- **主站**：index.html 注入 Organization + WebApplication @graph JSON-LD（sameAs 预留）；Landing 图集区新增「资料库」链接（landing.library.link 双语键）→ /cities/。
- **方法论页**：三层权重全公开（T1 硬约束过滤 / T2 0.42+0.30+0.18（偏好内 0.86/0.14）/ T3 0.05+0.03+0.02）、校准公式 52+raw×0.46、数据许可署名（GeoNames/Open-Meteo/World Bank/UNDP/TI/IEP/IPIP/OEJTS/O*NET/WHO 2021，均低调一行；O*NET 为 CC BY 4.0 强制署名）、更新频率与免责声明——GEO 权威信号层。
- **校验**：`pnpm tsx scripts/verify-seo-v9.ts`（dist 缺失时自动先跑 generate-landing，幂等）。

## 第十三轮：法律合规页（用户协议 + 隐私政策 + GDPR 适配）

- **架构**：复用第十二轮落地页基建——`generate-landing.mjs` 内 `LEGAL_PRIVACY/LEGAL_TERMS`（zh/en 各一套结构化章节）+ `renderLegalPage(kind, lang)` 生成 4 个自包含静态页：`/privacy/`、`/terms/`、`/en/privacy/`、`/en/terms/`（共 540 页，sitemap 542 URL）。不引入路由库（项目无 React Router，生产 express.static 命中目录 index.html，与 /cities/ 同模式）。
- **无同意横幅决策**：本站无追踪 Cookie、无第三方分析脚本、无广告；localStorage（nomadmatch.v1 前缀）属提供用户明确请求服务的 strictly necessary 范围（ePrivacy Art. 5(3) 豁免逻辑）——以"如实披露 + 权利可操作"替代 CMP 同意库。
- **隐私政策要素**：控制者（privacy@habitatcompass.app 占位）/ 实际存储键逐项披露（draft/proDraft/history/proHistory/favorites/compare/archives/hardConstraints/passport/lang/funnel/proUnlocked/orders）/ Art. 6(1)(b)/仅设备本地无国际传输/保存期至用户清除/Art. 15–22 + 77 权利与站内行使方式 + 30 天响应/未成年人 16 岁（Art. 8）/泄露 72 小时公告/EEA-UK 补充 + CCPA/CPRA（不出售不共享，数据从未离开设备）。
- **清除数据按钮（删除权站内实现）**：隐私页 `.erase` 区块 + 最小内联 JS——confirm 确认后遍历 localStorage 按 `nomadmatch.v1:` 前缀逐键 removeItem，显示删除计数反馈；`<noscript>` 降级提示。协议页不含此按钮。
- **用户协议要素**：服务描述/可接受使用/知识产权与开源数据署名（GeoNames/Open-Meteo/World Bank/IPIP-NEO/O*NET/IPIP Risk-Taking/OEJTS，按 DATA.md）/as-is 免责与"非移民·法律·税务·财务·医疗建议"/责任限制/计费如实描述（¥29.9 演示性虚拟买断、模拟支付无真实扣款无退款，与 PayModal 行为一致）/服务变更终止/适用法域占位/联系渠道。
- **SPA Footer**：`src/components/Footer.tsx`（Terms/Privacy 链接按 lang 取 `/terms/` 或 `/en/terms/`），挂 App.tsx 三 Tab 屏幕（TAB_SCREENS 判断，quiz/report/pro-intro 专注模式不显示）；词典键 `footer.terms/footer.privacy`（ui 域 zh/en）。
- **占位项清单**：①联系邮箱 privacy@habitatcompass.app ②适用法域与管辖条款 ③运营者主体信息——正式部署前替换（页内已标注"占位"）。
- **校验**：`pnpm tsx scripts/verify-legal.ts`（212 项：页面结构/GDPR 关键词逐项/eraseAll 实现/协议要素/footer 三链/sitemap 全量 URL→文件/去品牌化与商标词全 dist 扫描/第十二轮产物未破坏）。

### 第十三轮追加：合规自查修复 + /disclaimer + 不退款与 EU 撤回权

- **命名统一**：全站英文名统一为 **Habitat Compass**（弃用 Siju Compass 与 NomadMatch）——generate-landing/llms.txt/og:site_name/JSON-LD/Footer/index.html 已全部替换；命名与商标自查备注见 DESIGN.md。
- **商标词清零（用户可见层）**：dist 全部 HTML 无 MBTI/Myers-Briggs/16Personalities——词典（ui/extra 域 8 键 zh+en）、Report 复制摘要（新增 report.copy.persona 键）、方法论页、questions.ts 注释已清理；人格部分只用「16 型人格/性格画像/Big Five」表述。代码内部标识符（mbtiQuestions/MBTI_SOURCE 等）为技术命名非站点内容，不属商标使用，保持不动。
- **署名修正**：O*NET Interest Profiler Short Form 从「公有领域」修正为 **CC BY 4.0**（方法论页 zh/en + 用户协议知识产权节）；方法论页许可清单补齐 CC BY 4.0 三要素（作者/源站链接/creativecommons 许可链接 ×3+）；新增「字体与许可」小节（Noto Sans SC/IBM Plex Mono/Source Serif 4，SIL OFL 1.1，经 @fontsource 自托管，node_modules LICENSE 随包分发已核验）。
- **dev 可达性修复**：法律页（privacy/terms/disclaimer × zh/en 共 6 文件）由 generate-landing.mjs **同步写入 public/**——dev 模式（vite middleware）直接命中 public，/privacy/ 等不再落入 SPA fallback；生产仍以 dist 命中，build 时 public 副本被 generate 同内容覆盖，无冲突。
- **/en/ 首页补齐**：第十二轮 sitemap 一直声明 /en/ 但无对应文件（404 bug）——新增 renderEnHome() 精简英文首页（Hero+四个入口卡+法律链接）→ dist/en/index.html，sitemap 全量 URL 现已一一对应 dist 文件（verify-legal 第十节全量断言）。
- **/disclaimer（zh/en）**：LEGAL_DISCLAIMER + renderLegalPage 泛化（kind 三值）；内容 = 信息参考非专业建议（移民/签证/法律/税务/医疗/保险/财务/投资八类）+ 第三方快照与快照日期标注 + 不保证准确性完整性时效性 + as-is/as-available + 用户自担风险 + 与 terms/privacy 互链；sitemap 544 URL。
- **不退款条款（/terms 计费节 zh/en）**：所有数字商品一经购买成功即完成交付，概不退款（all sales are final; no refunds）；欧盟消费者兜底 = 购买流程含「同意即时交付 + 知悉丧失 14 天撤回权」的显式确认（PayModal checkbox `bill.pay.euNotice`，未勾选禁用确认按钮，打开弹窗重置），条款在 /terms 中说明该机制。
- **Footer 三链接**：SPA Footer 与静态页 shell footer 均含 Terms/Privacy/Disclaimer（zh/en 前缀随语言）；词典键 footer.terms/footer.privacy/footer.disclaimer。
- **localStorage 降级（已核验无需修复）**：storage.ts 全部读写已 try/catch 包装，隐私模式/禁用 localStorage 时静默降级不白屏。

### 第十三轮修正（指令覆盖）：数据源去品牌化 + 退款措辞 + 免责强化

- **去品牌化（商用合规口径）**：全站面向用户的页面（法律页/方法论页/落地页/数据卡来源标注/FAQ/llms.txt/页脚/SPA 脚注）**零受限商业源品牌露出**（verify-legal 9.4 全 dist 543 页扫描断言 0 命中）；来源统一表述「官方开放数据（Open Data）与公开统计测算 / official open data & public statistical estimates」，快照日期保留。IPIP 不突出署名（方法论许可清单与协议正文已移除）；O*NET 仅在方法论页页底保留一行低调署名「Career interest framework: O*NET Interest Profiler Short Form (CC BY 4.0…)」；OEJTS 1.2 因 CC BY-NC-SA 4.0 署名要求保留许可行。DATA.md 已按第十三轮深化改写为「数据口径说明」（仓库公开=全部文档公开，零受限商业源名称，只描述字段含义/聚合方法/更新频率/免责声明）。词典键名同步通用化（cty.natSafety 等）符非站点内容，值层已全部中性化。
- **退款条款（/terms 计费节 zh/en，指令原文措辞）**：「数字内容一经购买即开始即时交付，交付完成即视为履约完毕。用户在购买确认时明确同意即时交付，并据此依法放弃法定撤回权（包括欧盟消费者权利指令下的 14 天撤回权）。所有数字商品一经售出概不退款。」/ en: "…delivery is deemed complete upon commencement of streaming/download or access… lose your statutory right of withdrawal (including the 14-day right under the EU Consumer Rights Directive). All sales are final; no refunds."；PayModal checkbox 键 bill.pay.euNotice 同步指令口径。
- **免责强化（/disclaimer 与 /terms）**：九类专业建议列举（移民、签证、**居留**、法律、税务、医疗、**保险**、财务、投资）；en 统一措辞 "not immigration, visa, legal, tax, medical, or financial advice"；/disclaimer 顶部新增醒目提示框（.notice，clay 左边框 + paper-deep 底）呈现核心免责一句；数据准确性免责改「官方开放数据与公开统计来源」表述。
- **verify-seo-v9 同步**：方法论署名断言改为 CC BY 4.0 + CC BY-NC-SA 4.0 + WHO 且无受限商业源（42 项全绿）。
- **第十三轮深化（数据源标记彻底清除）**：字段通用化等价重命名——City `costIndex→livingScore`/`rent1brUSD→housingLevel`/`englishEpiBand→englishBand`/`englishEpiScore→englishScore`（类型同步 `EpiBand→EnglishBand`），Country 原受限源前缀五字段→`safetyScore/healthcareScore/qolScore/pollutionScore/climateScore`；数值/权重/评分逻辑零改动。UI 单品价格移除（CityDetailModal 单餐 Stat、CompareDataCards 单餐列、analysis 试住计划 meal 项；mealUSD 字段保留为内部数据不上 UI）；i18n 键 `cty.*受限源前缀→cty.natSafety/natHealthcare`、`rep.stat.costIndex→rep.stat.living`、`cmp.data.costIndex→cmp.data.living`、`cmp.data.rent1br→cmp.data.housing`；管道脚本改名 fetch-cost.mjs / patch-cost-curl.mjs（受限源前缀旧名弃用；源站 URL 常量拼接不留字面量）；DATA.md 改写为「数据口径说明」（零商业源名称）；verify-legal 9.6 新增全库零命中断言（src/scripts/server 全部 ts/tsx/mjs/json/html 扫描，拼接正则避免自命中）。

## 第十四轮：付费系统全量下线 + Habitat Compass 品牌 + 文案全面校对 + 合规复查

- **付费系统全量下线（功能全免费开放）**：删除 `src/components/billing/`（PayModal/ProIntro）与 billing 目录；`App.tsx` 移除 screen 'pro-intro'/openProIntro/解锁门（两版直接进测评）；`Landing.tsx` props 收敛为 `{ onStart, onDemo }`、标准版卡 eyebrow 'standard edition · free'、价格行 `landing.version.proPrice`（值 = 永久免费）；`ProfileScreen.tsx` 删除虚拟订单区块/funnel 付费行/resetBilling 入口、新增 `profile.cta.quizPro` 空态 CTA；`storage.ts` 删除计费区块（PRO_PRICE_CNY/PayChannel/ProOrder/createProOrder/resetBilling），保留 proDraft/proHistory/draft/history/favorites/compare/archives；`telemetry.ts` FunnelEvent 缩减为 quiz_version_lite/quiz_version_pro/report_generated/hard_constraints_used；词典删除 bill.channel/pay/table/pro、pi.*、pf.orders/pf.pro 及 26 个死键；法律页删除计费章节（不退款/EU 撤回权随之删除——无交易则不适用）与订单披露（proUnlocked/orders）、eraseAll 文案去购买状态；**verify-legal 第八节改写为「付费系统全量下线」断言**（组件不存在 + SPA 源 10 token + 词典 token 零命中）+ TERMS 断言改「全部功能无需付费」正反双向。localStorage 前缀 `nomadmatch.v1` 不变。
- **品牌 NomadMatch → Habitat Compass**：generate-landing（22 处 + 控制者名 + 邮箱 habitatcompass.app + og:url + JSON-LD）、index.html JSON-LD、Footer、`title.ts` en、ui 词典 en hero/footer.brand/`report.copy.header`（旧值 Compass Living 为十二轮前遗留未同步词，全库清零）、方法论页；grep -ri nomadmatch 仅剩 nomadmatch.v1 技术键与 legal 静态页披露（允许保留）。
- **文案校对（zh/en 对照要点）**：测评时长统一「约 8 分钟」（step1/ctaHint/demo.cta2/land.cta.meta，en 同步 About 8 minutes）；标准版描述去总题数 168（改为分量列举 120+20+10+28+30）；`landing.stat.threshold` 注册门槛→上手门槛；RIASEC/IPIP 量表标签统一（'不好确定'→'不确定'、'非常感兴趣'→'非常喜欢'，**数据文件 questionsPro.ts/riasec.ts 与词典同步**——REVERSE_ZH 反查前提）；`quiz.riasec.source` O*NET 'Public Domain'→'CC BY 4.0'（与十三轮许可口径对齐）；'重网络'→'网络密集型'（analysis.ts 规则串与词典 analysis.ts 同步反查一致）；en 混中文修复（'公开统计测算'→'public statistical estimates'）；`landing.version.desc` 100-city→200-city（十轮漏网）；en 'pick the 16'→'pick from the 16'；`pf.funnel.times` hits→times；`bf.compare.pro/proOnly` Pro→Standard；`profile.empty/history/funnel` Pro→Standard 对齐；落地页：城市页成本 FAQ 删单餐价（单品口径）、'来源: '半角→'来源：'全角（`${S}` 常量含冒号重构 10 处拼接）、GPI null 时 '（IEP ）'空串 bug 条件化、en '(no city-level public estimate yet)' 重复 yet 修复。
- **合规复查（零命中维持 + 收尾）**：Ookla 中性化——`snapshot-gpispeed.mjs` NET_SOURCE/注释 4 处 → '公开网速榜单'，重跑幂等回填 countries.json（数值不变仅 sources），`verify-country-v3` 断言 'Speedtest'→'公开网速榜单' 同步；管道 EF EPI 注释/console 清零（fetch-efepi.mjs/assemble.mjs）；**删除 `public/nomadmatch-src.zip`**（十三轮误留的 pre-深化源码快照，vite build 每次复制进 dist 导致 numbeo/旧品牌残留——dist/public 双删后零命中）；第三方脚本外链/外部图片/Google Fonts 外链 dist 全零；mealUSD 组件零消费。

## 判例索引（工程经验教训，蒸馏自 Boss 的判例库 172 条）

> 来源：Boss 用 workbuddy 沉淀的判例库（J-000~J-171，覆盖 2026-09-28~10-04）。以下仅收录在本沙箱环境可验证适用、且与本仓库开发直接相关的条目。**判例是假设，不是操作手册**——每条使用前先确认在本环境成立（J-029/J-013 的教训：判例自身也会过期或错误）。完整原文见判例库全库文档（J-000~J-171）。

### 验证与断言（本项目 verify-* 脚本体系的直接养料）

- **J-019/J-110**：构建通过 ≠ 能跑，类型检查全绿 ≠ 页面能跑——前端必须验到 headless Chrome 控制台无错（本仓库可用 chromium --headless --dump-dom 或 playwright 实测）。
- **J-120**：断言全绿 ≠ 画面画对了——涉及视觉的改动必须实拍截图人眼看一次。
- **J-031**：判定链必须先用「必失败样本」自检——新增 verify 断言时先故意破坏一次，确认它能红。
- **J-129/J-130**：`check(name, true, '')` 是空断言；测试参数可能把断言绕过去——每个断言先问「它能不能区分好坏」（J-036）。
- **J-150**：断言覆盖范围本身必须被断言——遍历清单式测试要加一条「清单条目数 == 期望值」，否则删页面 = 删清单项 = 全绿。
- **J-147**：「验证全绿」只证明系统内部自洽，不证明与事实源一致——断言基准若是快照，存在「两边一起旧」的窗口。
- **J-034/J-035**：分页/交互类断言勿用「行数变化」这类弱信号，要断言具体元素存在性；CLS 的 hadRecentInput 会吃掉点击引起的位移。
- **J-032**：headless 下性能与样式类断言最容易假绿，要加反证条件。
- **J-040**：重构后端点没报错 ≠ 产物没变——必须比对中间产物（dist 产物 diff）。

### 沙箱与环境（本云沙箱实测吻合）

- **J-038**：并行度按 cgroup 配额算，不按 nproc/free——本沙箱实测 cpu.max=4 核、memory.max=8 GiB、无 swap（已实测与判例一致）。
- **J-081**：服务监听回环地址时端口转发必然失效——排查前先看 `ss -ltnp` 的监听地址；对外预览必须绑 0.0.0.0。
- **J-115**：chromium 的 SingletonLock 跨沙箱残留——CDP 起不来先删 ~/.cache/ms-playwright 或 profile 下的锁文件。
- **J-066**：`/dev/shm` 仅 64 MiB——Chrome 必须带 --disable-dev-shm-usage。
- **J-092/J-106**：容器是内网环境，依赖外部直连的工具有时断时续——「000 + 5s」是网络拦截不是服务挂了，先重试再换路。
- **J-050**：GitHub 直连时断时续，克隆/推送失败先重试，不要急着换路。
- **J-116**：`set -e` 下调用「返非 0 表示无需处理」的函数必须 `|| true`（本仓库 scripts/*.sh 均在 set -Eeuo pipefail 下）。
- **J-099/J-098**：长输出 CLI 经管道可能抛 EIO 被误判为崩溃；zsh 无 /dev/tcp（本沙箱是 bash，但脚本要考虑可移植）。

### 流程与协作

- **J-002**：并行子代理写同一文件会互相覆盖且静默丢失——并行探索类任务各自指定独立输出路径，或直接回传不落盘。
- **J-010**：给用户操作指引前必须实际验证（WebFetch 读内容，不只看 HTTP 200）；否定性结论要用最高标准——「我没找到」≠「不存在」。
- **J-011**：换方案前先验证新旧卡点是否同一个，否则换 = 白干 + 假进展。
- **J-012**：官方文档说「不支持」≠ 没有通路——底层组件（CLI --help、DLL、配置）往往暴露文档未写的能力。
- **J-008**：一个 URL 404 不能证明整条通道断了——先找官方清单文件读真实 URL，别自己拼路径。
- **J-045/J-114**：判据的兜底逻辑会把「全体失败」伪装成「通过」；上游脏值会短路 `a or b()` 兜底——兜底前先校验值本身有效。
- **J-159**：凭记忆给政策/事实类状态下结论必错——联网事实必须联网核实。
- **J-095**：删除前先归档并校验——归档是后悔药。
- **J-006**：交付 HTML 报告不用 emoji（无字体环境渲染为豆腐块），箭头用 ->，交付前实际渲染一次。

### 数据与 i18n（本仓库特有风险的对应警戒）

- **J-097**：改结构化单行 JSON 用解析器，不用文本替换（countries.json/cities/*.json 均为单行大 JSON）。
- **J-118/J-152**：参数漂移是「面」不是「点」——改一处要扫全库；同一个数字在两处各写各的 = 迟早漂移（本仓库引擎权重/词典键/i18n 反查是高危区：改 REVERSE_ZH 依赖的中文值必须同步数据文件与词典）。
- **J-142/J-143**：0-based 拼字符串会出「0月」这类界面 bug；断言「包含某字符」抓不到「值本身错」。
- **J-160**：同一个数字在三个来源间三个值——数据管道多源对账时先定义口径（J-113/J-063：报数前先定义口径，两口径读数不可跨比）。

### 元判例

- **J-000**：每次开工先读本索引，判断哪些条目与本次任务相关。
- **J-029/J-013 复核**：判例自身也会过期或出错，否定性结论必须标注排查范围；读了判例就照做、不再实测 = 把错误永久固化。
- **J-145**：阶段未到时，画面打磨是过度投入——优先级错配比做错更贵。
- **J-148**：P0 的验收尺度 ≠ demo 的试玩尺度——先确认本次交付的性质再定验收强度。
- **J-084**：调研/报告类产出：区分「实测数据」与「估计/攻略」并分别标注来源。
