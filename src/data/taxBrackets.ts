// ABOUTME: 分级税率（累进税制）数据集——多国算税沙盒的事实源（V2）。
// 设计原则（对应用户要求）：
// - 不依赖任何第三方付费聚合 API；税法条文与税率数字属公开事实，不涉版权，可自由商用；
// - 数据从权威公共来源提炼：各国税务机关官网（IRD/AADE/IRAS/Porezna uprava/Agenzia delle Entrate/
//   Revenue Service of Georgia/MDEC-LHDN）与 PwC Worldwide Tax Summaries（公开指南）；
// - 标准 JSON 结构：币种 currency / 起征点 standardDeduction / 分级税率 brackets / 特惠税制 regimes；
// - 覆盖数字游民与远程工作者热门目的地（冷启动 Top 20+），其余国家由 taxRules.ts 粗颗粒兜底。
// 免责：本表为方向性估算用的事实快照（含汇率为近似值），不构成税务建议；实际税负受居留身份、
// 抵扣、税收协定、社保与申报义务影响，决策前务必核实官方口径。
//
// FX 口径：TAX_FX_ASOF 为汇率快照月份；usdRate = 1 单位本币折合美元（近似值，仅用于展示换算）。

export type SpecialKind = 'flat' | 'exempt' | 'relief';

/** 累进级距（以本币年应纳税所得额为口径；upTo 为 null 表示最高档不封顶） */
export interface Bracket {
  /** 该档上限（本币，年） */
  upTo: number | null;
  /** 该档边际税率（%） */
  ratePct: number;
}

/** 特惠税制（数字游民/新居民/专项人才适用；可开关） */
export interface SpecialRegime {
  id: string;
  kind: SpecialKind;
  /** flat：统一税率；relief：税负减免比例；exempt：免税（为 null） */
  ratePct: number | null;
  /** 仅 flat：享受优惠的本币所得上限；超出部分回归标准最高档 */
  capLocal: number | null;
  label: string;
  labelEn: string;
  note: string;
  noteEn: string;
  /** 公开来源（税务局/公开指南） */
  source: string;
  /** 适用的收入性质；缺省表示三类性质均适用 */
  natures?: Array<'employee' | 'freelance' | 'founder'>;
}

export interface CountryTaxProfile {
  code: string;
  /** ISO 4217 币种 */
  currency: string;
  /** 1 单位本币 = ? 美元（近似汇率快照） */
  usdRate: number;
  /** 起征点 / 标准扣除额（本币，年） */
  standardDeduction: number;
  /** 累进级距（本币，年应纳税所得额口径） */
  brackets: Bracket[];
  /** 特惠税制（可能为空） */
  regimes: SpecialRegime[];
  /** 口径备注（本地附加税/特例等） */
  note: string;
  noteEn: string;
  sources: string[];
}

/** 汇率快照月份（近似值，仅用于展示换算） */
export const TAX_FX_ASOF = '2025-10';

const b = (upTo: number | null, ratePct: number): Bracket => ({ upTo, ratePct });

export const TAX_BRACKETS: Record<string, CountryTaxProfile> = {
  // 泰国 · Thailand (THB, 年)
  TH: {
    code: 'TH', currency: 'THB', usdRate: 0.02778, standardDeduction: 0,
    brackets: [b(150000, 0), b(300000, 5), b(500000, 10), b(750000, 15), b(1000000, 20), b(2000000, 25), b(5000000, 30), b(null, 35)],
    regimes: [{
      id: 'ltr', kind: 'flat', ratePct: 17, capLocal: null,
      label: '泰国 LTR 长期居留（高技能）', labelEn: 'Thailand LTR (highly-skilled)',
      note: 'LTR 高技能类别下，泰国来源雇佣所得按 17% 统一税率，替代最高 35% 的累进税率。',
      noteEn: 'Under the LTR highly-skilled category, Thai employment income is taxed at a flat 17% instead of the progressive scale up to 35%.',
      source: 'BOI ltr.boi.go.th · PwC Worldwide Tax Summaries (Thailand)',
      natures: ['employee'],
    }],
    note: '前 15 万泰铢免税；另有 2024 年起境外收入汇入规则需留意。',
    noteEn: 'First THB 150,000 is exempt; mind the 2024 remittance rules for foreign income.',
    sources: ['Revenue Department (rd.go.th)', 'PwC Worldwide Tax Summaries (Thailand)'],
  },

  // 格鲁吉亚 · Georgia (GEL, 年)
  GE: {
    code: 'GE', currency: 'GEL', usdRate: 0.3704, standardDeduction: 0,
    brackets: [b(null, 20)],
    regimes: [{
      id: 'sb', kind: 'flat', ratePct: 1, capLocal: 500000,
      label: '格鲁吉亚小企业地位（1%）', labelEn: 'Georgia small-business status (1%)',
      note: '年营业额不超过 50 万 GEL 的个体经营者可按小企业地位对营业额缴纳 1% 税（按收入而非利润计）。超出上限则回归常规规则。',
      noteEn: 'Individual entrepreneurs with turnover under GEL 500,000 may pay 1% on turnover under small-business status (levied on revenue, not profit). Above the cap, standard rules apply.',
      source: 'Revenue Service of Georgia (rs.ge) · PwC Worldwide Tax Summaries (Georgia)',
      natures: ['freelance', 'founder'],
    }],
    note: '标准个人所得为 20% 单一税率；境外来源收入通常不课税。',
    noteEn: 'Standard personal income is a flat 20%; foreign-source income is generally untaxed.',
    sources: ['Revenue Service of Georgia (rs.ge)', 'PwC Worldwide Tax Summaries (Georgia)'],
  },

  // 西班牙 · Spain (EUR, 年；国家档 + 参考大区档)
  ES: {
    code: 'ES', currency: 'EUR', usdRate: 1.08, standardDeduction: 0,
    brackets: [b(12450, 19), b(20200, 24), b(35200, 30), b(60000, 37), b(300000, 45), b(null, 47)],
    regimes: [{
      id: 'beckham', kind: 'flat', ratePct: 24, capLocal: 600000,
      label: '西班牙贝克汉姆法案', labelEn: 'Spain “Beckham law”',
      note: '符合条件的新税务居民，其西班牙来源所得按 24% 统一税率课税（上限约 60 万欧元；超出部分按 47%）。',
      noteEn: 'Eligible new tax residents pay a flat 24% on Spanish-source income up to EUR 600,000 (47% above the cap).',
      source: 'PwC Worldwide Tax Summaries (Spain) · Agencia Tributaria',
    }],
    note: '国家档叠加各大区档，实际税率因大区而异（此处为参考综合口径）。',
    noteEn: 'The national scale is topped up by regional scales; the effective rate varies by region (this is a reference blended view).',
    sources: ['PwC Worldwide Tax Summaries (Spain)', 'Agencia Tributaria (sede.agenciatributaria.gob.es)'],
  },

  // 葡萄牙 · Portugal (EUR, 年)
  PT: {
    code: 'PT', currency: 'EUR', usdRate: 1.08, standardDeduction: 0,
    brackets: [b(7703, 13), b(11623, 16.5), b(16472, 22), b(21321, 25), b(27146, 32), b(39791, 35.5), b(51997, 43.5), b(81199, 45), b(null, 48)],
    regimes: [{
      id: 'ifici', kind: 'flat', ratePct: 20, capLocal: null,
      label: '葡萄牙 IFICI（NHR 2.0）', labelEn: 'Portugal IFICI (NHR 2.0)',
      note: '符合条件的科研、科技与创新人才及初创创始人，可享 20% 统一税率，有效期最长 10 年。',
      noteEn: 'Qualifying research, tech and innovation talent and startup founders get a flat 20% rate for up to 10 years.',
      source: 'PwC Worldwide Tax Summaries (Portugal) · Portal das Finanças',
    }],
    note: '年收入超过约 8 万欧元另征 2.5%–5% 团结附加税（此处未单列）。',
    noteEn: 'A solidarity surcharge of 2.5%–5% applies above roughly EUR 80,000 (not itemised here).',
    sources: ['PwC Worldwide Tax Summaries (Portugal)', 'Portal das Finanças (portaldasfinancas.gov.pt)'],
  },

  // 阿联酋 · United Arab Emirates (AED, 年)
  AE: {
    code: 'AE', currency: 'AED', usdRate: 0.2723, standardDeduction: 0,
    brackets: [b(null, 0)],
    regimes: [],
    note: '对个人工资与经营所得不征个人所得税（仅个别酋长国对特定企业情形征税）。',
    noteEn: 'No personal income tax on salaries or business income (only some emirates tax specific corporate cases).',
    sources: ['UAE Ministry of Finance (mof.gov.ae)'],
  },

  // 马来西亚 · Malaysia (MYR, 年)
  MY: {
    code: 'MY', currency: 'MYR', usdRate: 0.2247, standardDeduction: 0,
    brackets: [b(5000, 0), b(20000, 1), b(35000, 3), b(50000, 6), b(70000, 11), b(100000, 19), b(400000, 25), b(600000, 26), b(2000000, 28), b(null, 30)],
    regimes: [{
      id: 'derantau', kind: 'exempt', ratePct: null, capLocal: null,
      label: '马来西亚 DE Rantau 境外收入豁免', labelEn: 'Malaysia DE Rantau foreign-income exemption',
      note: 'DE Rantau 通行证持有人，其在马来西亚收取的境外来源收入于 2022-01-01 至 2026-12-31 期间免征个人所得税。',
      noteEn: 'DE Rantau pass holders are exempt from personal income tax on foreign-sourced income received in Malaysia from 1 Jan 2022 to 31 Dec 2026.',
      source: 'MDEC · LHDN (hasil.gov.my)',
    }],
    note: '本地来源所得适用 0%–30% 累进税率。',
    noteEn: 'Locally sourced income faces progressive rates of 0%–30%.',
    sources: ['LHDN / IRB (hasil.gov.my)', 'PwC Worldwide Tax Summaries (Malaysia)'],
  },

  // 印度尼西亚 · Indonesia (IDR, 年)
  ID: {
    code: 'ID', currency: 'IDR', usdRate: 0.0000625, standardDeduction: 54000000,
    brackets: [b(60000000, 5), b(250000000, 15), b(500000000, 25), b(5000000000, 30), b(null, 35)],
    regimes: [],
    note: '起征点为单身 PTKP 54,000,000 印尼盾/年；已婚另有附加扣除。',
    noteEn: 'Threshold uses the single PTKP of IDR 54,000,000/year; married status adds further deductions.',
    sources: ['Direktorat Jenderal Pajak (pajak.go.id)', 'PwC Worldwide Tax Summaries (Indonesia)'],
  },

  // 日本 · Japan (JPY, 年；国税口径)
  JP: {
    code: 'JP', currency: 'JPY', usdRate: 0.006667, standardDeduction: 480000,
    brackets: [b(1950000, 5), b(3300000, 10), b(6950000, 20), b(9000000, 23), b(18000000, 33), b(40000000, 40), b(null, 45)],
    regimes: [],
    note: '此处为国税口径；另需缴纳约 10% 的地方居民税，实际综合税率更高。',
    noteEn: 'This is the national tax scale; a further ~10% local inhabitant tax applies, raising the combined effective rate.',
    sources: ['National Tax Agency (nta.go.jp)', 'PwC Worldwide Tax Summaries (Japan)'],
  },

  // 克罗地亚 · Croatia (EUR, 年)
  HR: {
    code: 'HR', currency: 'EUR', usdRate: 1.08, standardDeduction: 0,
    brackets: [b(60000, 20), b(null, 30)],
    regimes: [{
      id: 'nomad', kind: 'exempt', ratePct: null, capLocal: null,
      label: '克罗地亚数字游民免税', labelEn: 'Croatia digital-nomad exemption',
      note: '持数字游民居留许可者，其境外来源的劳务所得在许可期内（最长 18 个月）免征个人所得税；本地劳务仍需课税。',
      noteEn: 'Digital-nomad permit holders are exempt from personal income tax on foreign-source earned income for the permit period (up to 18 months); local work remains taxable.',
      source: 'Porezna uprava (porezna-uprava.gov.hr)',
    }],
    note: '档位税率由地方政府在区间内确定（低档 15%–23%、高档 25%–33%），此处取中值参考。',
    noteEn: 'Bracket rates are set by local governments within ranges (lower 15%–23%, higher 25%–33%); midpoints shown here.',
    sources: ['Porezna uprava (porezna-uprava.gov.hr)', 'PwC Worldwide Tax Summaries (Croatia)'],
  },

  // 希腊 · Greece (EUR, 年；雇佣与经营所得)
  GR: {
    code: 'GR', currency: 'EUR', usdRate: 1.08, standardDeduction: 0,
    brackets: [b(10000, 9), b(20000, 22), b(30000, 28), b(40000, 36), b(null, 44)],
    regimes: [{
      id: 'art5c', kind: 'relief', ratePct: 50, capLocal: null,
      label: '希腊 5C 条款 50% 减免', labelEn: 'Greece Art. 5C — 50% relief',
      note: '移居希腊的新税务居民，其希腊来源雇佣/经营所得可享 50% 个人所得税减免，最长 7 年。',
      noteEn: 'New tax residents may obtain a 50% personal income tax relief on Greek-source employment/business income for up to 7 years.',
      source: 'AADE (aade.gr) · PwC Worldwide Tax Summaries (Greece)',
    }],
    note: '雇佣与养老金所得另有税额抵减（无子女约 777 欧元）；此处未单列。',
    noteEn: 'Employment and pension income receive further tax credits (about EUR 777 with no dependants); not itemised here.',
    sources: ['AADE (aade.gr)', 'PwC Worldwide Tax Summaries (Greece)'],
  },

  // 意大利 · Italy (EUR, 年)
  IT: {
    code: 'IT', currency: 'EUR', usdRate: 1.08, standardDeduction: 0,
    brackets: [b(28000, 23), b(50000, 35), b(null, 43)],
    regimes: [{
      id: 'impatriate', kind: 'flat', ratePct: 15, capLocal: null,
      label: '意大利归国人才优惠', labelEn: 'Italy impatriate regime',
      note: '符合条件的迁入工作者，其意大利来源所得按 15% 统一税率课税（南部等特定情形为 5%）。',
      noteEn: 'Qualifying inbound workers pay a flat 15% on Italian-source income (5% in certain southern cases).',
      source: 'Agenzia delle Entrate (agenziaentrate.gov.it) · PwC Worldwide Tax Summaries (Italy)',
    }],
    note: '另需缴纳各大区/市地方附加税（约 1.2%–3.3%）；此处未单列。',
    noteEn: 'Regional and municipal surtaxes (about 1.2%–3.3%) also apply; not itemised here.',
    sources: ['Agenzia delle Entrate (agenziaentrate.gov.it)', 'PwC Worldwide Tax Summaries (Italy)'],
  },

  // 马耳他 · Malta (EUR, 年，单身)
  MT: {
    code: 'MT', currency: 'EUR', usdRate: 1.08, standardDeduction: 0,
    brackets: [b(12000, 0), b(16000, 15), b(60000, 25), b(null, 35)],
    regimes: [],
    note: '单身纳税人档位；已婚与父母档位不同，最高 35%。',
    noteEn: 'Single-person rates; married and parent rates differ, topping out at 35%.',
    sources: ['Commissioner for Revenue (mtca.gov.mt)', 'PwC Worldwide Tax Summaries (Malta)'],
  },

  // 墨西哥 · Mexico (MXN, 年)
  MX: {
    code: 'MX', currency: 'MXN', usdRate: 0.05405, standardDeduction: 0,
    brackets: [b(8947.8, 1.92), b(75984.55, 6.4), b(133536.07, 10.88), b(155229.8, 16), b(185852.57, 17.92), b(374837.88, 21.36), b(590795.99, 23.52), b(1127926.8, 30), b(1504935.98, 32), b(4514801.99, 34), b(null, 35)],
    regimes: [],
    note: 'ISR 年度税率表；另有雇员劳动补贴等抵扣未单列。',
    noteEn: 'Annual ISR tariff; employment subsidies and other deductions not itemised.',
    sources: ['SAT (sat.gob.mx)', 'PwC Worldwide Tax Summaries (Mexico)'],
  },

  // 哥伦比亚 · Colombia (COP, 年；UVT 口径)
  CO: {
    code: 'CO', currency: 'COP', usdRate: 0.0002439, standardDeduction: 54280910,
    brackets: [b(84658300, 19), b(204175900, 28), b(431757330, 33), b(944687030, 35), b(1543769000, 37), b(null, 39)],
    regimes: [],
    note: '起征点约为 1,090 UVT（UVT 为按年调整的税收单位，此处按 2025 参考值折算）。',
    noteEn: 'Threshold is about 1,090 UVT (a tax unit indexed annually; converted at a 2025 reference value).',
    sources: ['DIAN (dian.gov.co)', 'PwC Worldwide Tax Summaries (Colombia)'],
  },

  // 越南 · Viet Nam (VND, 年)
  VN: {
    code: 'VN', currency: 'VND', usdRate: 0.00003937, standardDeduction: 132000000,
    brackets: [b(60000000, 5), b(120000000, 10), b(216000000, 15), b(384000000, 20), b(624000000, 25), b(960000000, 30), b(null, 35)],
    regimes: [],
    note: '起征点为个人减免 1100 万越南盾/月（约合 1.32 亿/年）；受抚养人另有扣除。',
    noteEn: 'Threshold is the personal relief of VND 11m/month (about VND 132m/year); dependant relief is additional.',
    sources: ['General Department of Taxation (gdt.gov.vn)', 'PwC Worldwide Tax Summaries (Vietnam)'],
  },

  // 土耳其 · Turkiye (TRY, 年；雇佣所得)
  TR: {
    code: 'TR', currency: 'TRY', usdRate: 0.026316, standardDeduction: 0,
    brackets: [b(158000, 15), b(330000, 20), b(800000, 27), b(4300000, 35), b(null, 40)],
    regimes: [],
    note: '雇佣所得档位（2025 参考）；最低工资免征，且档位逐年上调。',
    noteEn: 'Employment-income bands (2025 reference); minimum wage is exempt and bands are raised yearly.',
    sources: ['Revenue Administration (gib.gov.tr)', 'PwC Worldwide Tax Summaries (Turkey)'],
  },

  // 捷克 · Czechia (CZK, 年)
  CZ: {
    code: 'CZ', currency: 'CZK', usdRate: 0.043478, standardDeduction: 0,
    brackets: [b(1762812, 15), b(null, 23)],
    regimes: [],
    note: '分档为 36 倍月均工资；另有每人每年约 30,840 捷克克朗的税收减免额未单列。',
    noteEn: 'Split is 36× the average monthly wage; a personal credit of about CZK 30,840/year is not itemised.',
    sources: ['Financial Administration (financnisprava.cz)', 'PwC Worldwide Tax Summaries (Czech Republic)'],
  },

  // 匈牙利 · Hungary (HUF, 年)
  HU: {
    code: 'HU', currency: 'HUF', usdRate: 0.0027778, standardDeduction: 0,
    brackets: [b(null, 15)],
    regimes: [],
    note: '个人所得为 15% 单一税率（多数所得类型）。',
    noteEn: 'A flat 15% personal income tax applies to most income types.',
    sources: ['NAV (nav.gov.hu)', 'PwC Worldwide Tax Summaries (Hungary)'],
  },

  // 罗马尼亚 · Romania (RON, 年)
  RO: {
    code: 'RO', currency: 'RON', usdRate: 0.217391, standardDeduction: 0,
    brackets: [b(null, 10)],
    regimes: [],
    note: '个人所得为 10% 单一税率；社保与医保为另行征收。',
    noteEn: 'A flat 10% personal income tax; social and health contributions are levied separately.',
    sources: ['ANAF (anaf.ro)', 'PwC Worldwide Tax Summaries (Romania)'],
  },

  // 爱沙尼亚 · Estonia (EUR, 年)
  EE: {
    code: 'EE', currency: 'EUR', usdRate: 1.08, standardDeduction: 7848,
    brackets: [b(null, 22)],
    regimes: [],
    note: '22% 单一税率；2025 年起基本免税额不随收入递减。',
    noteEn: 'A flat 22% rate; from 2025 the basic exemption no longer phases out with income.',
    sources: ['Estonian Tax and Customs Board (emta.ee)', 'PwC Worldwide Tax Summaries (Estonia)'],
  },

  // 塞尔维亚 · Serbia (RSD, 年)
  RS: {
    code: 'RS', currency: 'RSD', usdRate: 0.009259, standardDeduction: 410652,
    brackets: [b(5439096, 10), b(null, 25)],
    regimes: [],
    note: '基本税率 10%；年净收入超过约 6 倍年均工资部分另征 15% 附加税（合 25%）。',
    noteEn: 'Base rate 10%; net income above roughly 6× the average annual salary bears an extra 15% surtax (25% combined).',
    sources: ['Ministry of Finance (mfin.gov.rs)', 'PwC Worldwide Tax Summaries (Serbia)'],
  },

  // 亚美尼亚 · Armenia (AMD, 年)
  AM: {
    code: 'AM', currency: 'AMD', usdRate: 0.0025641, standardDeduction: 0,
    brackets: [b(null, 20)],
    regimes: [],
    note: '个人所得为 20% 单一税率（居民与非居民同）。',
    noteEn: 'A flat 20% personal income tax (same for residents and non-residents).',
    sources: ['State Revenue Committee (src.am)', 'PwC Worldwide Tax Summaries (Armenia)'],
  },

  // 新加坡 · Singapore (SGD, 年)
  SG: {
    code: 'SG', currency: 'SGD', usdRate: 0.746269, standardDeduction: 0,
    brackets: [b(20000, 0), b(30000, 2), b(40000, 3.5), b(80000, 7), b(120000, 11.5), b(160000, 15), b(200000, 18), b(240000, 19), b(280000, 19.5), b(320000, 20), b(500000, 22), b(1000000, 23), b(null, 24)],
    regimes: [{
      id: 'territorial', kind: 'exempt', ratePct: null, capLocal: null,
      label: '新加坡境外收入免税', labelEn: 'Singapore foreign-income exemption',
      note: '新加坡对来源于境外的个人收入一般不征税（汇回亦多有条件豁免）；本地来源所得适用累进税率。',
      noteEn: 'Singapore generally does not tax foreign-sourced personal income (with conditional exemptions on remittance); local income faces progressive rates.',
      source: 'IRAS (iras.gov.sg)',
    }],
    note: '无资本利得税与遗产税；本地所得适用 0%–24% 累进税率。',
    noteEn: 'No capital gains or inheritance tax; local income faces progressive rates of 0%–24%.',
    sources: ['IRAS (iras.gov.sg)', 'PwC Worldwide Tax Summaries (Singapore)'],
  },

  // 中国香港 · Hong Kong SAR (HKD, 年)
  HK: {
    code: 'HK', currency: 'HKD', usdRate: 0.128205, standardDeduction: 132000,
    brackets: [b(50000, 2), b(100000, 6), b(150000, 10), b(200000, 14), b(null, 17)],
    regimes: [{
      id: 'territorial', kind: 'exempt', ratePct: null, capLocal: null,
      label: '香港属地征税', labelEn: 'Hong Kong territorial basis',
      note: '香港按地域来源征税，境外来源所得通常不课税；本地受雇所得适用累进税率（另设标准税率上限）。',
      noteEn: 'Hong Kong taxes by source: foreign-sourced income is generally untaxed, while local employment income faces progressive rates (capped by a standard rate).',
      source: 'Inland Revenue Department (ird.gov.hk)',
    }],
    note: '标准扣除额为基本免税额；累进税率另受两级标准税率（15%/16%）封顶。',
    noteEn: 'Deduction is the basic allowance; the progressive scale is capped by a two-tier standard rate (15%/16%).',
    sources: ['Inland Revenue Department (ird.gov.hk)', 'PwC Worldwide Tax Summaries (Hong Kong SAR)'],
  },

  // 韩国 · Korea (KRW, 年；国税口径)
  KR: {
    code: 'KR', currency: 'KRW', usdRate: 0.00074074, standardDeduction: 1500000,
    brackets: [b(14000000, 6), b(50000000, 15), b(88000000, 24), b(150000000, 35), b(300000000, 38), b(500000000, 40), b(1000000000, 42), b(null, 45)],
    regimes: [],
    note: '此处为国税口径；另需缴纳约 10% 的地方所得税，实际综合税率更高。',
    noteEn: 'This is the national scale; a further ~10% local income tax applies, raising the combined rate.',
    sources: ['National Tax Service (nts.go.kr)', 'PwC Worldwide Tax Summaries (Korea)'],
  },

  // 中国台湾 · Taiwan (TWD, 年)
  TW: {
    code: 'TW', currency: 'TWD', usdRate: 0.03125, standardDeduction: 0,
    brackets: [b(590000, 5), b(1330000, 12), b(2660000, 20), b(4980000, 30), b(null, 40)],
    regimes: [],
    note: '另有免税额与标准扣除额（单身约 22.8 万新台币）未单列；境外所得有基本税额制度。',
    noteEn: 'Exemption and standard deduction (about TWD 228,000 single) are not itemised; foreign income is subject to a basic-tax (AMT) system.',
    sources: ['Ministry of Finance (mof.gov.tw)', 'PwC Worldwide Tax Summaries (Taiwan)'],
  },

  // 中国 · China (CNY, 年；综合所得)
  CN: {
    code: 'CN', currency: 'CNY', usdRate: 0.137931, standardDeduction: 60000,
    brackets: [b(36000, 3), b(144000, 10), b(300000, 20), b(420000, 25), b(660000, 30), b(960000, 35), b(null, 45)],
    regimes: [],
    note: '综合所得年度税率表；起征点为 6 万元/年的基本减除费用。',
    noteEn: 'Comprehensive-income annual scale; threshold is the CNY 60,000/year basic deduction.',
    sources: ['State Taxation Administration (chinatax.gov.cn)', 'PwC Worldwide Tax Summaries (China)'],
  },

  // 乌拉圭 · Uruguay (UYU, 年；BPC 口径)
  UY: {
    code: 'UY', currency: 'UYU', usdRate: 0.0238095, standardDeduction: 546000,
    brackets: [b(780000, 10), b(1170000, 15), b(2340000, 24), b(3900000, 25), b(5850000, 27), b(8775000, 31), b(null, 36)],
    regimes: [],
    note: '档位按 BPC（可调整计量单位）折算，此处按 2025 参考值近似；前 84 BPC 免征。',
    noteEn: 'Bands are expressed in BPC units (indexed) converted at a 2025 reference; the first 84 BPC are exempt.',
    sources: ['Dirección General Impositiva (gub.uy/dgi)', 'PwC Worldwide Tax Summaries (Uruguay)'],
  },

  // 柬埔寨 · Cambodia (KHR, 年；工资税)
  KH: {
    code: 'KH', currency: 'KHR', usdRate: 0.0002439, standardDeduction: 0,
    brackets: [b(18000000, 0), b(24000000, 5), b(102000000, 10), b(150000000, 15), b(null, 20)],
    regimes: [],
    note: '按月度工资税档位折算为年度口径；非居民适用 20% 单一税率。',
    noteEn: 'Monthly salary-tax bands annualised; non-residents face a flat 20% rate.',
    sources: ['General Department of Taxation (tax.gov.kh)', 'PwC Worldwide Tax Summaries (Cambodia)'],
  },
};

const TAX_BRACKET_BY_CODE = new Map<string, CountryTaxProfile>(Object.entries(TAX_BRACKETS));

/** 按国家代码取分级税率档案；未收录返回 null（回落 taxRules.ts 粗颗粒口径） */
export function taxProfileForCountry(code: string | null | undefined): CountryTaxProfile | null {
  if (!code) return null;
  return TAX_BRACKET_BY_CODE.get(code) ?? null;
}

/** 起征点（首个非 0% 档之前的免税额 + 标准扣除额；本币，年） */
export function thresholdLocal(profile: CountryTaxProfile): number {
  let sum = profile.standardDeduction;
  for (const band of profile.brackets) {
    if (band.ratePct === 0) sum = band.upTo ?? sum;
    else break;
  }
  return sum;
}
