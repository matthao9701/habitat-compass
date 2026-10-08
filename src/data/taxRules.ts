// ABOUTME: tax_rules 规则字典（V1）——税负测算功能的唯一事实源。
// 设计依据网站实际情况：个人所得税制在「国家」层级（与 countries.json 的 taxTopRatePct /
// longStay.taxResidencyDays 同粒度），故规则表按 ISO 3166-1 alpha-2 国家代码索引，城市通过
// countryCode 解析到对应规则，不发明平行分类。
// 四类税制：exempt 无个税型 / territorial 属地征税型 / concession 专项优惠型 / standard 常规税制型。
// desc/descEn 为「决策向」一句话说明（非法条）；score 为税负友好度 0-100（越高越友好，确定性推导）。
// 免责：本表为方向性粗颗粒估算，不构成税务建议；实际税负取决于居留身份、税收协定与抵扣。

export type TaxRegimeType = 'exempt' | 'territorial' | 'concession' | 'standard';

/** 收入性质（影响有效税率推导的粗颗粒口径） */
export type IncomeNature = 'employee' | 'freelance' | 'founder';

export interface TaxRule {
  type: TaxRegimeType;
  /** 一句话说明（中文，决策向） */
  desc: string;
  /** 一句话说明（英文，与 desc 同义） */
  descEn: string;
  /** 税负友好度 0-100（越高越友好；exempt 95 / territorial 82 / concession 70 / standard 由最高边际税率推导） */
  score: number;
  /** 仅 concession 型：优惠制度下的近似综合有效税率（%）；其他类型为 null（由 type 推导） */
  effRatePct: number | null;
}

/** 欧美高税区参考有效税率（%），作为「多留存」对比基线；方向性口径，非税制事实 */
export const TAX_BASELINE_EFF_RATE = 40;

export const TAX_REGIME_TYPES: TaxRegimeType[] = ['exempt', 'territorial', 'concession', 'standard'];

export const TAX_RULES: Record<string, TaxRule> = {
  // 阿联酋 · United Arab Emirates
  AE: { type: 'exempt', score: 95, effRatePct: null,
    desc: '阿联酋对个人工资与经营所得不征个人所得税（仅个别酋长国对特定企业征收），是数字游民与创业者最直接的节税目的地。',
    descEn: 'The UAE levies no personal income tax on salaries or business income (only some emirates tax specific corporate cases) — the most direct tax-free destination for nomads and founders.' },
  // 中国香港 · Hong Kong SAR, China
  HK: { type: 'territorial', score: 82, effRatePct: null,
    desc: '香港按地域征税，只对源自香港的所得课税，境外收入通常不征税，最高薪俸税率约 17%。',
    descEn: 'Hong Kong taxes on a territorial basis: only Hong Kong-sourced income is taxed, foreign income is generally exempt, with a top salaries tax of about 17%.' },
  // 新加坡 · Singapore
  SG: { type: 'territorial', score: 82, effRatePct: null,
    desc: '新加坡对来源于境外的个人收入一般不征税，汇回亦有条件豁免，本地所得适用较低的累进税率。',
    descEn: 'Singapore generally does not tax foreign-sourced personal income, with conditional exemptions even when remitted; local income faces low progressive rates.' },
  // 马来西亚 · Malaysia
  MY: { type: 'territorial', score: 82, effRatePct: null,
    desc: '马来西亚对个人境外来源收入设有豁免，长期居留的境外远程收入通常可免税，本地所得税率中等。',
    descEn: 'Malaysia exempts foreign-sourced personal income, so long-stay remote income is often tax-free while local income faces moderate rates.' },
  // 泰国 · Thailand
  TH: { type: 'territorial', score: 82, effRatePct: null,
    desc: '泰国采用汇入制：同年度汇入泰国的境外收入征税，未汇入部分通常不课税，长期居留需关注 2024 年起的汇入新规。',
    descEn: 'Thailand uses a remittance basis: foreign income brought in during the same year is taxed, unremitted income generally is not — mind the 2024 remittance rule changes.' },
  // 格鲁吉亚 · Georgia
  GE: { type: 'territorial', score: 82, effRatePct: null,
    desc: '格鲁吉亚对个人境外来源收入基本免税，本地劳动收入税率很低，常被称为「高加索免税港」。',
    descEn: 'Georgia essentially exempts individuals’ foreign-source income and taxes local labour very lightly — the so-called Caucasus tax haven.' },
  // 柬埔寨 · Cambodia
  KH: { type: 'territorial', score: 82, effRatePct: null,
    desc: '柬埔寨对非居民的境外来源收入不征税，本地来源适用较低税率，实务中执行相对宽松。',
    descEn: 'Cambodia does not tax non-residents’ foreign-source income and applies low local rates, with lenient enforcement in practice.' },
  // 希腊 · Greece
  GR: { type: 'concession', score: 70, effRatePct: 22,
    desc: '希腊为符合条件的新税务居民提供 50% 个人所得税减免（数字游民签证适用），实际税率远低于其名义累进税率。',
    descEn: 'Greece offers a 50% personal income tax discount to qualifying new tax residents (digital-nomad visa), far below its nominal progressive rates.' },
  // 葡萄牙 · Portugal
  PT: { type: 'concession', score: 70, effRatePct: 20,
    desc: '葡萄牙为符合条件的科技与新居民提供 20% 统一税率的 IFICI 优惠制度，远低于其常规累进税率。',
    descEn: 'Portugal’s IFICI regime gives qualifying tech and new residents a flat 20% rate, well below its standard progressive scale.' },
  // 西班牙 · Spain
  ES: { type: 'concession', score: 70, effRatePct: 24,
    desc: '西班牙「贝克汉姆法案」允许符合条件的数字游民按 24% 统一税率（上限约 60 万欧元）纳税，替代常规累进税率。',
    descEn: 'Spain’s “Beckham law” lets eligible nomads pay a flat 24% (up to about EUR 600k) instead of the standard progressive rates.' },
  // 意大利 · Italy
  IT: { type: 'concession', score: 70, effRatePct: 15,
    desc: '意大利为迁入的新税务居民提供统一税率优惠（南意 5%／其他 15%；高净值 10 万欧元），而常规累进税率很高。',
    descEn: 'Italy offers flat-rate regimes for new tax residents (5% in the south / 15% elsewhere; EUR 100k for HNWIs) against very high standard rates.' },
  // 马耳他 · Malta
  MT: { type: 'concession', score: 70, effRatePct: 15,
    desc: '马耳他为数字游民居留者提供 15% 统一税率，低于其常规累进税率。',
    descEn: 'Malta offers digital-nomad permit holders a flat 15% rate, below its standard progressive scale.' },
  // 克罗地亚 · Croatia
  HR: { type: 'concession', score: 70, effRatePct: 0,
    desc: '克罗地亚对持数字游民居留者的境外来源收入免征个人所得税，仅本地劳务才需课税。',
    descEn: 'Croatia exempts digital-nomad permit holders from personal income tax on foreign-source income; only local work is taxed.' },
  // 波多黎各 · Puerto Rico (US)
  PR: { type: 'concession', score: 70, effRatePct: 4,
    desc: '波多黎各通过 Act 60 为符合条件的居民提供出口服务低税率（约 4%），显著低于美国本土税负。',
    descEn: 'Puerto Rico’s Act 60 gives qualifying residents a low export-services rate (about 4%), far below mainland US tax.' },
  // 亚美尼亚 · Armenia
  AM: { type: 'standard', score: 67, effRatePct: null,
    desc: '亚美尼亚对税务居民按全球所得征收个人所得税，最高边际个税率约 22%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Armenia taxes tax residents on worldwide income, with a top marginal rate of about 22%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 阿根廷 · Argentina
  AR: { type: 'standard', score: 56, effRatePct: null,
    desc: '阿根廷对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Argentina taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 奥地利 · Austria
  AT: { type: 'standard', score: 38, effRatePct: null,
    desc: '奥地利对税务居民按全球所得征收个人所得税，最高边际个税率约 55%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Austria taxes tax residents on worldwide income, with a top marginal rate of about 55%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 澳大利亚 · Australia
  AU: { type: 'standard', score: 46, effRatePct: null,
    desc: '澳大利亚对税务居民按全球所得征收个人所得税，最高边际个税率约 45%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Australia taxes tax residents on worldwide income, with a top marginal rate of about 45%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 巴西 · Brazil
  BR: { type: 'standard', score: 62, effRatePct: null,
    desc: '巴西对税务居民按全球所得征收个人所得税，最高边际个税率约 28%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Brazil taxes tax residents on worldwide income, with a top marginal rate of about 28%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 加拿大 · Canada
  CA: { type: 'standard', score: 39, effRatePct: null,
    desc: '加拿大对税务居民按全球所得征收个人所得税，最高边际个税率约 53%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Canada taxes tax residents on worldwide income, with a top marginal rate of about 53%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 瑞士 · Switzerland
  CH: { type: 'standard', score: 55, effRatePct: null,
    desc: '瑞士对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Switzerland taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 智利 · Chile
  CL: { type: 'standard', score: 55, effRatePct: null,
    desc: '智利对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Chile taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 中国 · China
  CN: { type: 'standard', score: 46, effRatePct: null,
    desc: '中国对税务居民按全球所得征收个人所得税，最高边际个税率约 45%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'China taxes tax residents on worldwide income, with a top marginal rate of about 45%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 哥伦比亚 · Colombia
  CO: { type: 'standard', score: 52, effRatePct: null,
    desc: '哥伦比亚对税务居民按全球所得征收个人所得税，最高边际个税率约 39%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Colombia taxes tax residents on worldwide income, with a top marginal rate of about 39%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 捷克 · Czechia
  CZ: { type: 'standard', score: 66, effRatePct: null,
    desc: '捷克对税务居民按全球所得征收个人所得税，最高边际个税率约 23%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Czechia taxes tax residents on worldwide income, with a top marginal rate of about 23%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 德国 · Germany
  DE: { type: 'standard', score: 46, effRatePct: null,
    desc: '德国对税务居民按全球所得征收个人所得税，最高边际个税率约 45%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Germany taxes tax residents on worldwide income, with a top marginal rate of about 45%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 丹麦 · Denmark
  DK: { type: 'standard', score: 55, effRatePct: null,
    desc: '丹麦对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Denmark taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 爱沙尼亚 · Estonia
  EE: { type: 'standard', score: 67, effRatePct: null,
    desc: '爱沙尼亚对税务居民按全球所得征收个人所得税，最高边际个税率约 22%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Estonia taxes tax residents on worldwide income, with a top marginal rate of about 22%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 埃及 · Egypt, Arab Rep.
  EG: { type: 'standard', score: 64, effRatePct: null,
    desc: '埃及对税务居民按全球所得征收个人所得税，最高边际个税率约 25%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Egypt, Arab Rep. taxes tax residents on worldwide income, with a top marginal rate of about 25%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 埃塞俄比亚 · Ethiopia
  ET: { type: 'standard', score: 56, effRatePct: null,
    desc: '埃塞俄比亚对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Ethiopia taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 芬兰 · Finland
  FI: { type: 'standard', score: 55, effRatePct: null,
    desc: '芬兰对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Finland taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 斐济 · Fiji
  FJ: { type: 'standard', score: 55, effRatePct: null,
    desc: '斐济对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Fiji taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 加纳 · Ghana
  GH: { type: 'standard', score: 56, effRatePct: null,
    desc: '加纳对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Ghana taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 匈牙利 · Hungary
  HU: { type: 'standard', score: 74, effRatePct: null,
    desc: '匈牙利对税务居民按全球所得征收个人所得税，最高边际个税率约 15%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Hungary taxes tax residents on worldwide income, with a top marginal rate of about 15%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 印度尼西亚 · Indonesia
  ID: { type: 'standard', score: 56, effRatePct: null,
    desc: '印度尼西亚对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Indonesia taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 以色列 · Israel
  IL: { type: 'standard', score: 42, effRatePct: null,
    desc: '以色列对税务居民按全球所得征收个人所得税，最高边际个税率约 50%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Israel taxes tax residents on worldwide income, with a top marginal rate of about 50%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 印度 · India
  IN: { type: 'standard', score: 60, effRatePct: null,
    desc: '印度对税务居民按全球所得征收个人所得税，最高边际个税率约 30%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'India taxes tax residents on worldwide income, with a top marginal rate of about 30%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 约旦 · Jordan
  JO: { type: 'standard', score: 60, effRatePct: null,
    desc: '约旦对税务居民按全球所得征收个人所得税，最高边际个税率约 30%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Jordan taxes tax residents on worldwide income, with a top marginal rate of about 30%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 日本 · Japan
  JP: { type: 'standard', score: 46, effRatePct: null,
    desc: '日本对税务居民按全球所得征收个人所得税，最高边际个税率约 45%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Japan taxes tax residents on worldwide income, with a top marginal rate of about 45%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 肯尼亚 · Kenya
  KE: { type: 'standard', score: 60, effRatePct: null,
    desc: '肯尼亚对税务居民按全球所得征收个人所得税，最高边际个税率约 30%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Kenya taxes tax residents on worldwide income, with a top marginal rate of about 30%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 韩国 · Korea, Rep.
  KR: { type: 'standard', score: 46, effRatePct: null,
    desc: '韩国对税务居民按全球所得征收个人所得税，最高边际个税率约 45%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Korea, Rep. taxes tax residents on worldwide income, with a top marginal rate of about 45%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 哈萨克斯坦 · Kazakhstan
  KZ: { type: 'standard', score: 76, effRatePct: null,
    desc: '哈萨克斯坦对税务居民按全球所得征收个人所得税，最高边际个税率约 10%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Kazakhstan taxes tax residents on worldwide income, with a top marginal rate of about 10%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 斯里兰卡 · Sri Lanka
  LK: { type: 'standard', score: 55, effRatePct: null,
    desc: '斯里兰卡对税务居民按全球所得征收个人所得税，最高边际个税率约 36%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Sri Lanka taxes tax residents on worldwide income, with a top marginal rate of about 36%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 立陶宛 · Lithuania
  LT: { type: 'standard', score: 58, effRatePct: null,
    desc: '立陶宛对税务居民按全球所得征收个人所得税，最高边际个税率约 32%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Lithuania taxes tax residents on worldwide income, with a top marginal rate of about 32%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 拉脱维亚 · Latvia
  LV: { type: 'standard', score: 59, effRatePct: null,
    desc: '拉脱维亚对税务居民按全球所得征收个人所得税，最高边际个税率约 31%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Latvia taxes tax residents on worldwide income, with a top marginal rate of about 31%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 摩洛哥 · Morocco
  MA: { type: 'standard', score: 54, effRatePct: null,
    desc: '摩洛哥对税务居民按全球所得征收个人所得税，最高边际个税率约 37%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Morocco taxes tax residents on worldwide income, with a top marginal rate of about 37%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 毛里求斯 · Mauritius
  MU: { type: 'standard', score: 69, effRatePct: null,
    desc: '毛里求斯对税务居民按全球所得征收个人所得税，最高边际个税率约 20%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Mauritius taxes tax residents on worldwide income, with a top marginal rate of about 20%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 墨西哥 · Mexico
  MX: { type: 'standard', score: 56, effRatePct: null,
    desc: '墨西哥对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Mexico taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 荷兰 · Netherlands
  NL: { type: 'standard', score: 43, effRatePct: null,
    desc: '荷兰对税务居民按全球所得征收个人所得税，最高边际个税率约 49%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Netherlands taxes tax residents on worldwide income, with a top marginal rate of about 49%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 挪威 · Norway
  NO: { type: 'standard', score: 55, effRatePct: null,
    desc: '挪威对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Norway taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 新西兰 · New Zealand
  NZ: { type: 'standard', score: 52, effRatePct: null,
    desc: '新西兰对税务居民按全球所得征收个人所得税，最高边际个税率约 39%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'New Zealand taxes tax residents on worldwide income, with a top marginal rate of about 39%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 秘鲁 · Peru
  PE: { type: 'standard', score: 60, effRatePct: null,
    desc: '秘鲁对税务居民按全球所得征收个人所得税，最高边际个税率约 30%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Peru taxes tax residents on worldwide income, with a top marginal rate of about 30%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 菲律宾 · Philippines
  PH: { type: 'standard', score: 56, effRatePct: null,
    desc: '菲律宾对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Philippines taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 波兰 · Poland
  PL: { type: 'standard', score: 58, effRatePct: null,
    desc: '波兰对税务居民按全球所得征收个人所得税，最高边际个税率约 32%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Poland taxes tax residents on worldwide income, with a top marginal rate of about 32%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 罗马尼亚 · Romania
  RO: { type: 'standard', score: 76, effRatePct: null,
    desc: '罗马尼亚对税务居民按全球所得征收个人所得税，最高边际个税率约 10%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Romania taxes tax residents on worldwide income, with a top marginal rate of about 10%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 塞尔维亚 · Serbia
  RS: { type: 'standard', score: 76, effRatePct: null,
    desc: '塞尔维亚对税务居民按全球所得征收个人所得税，最高边际个税率约 10%。整体税负偏低，但仍需留意全球征税与申报义务。',
    descEn: 'Serbia taxes tax residents on worldwide income, with a top marginal rate of about 10%. Overall low tax, but worldwide taxation and filing duties still apply.' },
  // 卢旺达 · Rwanda
  RW: { type: 'standard', score: 60, effRatePct: null,
    desc: '卢旺达对税务居民按全球所得征收个人所得税，最高边际个税率约 30%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Rwanda taxes tax residents on worldwide income, with a top marginal rate of about 30%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 瑞典 · Sweden
  SE: { type: 'standard', score: 55, effRatePct: null,
    desc: '瑞典对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Sweden taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 塞内加尔 · Senegal
  SN: { type: 'standard', score: 55, effRatePct: null,
    desc: '塞内加尔对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Senegal taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 土耳其 · Turkiye
  TR: { type: 'standard', score: 51, effRatePct: null,
    desc: '土耳其对税务居民按全球所得征收个人所得税，最高边际个税率约 40%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'Turkiye taxes tax residents on worldwide income, with a top marginal rate of about 40%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
  // 中国台湾 · Taiwan, China
  TW: { type: 'standard', score: 55, effRatePct: null,
    desc: '中国台湾对税务居民按全球所得征收个人所得税，最高边际税率数据待核实。具体税负取决于居留身份与来源国，务必核实官方口径。',
    descEn: 'Taiwan, China taxes tax residents on worldwide income, with top marginal rate pending. Exact liability depends on residency status — always verify with officials.' },
  // 美国 · United States
  US: { type: 'standard', score: 54, effRatePct: null,
    desc: '美国对税务居民按全球所得征收个人所得税，最高边际个税率约 37%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'United States taxes tax residents on worldwide income, with a top marginal rate of about 37%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 乌拉圭 · Uruguay
  UY: { type: 'standard', score: 55, effRatePct: null,
    desc: '乌拉圭对税务居民按全球所得征收个人所得税，最高边际个税率约 36%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Uruguay taxes tax residents on worldwide income, with a top marginal rate of about 36%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 越南 · Viet Nam
  VN: { type: 'standard', score: 56, effRatePct: null,
    desc: '越南对税务居民按全球所得征收个人所得税，最高边际个税率约 35%。税负中等，长期居留建议评估税务居民身份。',
    descEn: 'Viet Nam taxes tax residents on worldwide income, with a top marginal rate of about 35%. A moderate-tax jurisdiction — long stays warrant a tax-residency review.' },
  // 南非 · South Africa
  ZA: { type: 'standard', score: 46, effRatePct: null,
    desc: '南非对税务居民按全球所得征收个人所得税，最高边际个税率约 45%。属高税负辖区，长期居留应评估税务居民身份与境外所得申报义务。',
    descEn: 'South Africa taxes tax residents on worldwide income, with a top marginal rate of about 45%. A high-tax jurisdiction — long stays warrant assessing tax residency and foreign-income filing duties.' },
};

const TAX_RULE_BY_CODE = new Map<string, TaxRule>(Object.entries(TAX_RULES));

/** 按国家代码取税制规则；未收录返回 null（UI 隐藏税负标签） */
export function taxRuleForCountry(code: string | null | undefined): TaxRule | null {
  if (!code) return null;
  return TAX_RULE_BY_CODE.get(code) ?? null;
}

/**
 * V1 粗颗粒「综合有效税率」估算（方向性，非税务建议）。
 * - exempt / territorial：0%（境外来源收入通常免税；属地制下本地来源另计）
 * - concession：取规则表 effRatePct（优惠制度下的近似值）
 * - standard：由最高边际税率 × 0.5 近似（有效税率通常显著低于最高边际税率），夹在 5–38%
 * topRatePct 为 null 时回落 22%（标注数据待核实）。
 */
export function effectiveRatePct(rule: TaxRule, nature: IncomeNature, topRatePct: number | null): number {
  void nature; // V1 不因收入性质分档；保留入参供 V2 细分
  if (rule.type === 'exempt' || rule.type === 'territorial') return 0;
  if (rule.type === 'concession') return rule.effRatePct ?? 15;
  const base = topRatePct != null ? topRatePct * 0.5 : 22;
  return Math.max(5, Math.min(38, Math.round(base)));
}
