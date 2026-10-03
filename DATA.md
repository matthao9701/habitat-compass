# DATA.md — 栖居罗盘城市数据库（v2，100 城）

> 更新日期：2025 年 · 第四轮迭代（城市库 39 → 100 城 + 数据维度扩充）
> 管道脚本：`scripts/pipeline/*.mjs`（Node ESM，产物落 `src/data/cities/*.json`）

## 一、数据源与许可

| 数据源 | 用途 | 许可 / 口径 | 抓取方式 |
| --- | --- | --- | --- |
| GeoNames cities15000 | 61 座新城底座：坐标、人口、国家代码、IANA 时区；39 旧城补人口/时区/坐标校验 | CC BY 4.0 | `cities15000.zip` 一次性下载（tab 分隔，f4/f5 坐标、f8 ISO2、f14 人口、f18 时区） |
| Open-Meteo Historical Weather API | 100 城近 10 年（2015-01-01 ~ 2024-12-31）日均温 / 降水 / 日照 → `climateDetail` 四指标 + 确定性简评 | CC BY 4.0（免 key） | `fetch-climate.mjs`，archive-api 逐城逐年拉取，10 年均值，增量重跑 |
| Numbeo 公开指数页 | 成本指数（CoL / Rent / CoL+Rent / Groceries / Restaurant / Local PP）+ QoL 六指数（QoL / Purchasing Power / Safety / Health Care / Traffic / Pollution / Climate） | 公开榜单转录，口径 NYC=100；仅引用指数，不转载明细页面 | `fetch-numbeo.mjs`，rankings.jsp 两表 + 逐城详情页（`?currency=USD`，限速 3.2s + 429 退避） |
| Numbeo 逐城详情页 | 市中心一居室月租 `rent1brUSD`、平价餐厅单人餐 `mealUSD`（USD 实时汇率） | 同上 | 同上 |
| EF English Proficiency Index | 国家级英语普及度 `englishEpiBand` / `englishEpiScore`（仅国家级，映射到城市） | EF EPI 公开发布数据（引用注明） | `fetch-efepi.mjs`，官网内嵌 JSON 提取 |
| 签证信息 | 沿用前三轮人工整理的 39 城 `visaLabel` 快照（官方名/门槛/时长转录原文）；61 新城 `visaStatus = null`（未核实，界面标「待核实」） | 编辑性快照，不构成法律建议 | 无新增抓取 |

**许可合规**：GeoNames / Open-Meteo（CC BY 4.0）与 EF EPI 来源已在首页页脚与报告页脚注署名；Numbeo 指数为公开榜单口径转录并全程标注「NYC=100」。产品不转载任何来源的原始数据库文件。

## 二、选城与大洲口径

- **100 城 = 39 旧城（保留） + 61 新城**；分布：欧洲 33 / 亚洲 30 / 非洲 10 / 北美洲 11 / 南美洲 9 / 大洋洲 7。
- 大洲与次区域：六洲产品口径（UN M49 为基础；土耳其、格鲁吉亚按既有产品归类计入欧洲）；次区域 key 列表与中文标签见 `src/data/regions.ts`。
- 城市规模序数（size 1-5）按 GeoNames 人口派生：>1000 万→5 / >300 万→4 / >100 万→3 / >30 万→2 / 其余→1。

## 三、派生规则（不新增事实）

- **新城综合月成本**：39 旧城存在 (costIndex → monthlyCostUSD) 配对，最小二乘拟合 `monthlyCostUSD ≈ 39.9 × costIndex − 135.5`；新城 `cost = [round(0.85m), round(1.2m)]`。属估算，仅用于排序与量级参考。
- **新城 english（1-5 序数）**：由 EF EPI band 映射（very high→5 / high→4 / moderate→3 / low→2 / very low→1）。
- **新城 climate**：`climateDetail.avgTempC`（10 年均值，1 位小数）。
- **签证三档**：旧城由 `digitalNomadVisa` + `visaLabel` 推导（official=true / none=false / alternative=其余有描述者）；官方名从括号原文或关键词（签证/居留/准证/许可/白卡/DTV）提取。
- **新城 tags**：编辑性兴趣场景标注（与 39 旧城同池），非统计数据。

## 四、缺失数据约定（降权不惩罚）

- 任何城市缺某维数据 → 该字段 `null`，界面显示「—」并隐藏对应条目。
- 引擎侧：维度 null 时从偏好加权分子/分母中剔除（类级同理），三大类权重 30/48/22 不变；`verify-data-v2.ts` 第 7 节验证降权生效。
- 新城 `traits / visaScore / community / pace / internetMbps / digitalNomadVisa` 均为 null，直到人工核实后回填。

## 五、再生成流程（全量重跑）

```bash
# 1. 选城底座（61 新城 + GeoNames 匹配）
node scripts/pipeline/selection.mjs
# 2. Numbeo 指数 + 成本明细（限速友好，支持增量）
node scripts/pipeline/fetch-numbeo.mjs
node scripts/pipeline/fetch-numbeo.mjs --details
# 3. Open-Meteo 气候（增量；可传 selection-old.json 补旧城）
node scripts/pipeline/fetch-climate.mjs
node scripts/pipeline/fetch-climate.mjs /tmp/pipeline/selection-old.json
# 4. EF EPI
node scripts/pipeline/fetch-efepi.mjs
# 5. 装配 6 大洲 JSON（拟合 / region 拆分 / 旧城富化）
node scripts/pipeline/assemble.mjs
# 6. 校验
pnpm tsx scripts/verify-data-v2.ts
```

## 六、第五轮：标准版题库出处（IPIP-NEO 120）

- **标准版人格题库**：IPIP-NEO 120 结构（30 facets × 4 题，五点量表，+keyed / -keyed 各半），条目译自 **IPIP（International Personality Item Pool，Goldberg, 1999）公有领域题库**（ipip.ori.org），量表结构参照 Johnson (2014) 的 IPIP-NEO-120 版式；中文译文为本产品自译（每题附 `ref` 英文原句便于回溯核对）。IPIP 声明：该题库属公有领域，可自由复制、编辑、翻译与商用，无需署名（但仍建议注明出处）。
- **Big Five → 16 型映射**：McCrae & Costa (1989) 经典对应——E/I←Extraversion、S/N←Openness（高开放→N）、T/F←Agreeableness（高宜人→F）、J/P←Conscientiousness（高尽责→J）；Neuroticism 无对应轴，作为独立补充维度展示（海外定居压力适应参考）。
- **计分**：IPIP 官方标准——+keyed 题计 1-5 原值、-keyed 题计 5-1，facet 内平均 → (mean−1)/4×100 百分位；域百分位 = 6 facets 均值；四轴字母按对应域 50 分位分界（≥50 归 E/N/F/J）。
- 上述出处已在标准版报告页映射说明卡与本页一并注明；简化版 OEJTS 题库出处见第一轮记录（CC BY-NC-SA 4.0，仅用于非商用场景）。

## 七、第六轮：国家级参考数据与硬约束口径

### 国家级数据源（`src/data/countries.json`，scripts/pipeline/fetch-country.mjs 产出，65 国全覆盖）

| 字段 | 来源 | 许可 / 口径 |
| --- | --- | --- |
| nameEn / iso3 / capital / population / gdpPerCapitaUSD | World Bank API（country 表 + SP.POP.TOTL / NY.GDP.PCAP.CD 最新可得年） | CC BY 4.0 |
| nameZh / languages / currency / currencyCode | 手工快照（ISO 4217 / 各国官方口径） | 事实性引用 |
| hdi | UNDP《人类发展报告 2023-24》手工转录 | 引用，仅事实参考 |
| cpi | Transparency International CPI 2023 手工转录 | 引用 |
| numbeoSafety / numbeoHealthcare / numbeoQol / numbeoPollution / numbeoClimate | Numbeo country rankings（quality-of-life/rankings_by_country.jsp） | NYC=100 口径，引用 |
| taxTopRatePct | 手工快照（最高边际个税率，不含地方附加与社保） | 仅事实参考非税务建议 |
| visaOverview | 手工快照（各国移民局公开信息概述） | 以官方为准 |
| **gpi / internetMbpsFixed** | **全 null——visionofhumanity 与 Speedtest Global Index 采集时源站不可达，留待补录** | — |

- 逐字段来源标注在每国 `sources` 对象内；TW（World Bank 无 TWN 条目）仅手工快照基本字段，其余 null。
- **参考信息层定位**：国家级数据一律不进引擎加权（30/48/22 与 11 维零改动），仅供报告页国家概况卡、对比页国家级行与城市详情弹层展示。

### 硬约束层口径（`src/lib/constraints.ts`，引擎打分前的一票否决过滤）

- 汇率：CNY→USD 固定近似汇率 `CNY_USD_RATE = 7.2`（仅预算上限换算用）。
- 放宽：严格过滤后保留 < `RELAX_MIN_KEEP`（5）城时，「超上限但差距 < `OVER_BUDGET_BAND`（15%）」的城回填，match 扣 `OVER_BUDGET_PENALTY`（3）并标注「超预算」；回填者仍需通过签证/安全检查（两阶段过滤）。
- 排除语义：签证/安全数据 null 视作「无法核验」排除（带可解释 reason），与引擎降权不惩罚原则互补——硬约束是底线而非打分。
- 埋点：纯前端 localStorage 计数（`nomadmatch.v1:funnel`），不采集 PII。

## 八、第七轮：GPI / 网速手工快照补录（`scripts/pipeline/snapshot-gpispeed.mjs`）

| 字段 | 来源 | 许可 / 口径 |
| --- | --- | --- |
| gpi（score + rank） | IEP Global Peace Index 2024（163 国/地区榜单） | 引用；**公开报道整理的手工快照，近似参考值，以 IEP 原报告为准**（score 1-5 越低越和平，rank 为全球排名） |
| internetMbpsFixed | Ookla Speedtest Global Index（国家级中位数 · 固定宽带下行 Mbps） | 引用；**公开榜单手工快照（2025 年内），近似参考值，以 Ookla 口径为准** |

- 覆盖：GPI 62/65（HK/PR/FJ 为「榜单不含地区」，显式 null 并在 `sources.gpi` 注明原因）；网速 65/65。
- 快照脚本幂等可重跑：`node scripts/pipeline/snapshot-gpispeed.mjs`（直接读写 `src/data/countries.json`，仅回填 `gpi` / `internetMbpsFixed` 两字段与对应 sources，不动其他字段）。
- 断言：`verify-country-v3` 已更新——GPI 覆盖率 ≥90%（除豁免地区）、网速覆盖率 ≥90%、取值合理性（GPI 1-5 / 1-163 名、网速 5-500 Mbps）、来源标注口径检查。
- 参考信息层定位不变：两字段均不进引擎加权。

## 九、第八轮：RIASEC 兴趣题库 + IPIP 风险偏好自陈（`src/data/riasec.ts` / `src/data/riskTaking.ts`）

| 数据 | 来源 | 使用方式与声明 |
| --- | --- | --- |
| RIASEC 30 题 | O*NET Interest Profiler Short Form（美国劳工部 / O*NET Resource Center，**Public Domain**） | 题面按官方六维主题（每维 5 题）手工整理：中文题干为自译改写，`ref` 字段保留对应官方 activity 英文短语；5 级喜好量表（Strongly dislike → Strongly like）。引用：O*NET Interest Profiler Short Form, National Center for O*NET Development（onetcenter.org）。六维得分（5-25/维）仅用于标签权重强化与报告画像，不进引擎 30/48/22 加权 |
| IPIP Risk-Taking 10 题 | IPIP 国际人格项目池语句池（ipip.ori.org，**Public Domain**，Goldberg, 1999） | 精选 10 条高区分度语句（6 正向 + 4 反向，`keyed` 字段标注计分方向）：中文题干为自译改写，`ref` 保留 IPIP 英文原句；5 点符合度量表（复用 quiz.ipip.1-5 文案）。产出 0-100 冒险意愿指数，仅作报告画像展示，不影响城市排序 |
| RIASEC → 标签映射 | 自研常量 `src/data/riasecMap.ts` | 六维 → 28 兴趣标签池的映射表（可调常量）；强化机制 = 有界叠加：RIASEC 高分维（百分位 ≥60）给映射标签 +1 次重复权重，与「子项双倍」叠加后封顶 2 次重复（×3），避免权重爆炸 |

- 两量表均为公有领域，产品内展示位置：测评兴趣阶段第二小节（RIASEC）与标准版偏好阶段末尾（Risk-Taking），题面均在来源脚注标注出处。
- 断言：`scripts/verify-onet-v5.ts`（30 题每维 5 题 / 计分与 top2 组合单测 / 映射标签必须存在于 28 标签池 / 反向题计分 / 双语键完整 / 引擎加权联动冒烟）。
