# DATA.md — 栖居罗盘 · 数据口径说明

> 本文档仅描述数据字段含义、聚合与派生方法、更新频率与免责声明。
> 所有城市级与国家级统计指标均来自「官方开放数据（Open Data）与公开统计测算」，快照日期见各数据卡与字段来源标注；本站不转载任何来源的原始数据库文件。

## 一、城市级字段口径（`src/data/cities/*.json`，240 城 / 六洲）

| 字段 | 含义 | 口径与聚合方法 |
| --- | --- | --- |
| lat / lng / population / timezone | 坐标、人口、IANA 时区 | GeoNames cities15000（CC BY 4.0） |
| climateDetail | 近 10 年（2015-2024）日均温 / 降水 / 日照四指标 + 确定性简评 | Open-Meteo Historical（CC BY 4.0）十年均值，逐城逐年拉取 |
| monthlyCostUSD / cost | 月均综合生活成本（USD，含市中心一居室租金）与区间 | 公开统计测算综合生活指数的线性拟合（39 旧城配对最小二乘 `≈39.9x−135.5`），区间 ±15/20%；属估算，仅用于排序与量级参考 |
| livingScore | 综合生活指数（NYC = 100 基准，0-100+） | 公开统计测算榜单口径转录；自研 0-100 加权评分的方法论见站内「方法论」页 |
| housingLevel | 住房成本水平：市中心一居室月租基准（USD） | 公开统计测算城市详情转录；无详情页的城为 null（不编造） |
| mealUSD | 单餐参考价（USD） | 仅内部数据参考，**UI 不展示**（避免微观单品价格呈现） |
| safety / healthcareIndex / pollutionIndex / trafficIndex / purchasingPowerIndex / climateIndex | 生活质量六指数（NYC = 100 基准） | 公开统计测算榜单口径转录 |
| airQuality | PM2.5 年均浓度 + WHO 2021 指南分档（good/fair/moderate/poor） | Open-Meteo Air Quality（CAMS，CC BY 4.0）2022-08 ~ 2024-12 全期均值；分档 good ≤10 / fair ≤15 / moderate ≤25 / poor >25 |
| englishBand / englishScore | 国家级英语普及度分级 / 分数（映射到城市） | 公开英语能力排名发布数据，band 五档（very high → very low） |
| size | 城市规模序数（1-5） | 由 GeoNames 人口派生：>1000 万→5 / >300 万→4 / >100 万→3 / >30 万→2 / 其余→1 |
| visaStatus / visaLabel / visaDetail | 签证三档与人工快照 | 编辑性快照（官方名/门槛/时长转录原文）；新城 null = 待核实，界面标「待核实」 |

## 二、国家级字段口径（`src/data/countries.json`，65 国）

| 字段 | 含义 | 口径 |
| --- | --- | --- |
| population / gdpPerCapitaUSD | 总人口 / 人均 GDP | World Bank API（CC BY 4.0），最新可得年 |
| nameZh / languages / currency / currencyCode / taxTopRatePct / visaOverview | 基本信息与实务快照 | 手工快照（ISO 4217 / 各国官方公开信息概述），以官方为准 |
| hdi | 人类发展指数 | UNDP《人类发展报告 2023-24》转录 |
| cpi | 腐败感知指数 | Transparency International CPI 2023 转录 |
| safetyScore / healthcareScore / qolScore / pollutionScore / climateScore | 国家级公开统计指数（NYC = 100 口径） | 公开统计测算榜单转录 |
| gpi | 全球和平指数（score 1-5 越低越和平 + rank） | 公开报道整理的手工快照（IEP 2024 榜单，62/65；HK/PR/FJ 榜单不含地区显式 null），近似参考值 |
| internetMbpsFixed | 固定宽带中位数下行（Mbps） | 公开网速榜单手工快照（65/65），近似参考值 |
| visaPassport | 中国大陆普通护照入境待遇 + work/digitalNomad/longTerm 三维适用性快照 | 各国移民局公开信息手工快照（entry 四档：visaFree/visaOnArrival/eVisa/visaRequired）；**政策多变，出行前务必核实官方渠道** |
| longStay | 税居天数 / 中外社保协定 / 押金惯例 | 各国税务局与官方公开指引手工概括；字段级允许 null |

- 逐字段来源标注在每国 `sources` 对象内；TW 仅手工快照基本字段。
- **参考信息层定位**：国家级数据一律不进引擎加权，仅供国家概况卡、对比页国家级行与城市详情弹层展示。

## 三、缺失数据约定（降权不惩罚）

- 任何城市缺某维数据 → 该字段 `null`，界面显示「—」并隐藏对应条目。
- 引擎侧：维度 null 时从加权分子/分母中剔除（类级同理），分层权重不变；`verify-data-v2.ts` 验证降权生效。
- 新城 `traits / visaScore / community / pace / internetMbps / digitalNomadVisa` 为 null，直到人工核实后回填。

## 四、更新频率

- 气候：十年滚动窗口，年度重算。
- 成本与指数：榜单口径快照，不定期重转录；快照日期见数据卡。
- 空气质量：约两年半滚动窗口均值。
- 护照/签证/长居快照：手工维护，快照日期见字段 sources；政策多变以官方为准。

## 五、缺失值补全（只增不改）

第十一轮对既有 200 城的 `null` 字段做**只增不改**补全：已存在值一律保留（旧城/中间代口径不动），仅在能从公开统计榜单或城市详情页取到同口径数值时填充，取不到的**保持 null**（界面显示「—」，不编造）。

- 脚本：`scripts/pipeline/fetch-stat-jina.mjs`（榜单 + 城市详情抓取，走 r.jina.ai 读取代理绕过数据中心 IP 封锁）→ `scripts/pipeline/backfill-indices.mjs [--write]`（解析榜单/详情，写回 6 个 `src/data/cities/*.json`）。
- 取数优先级：`livingScore` ← 成本榜 col 列 → 生活质量榜 col 列 → 详情页「较纽约低 X%」反推；`safety` ← 生活质量榜 → `100 − 犯罪指数`；六指数 ← 生活质量榜对应列（`healthcareIndex`/`pollutionIndex` 退而取医疗/污染榜首列）；`housingLevel`/`mealUSD` ← 城市详情页一居室租金 / 一餐价（USD）。
- 结果：196 个字段由 null 补为数值（`housingLevel` 51 / `mealUSD` 52 / `purchasingPowerIndex` 44 / `safety` 20 / `pollutionIndex` 12 / `healthcareIndex` 9 / `livingScore` 6 / `trafficIndex` 1 / `climateIndex` 1）；仍为 null 的字段是因源站榜单/详情页确无该城条目（如部分亚洲、南美中小城）。

## 六、第十一轮扩容（方案A·质量优先，200 → 240 城）

在主库扩 40 座新城，全部满足「质量优先」双重准入：

- **国家库内**：40 城全部落在既有 65 国范围内（`CountryCard` 可关联，无需新增国家）。
- **双榜在列**：全部同时出现在公开统计「生活成本榜 ∩ 生活质量榜」，六指数 + `livingScore` 可取，无「孤城缺维」。
- **大洲分布**：欧洲 +19 / 亚洲 +11 / 北美 +6 / 南美 +4。

流程（与既有 selection→assemble 同口径，只增不改）：

- 选城：`scripts/pipeline/selection3.mjs`（GeoNames cities15000 匹配坐标/人口/时区，输出 `/tmp/pipeline/selection3.json`）。
- 气候：`node scripts/pipeline/fetch-climate.mjs /tmp/pipeline/selection3.json`（Open-Meteo，增量）。
- 成本明细：`node scripts/pipeline/fetch-stat-jina.mjs details <新 40 城 id>`（读取代理，USD 币种校验，拒绝 `Mex$`/`R$` 等本地币种页）。
- 结构装配：`node scripts/pipeline/assemble-v3.mjs`（追加结构字段，指数/价格留空）。
- 指数与价格：`node scripts/pipeline/backfill-indices.mjs --write`（与既有 200 城同优先级规则统一填充）。
- 成本区间：`node scripts/pipeline/fill-cost.mjs`（沿用 39 旧城最小二乘 `≈39.9x−135.5` 拟合 `monthlyCostUSD` 与 `cost`）。
- 空气质量：`node scripts/pipeline/snapshot-airquality.mjs`（增量，坐标源自 selection2/3）。

> 说明：`monthlyCostUSD`/`cost` 的值随拟合样本扩充重算，仅作用于**原先为 null 的城**（旧城已存值不动）；`-` 表示该城详情页非 USD 币种或无独立页，`housingLevel`/`mealUSD` 保持 null。

## 七、候选补充数据源（已调研，未接入）

为未来扩城或补维做过一轮公开数据源调研；下列源许可友好（CC BY / 开放），但或口径与现有 NYC=100 体系不兼容、或需人工映射，**本轮未接入**，仅备录：

- **WhereNext**（CC BY 4.0，约 380 城 / 95 国，基于 World Bank ICP 2021 价格水平）——可作成本维的独立交叉校验源。
- **OECD Regional Well-Being**（约 467 个大区）——区域级（非城市级）福祉指标，映射颗粒度较粗。
- **UN-Habitat Urban Indicators**（城市环境与生活质量数据集）——偏城市级环境/宜居指标，可补污染/绿色维度。
- **TomTom Traffic Index**（免费城市拥堵指数）——可作 `trafficIndex` 的补充或校验。

> 上述源的名称仅出现于本文档，未进入 `src/`、构建产物或站内任何页面。

## 八、再生成流程（全量重跑）

```bash
# 1. 选城底座（GeoNames 匹配）
node scripts/pipeline/selection.mjs
node scripts/pipeline/selection2.mjs
node scripts/pipeline/selection3.mjs
# 2. 公开统计指数 + 成本明细（限速友好，支持增量）
node scripts/pipeline/fetch-cost.mjs
node scripts/pipeline/fetch-cost.mjs --details
# 2b. 缺失字段补全（走读取代理；dry-run 去掉 --write）
node scripts/pipeline/fetch-stat-jina.mjs rankings
node scripts/pipeline/fetch-stat-jina.mjs details <cityId...>
node scripts/pipeline/backfill-indices.mjs --write
# 3. Open-Meteo 气候（增量）
node scripts/pipeline/fetch-climate.mjs
node scripts/pipeline/fetch-climate.mjs /tmp/pipeline/selection3.json
# 4. 公开英语能力排名
node scripts/pipeline/fetch-efepi.mjs
# 5. 装配 6 大洲 JSON（拟合 / region 拆分 / 旧城富化）
node scripts/pipeline/assemble.mjs
node scripts/pipeline/assemble-v2.mjs
node scripts/pipeline/assemble-v3.mjs
node scripts/pipeline/fill-cost.mjs
# 6. 国家级与快照回填
node scripts/pipeline/fetch-country.mjs
node scripts/pipeline/snapshot-gpispeed.mjs
node scripts/pipeline/snapshot-passport.mjs
node scripts/pipeline/snapshot-airquality.mjs
# 7. 校验
pnpm tsx scripts/verify-data-v2.ts
pnpm tsx scripts/verify-country-v3.ts
```

> 注：`verify-data-v2.ts` 强制比对的两份中间产物 `climate.json` / `selection2.json` 位于 `/tmp/pipeline/`（会话级，不在版本库）；如缺失需先跑第 1、3 步再生成。

## 九、题库出处（仅保留许可要求的低调署名）

- 简易版人格问卷：OEJTS 1.2 结构，CC BY-NC-SA 4.0（署名保留于站内方法论页）。
- 标准版人格题库：IPIP（International Personality Item Pool，Goldberg, 1999）公有领域，可自由复制、编辑、翻译与商用。
- 职业兴趣框架：O*NET Interest Profiler Short Form，CC BY 4.0（署名保留于站内方法论页页底一行）。

## 十、免责声明

- 全站数据为公开来源快照，可能过时；仅供参考，不构成移民、签证、居留、法律、税务、医疗、保险、财务或投资建议。
- 重大决策前请咨询当地专业机构并核实官方渠道。
- 数据按「现状」（as-is）提供，用户自担使用风险。
