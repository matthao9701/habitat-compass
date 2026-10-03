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
