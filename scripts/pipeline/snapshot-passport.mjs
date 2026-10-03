/**
 * snapshot-passport.mjs — 第九轮：护照视角签证快照 + 长期定居快照（幂等回填）
 *
 * 1. visaPassport：65 国对中国大陆普通护照的入境待遇（免签/落地签/eVisa/需签证）
 *    与主要签证类型适用性（work / digitalNomad / longTerm → friendly | restricted | unknown）
 *    来源：各国移民局 / 使领馆公开公告 + 双边协定公开报道的手工快照（快照日期 2025-01）。
 *    策略：拿不准的一律 unknown 或保守档，绝不编造；entryNote 保留关键例外
 *    （如「持美签可免签」）。政策多变，展示端必须附免责声明。
 *
 * 2. longStay：长期定居实务快照
 *    - taxResidencyDays：成为税务居民的通常触发天数（各国税法口径不同，数字为近似锚点）
 *    - socialSecurityCn：与中国社保双边协定（人社部生效名单，截至 2025-01）：
 *      treaty = 已生效 / none = 名单未含（按无生效协定处理）/ negotiating = 留枚举（本轮未使用）
 *    - rentalCustom：租房押金/预付惯例简述（自译，使用前需核实）
 *    来源：官方税务指南 + 人社部双边社保协定名单 + 公开租房信息。
 *
 * 用法：node scripts/pipeline/snapshot-passport.mjs（幂等，可重复运行）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = join(__dirname, '../../src/data/countries.json');

export const SNAPSHOT_DATE = '2025-01-15';

const VISA_PASSPORT_SOURCE =
  'visaPassport = 中国大陆普通护照入境待遇与签证适用性手工快照（2025-01，依据各国移民局/使领馆公开公告与双边协定公开报道整理）；签证政策多变，出行前务必核实官方渠道。';

const LONG_STAY_SOURCE =
  'longStay = 长期定居实务快照（2025-01）：taxResidencyDays 依据各国官方税务指南的通常触发天数（近似锚点）；socialSecurityCn 依据人社部双边社保协定生效名单（截至 2025-01）；rentalCustom 依据公开租房/侨居指南整理。均为参考信息，使用前需核实。';

// entry: visaFree | visaOnArrival | eVisa | visaRequired
// work/digitalNomad/longTerm: friendly | restricted | unknown
// [entry, note, work, dn, lt]
const PASS = {
  CN: ['visaFree', '本国护照', 'unknown', 'unknown', 'unknown'],
  HK: ['visaFree', '持往来港澳通行证及有效签注（一般每次 7–14 天）', 'restricted', 'unknown', 'restricted'],
  TW: ['visaRequired', '大陆居民赴台需通行证 + 入台许可', 'restricted', 'unknown', 'restricted'],
  JP: ['visaRequired', '单次/三年/五年多次签，需领区送签', 'restricted', 'unknown', 'unknown'],
  KR: ['visaRequired', '济州岛对华免签 30 天；本土需提前办签', 'restricted', 'unknown', 'unknown'],
  TH: ['visaFree', '中泰互免签证，单次最长 60 天（2024-03 起）', 'restricted', 'friendly', 'restricted'],
  MY: ['visaFree', '对华免签 30 天（政策多次延期，出行前核实）', 'restricted', 'friendly', 'restricted'],
  SG: ['visaFree', '中新互免签证 30 天（2024-02 起）', 'restricted', 'unknown', 'restricted'],
  VN: ['eVisa', '电子签 90 天（2023-08 起对全球开放）', 'restricted', 'unknown', 'unknown'],
  ID: ['visaOnArrival', '落地签 30 天可延期一次', 'restricted', 'friendly', 'restricted'],
  PH: ['visaRequired', '需提前办签；持美/日/澳/加/申根有效签证可免签入境 7 天', 'restricted', 'unknown', 'unknown'],
  KH: ['visaOnArrival', '落地签或电子签 30 天', 'restricted', 'unknown', 'restricted'],
  LK: ['eVisa', 'ETA 电子旅行授权 30 天', 'restricted', 'unknown', 'unknown'],
  GE: ['visaFree', '中格互免签证 30 天（2024-05 协定生效）', 'friendly', 'friendly', 'restricted'],
  IN: ['visaRequired', '需纸质签证，暂无对华 eVisa', 'restricted', 'unknown', 'unknown'],
  AE: ['visaFree', '免签 30 天可延期', 'friendly', 'friendly', 'restricted'],
  IL: ['visaRequired', '需提前办签', 'restricted', 'unknown', 'unknown'],
  JO: ['visaOnArrival', '落地签 40 天（持 Jordan Pass 免签费）', 'restricted', 'unknown', 'restricted'],
  TR: ['eVisa', '有条件 eVisa 单次 30 天；建议出行前核实资格条件', 'restricted', 'unknown', 'restricted'],
  KZ: ['visaFree', '中哈互免签证 30 天/次，年累计 90 天（2023-11 起）', 'restricted', 'unknown', 'restricted'],
  AM: ['visaFree', '中亚美尼亚互免签证 90 天（2020 起）', 'restricted', 'unknown', 'restricted'],
  RS: ['visaFree', '中塞互免签证 30 天/次（2017 起）', 'restricted', 'unknown', 'restricted'],
  GB: ['visaRequired', '标准访客签单次最长 6 个月', 'restricted', 'unknown', 'restricted'],
  CH: ['visaRequired', '申根 C 签（瑞士属申根区，停留共享 90/180 天）', 'restricted', 'unknown', 'restricted'],
  ES: ['visaRequired', '申根签证 90/180 天', 'restricted', 'friendly', 'restricted'],
  PT: ['visaRequired', '申根签证 90/180 天', 'restricted', 'friendly', 'restricted'],
  FR: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  IT: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  DE: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  NL: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  AT: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  GR: ['visaRequired', '申根签证 90/180 天', 'restricted', 'friendly', 'restricted'],
  MT: ['visaRequired', '申根签证 90/180 天', 'restricted', 'friendly', 'restricted'],
  HR: ['visaRequired', '申根签证 90/180 天', 'restricted', 'friendly', 'restricted'],
  CZ: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  HU: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  RO: ['visaRequired', '申根签证 90/180 天（保加利亚罗马尼亚已入申根）', 'restricted', 'friendly', 'restricted'],
  PL: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  SE: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  FI: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  DK: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  EE: ['visaRequired', '申根签证 90/180 天', 'restricted', 'friendly', 'restricted'],
  LV: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  LT: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  NO: ['visaRequired', '申根签证 90/180 天', 'restricted', 'unknown', 'restricted'],
  MX: ['visaRequired', '持有效美签可免签入境 180 天', 'restricted', 'unknown', 'restricted'],
  CO: ['visaRequired', '持有效美签或申根签可免签 90 天', 'restricted', 'friendly', 'restricted'],
  BR: ['visaRequired', '需提前办签', 'restricted', 'unknown', 'unknown'],
  PE: ['visaRequired', '持美/加/英/澳/申根有效签证可免签 180 天', 'restricted', 'unknown', 'unknown'],
  CL: ['visaRequired', '持美/加签可申请简化电子签', 'restricted', 'unknown', 'unknown'],
  AR: ['visaRequired', '持美签可申请 AVE 电子旅行授权', 'restricted', 'unknown', 'unknown'],
  UY: ['visaRequired', '部分情况可凭美/申根有效签免签，需核实', 'unknown', 'unknown', 'unknown'],
  PR: ['visaRequired', '美国领地，按美国签证政策（B1/B2 适用）', 'restricted', 'unknown', 'unknown'],
  CA: ['visaRequired', '访客签最长 10 年多次', 'restricted', 'unknown', 'restricted'],
  US: ['visaRequired', 'B1/B2 十年多次签 + EVUS 登记', 'restricted', 'unknown', 'unknown'],
  AU: ['visaRequired', '需访客签（600 类；eVisitor 不适用中国护照）', 'restricted', 'unknown', 'restricted'],
  NZ: ['visaRequired', '需访客签；访客签下远程工作规则放宽（2024 起）', 'restricted', 'friendly', 'restricted'],
  FJ: ['visaFree', '对华免签（停留期以移民局最新口径为准）', 'restricted', 'unknown', 'unknown'],
  ZA: ['visaRequired', '需提前办签', 'restricted', 'unknown', 'unknown'],
  MA: ['visaFree', '免签 90 天（2016 起）', 'restricted', 'unknown', 'restricted'],
  EG: ['visaOnArrival', '有条件落地签（需满足现金/返程票等），建议提前办签', 'restricted', 'unknown', 'restricted'],
  KE: ['eVisa', 'eTA 电子旅行授权（2024-01 起取代签证）', 'restricted', 'unknown', 'restricted'],
  MU: ['visaFree', '免签 60 天', 'restricted', 'friendly', 'restricted'],
  GH: ['visaRequired', '需提前办签', 'unknown', 'unknown', 'unknown'],
  SN: ['visaRequired', '需提前办签', 'unknown', 'unknown', 'unknown'],
  RW: ['visaOnArrival', '落地签 30 天（对全球开放）', 'restricted', 'unknown', 'restricted'],
  ET: ['eVisa', '电子签 30/90 天', 'restricted', 'unknown', 'unknown'],
};

// taxResidencyDays：成为税务居民的通常触发天数（近似锚点）；socialSecurityCn：treaty=人社部生效名单内
// rentalCustom：租房押金/预付惯例简述
// [days, ss, rental]
const LONGSTAY = {
  CN: [183, 'none', '一线城市常见「押一付三」或「两押一付」'],
  HK: [183, 'none', '常见「两按一付」：2 个月押金 + 1 个月租金'],
  TW: [183, 'none', '常见 2 个月押金'],
  JP: [365, 'treaty', '押金 1–2 个月 + 礼金并存，常需保证公司'],
  KR: [183, 'treaty', '独特全租房（jeonse）：大额押金替代月租；月租房押金 1–2 个月'],
  TH: [180, 'none', '通常 2 个月押金 + 1 个月预付'],
  MY: [182, 'none', '通常 2 个月押金 + 半月水电预付'],
  SG: [183, 'none', '通常 1 个月押金（一年租约），不满一年常加收'],
  VN: [183, 'none', '常见 1–3 个月押金'],
  ID: [183, 'none', '常见 1–2 个月押金 + 1–2 个月预付'],
  PH: [180, 'none', '常见 2 个月押金 + 1 个月预付'],
  KH: [182, 'none', '常见 1–2 个月押金，长租常要求半年预付'],
  LK: [183, 'none', '常见 1–2 个月押金'],
  GE: [183, 'none', '常见 1 个月押金'],
  IN: [182, 'none', '大城市常见 2–3 个月押金'],
  AE: [90, 'none', '常见 1–4 张支票预付，押金约 5%'],
  IL: [183, 'none', '常见 1–2 个月押金 + 中介费'],
  JO: [183, 'none', '常见 1–6 个月预付'],
  TR: [183, 'none', '押金法定上限 3 个月房租'],
  KZ: [183, 'none', '常见 1 个月押金'],
  AM: [183, 'none', '常见 1 个月押金'],
  RS: [183, 'treaty', '常见 1 个月押金'],
  GB: [183, 'none', '押金法定上限 5 周房租，须存政府认证保护计划'],
  CH: [183, 'treaty', '押金须存专用银行账户（常见 2–3 个月）'],
  ES: [183, 'treaty', '通常 1 个月押金（法定上限 2 个月），常要求担保'],
  PT: [183, 'none', '通常 2 个月押金，常要求担保人'],
  FR: [183, 'treaty', '通常 1 个月押金（空房；带家具更低），常要求 visale 担保'],
  IT: [183, 'none', '法定押金 3 个月（deposito cautelare）'],
  DE: [183, 'treaty', '通常 3 个月冷租押金（Kaution），存第三方托管账户'],
  NL: [183, 'treaty', '通常 2 个月押金，房源紧张常要求收入门槛'],
  AT: [183, 'none', '法定押金最高 3 个月，常见存专用账户'],
  GR: [183, 'none', '常见 1–2 个月押金'],
  MT: [183, 'none', '常见 1 个月押金'],
  HR: [183, 'none', '常见 2–3 个月押金'],
  CZ: [183, 'none', '常见 1–2 个月押金 + 1 个月中介费'],
  HU: [183, 'none', '常见 2 个月押金'],
  RO: [183, 'none', '常见 1–2 个月押金'],
  PL: [183, 'none', '常见 1–2 个月押金（2023 新法上限为 12 倍月租）'],
  SE: [183, 'none', '常见 1 个月押金，普遍要求稳定收入证明'],
  FI: [183, 'treaty', '常见 1–2 个月押金'],
  DK: [183, 'treaty', '法定押金最高 6 个月（常见 3 个月）+ 3 个月预付'],
  EE: [183, 'none', '常见 1–2 个月押金'],
  LV: [183, 'none', '常见 1–2 个月押金'],
  LT: [183, 'none', '常见 1–2 个月押金'],
  NO: [270, 'none', '押金须存独立存款账户（常见 2–3 个月）'],
  MX: [183, 'none', '通常 1 个月押金 + 1 个月租金，常需共同签署人（fiador）'],
  CO: [183, 'none', '常见 1 个月押金，常需担保人或预付'],
  BR: [183, 'none', '常见 2–3 个月押金或保证金保险'],
  PE: [183, 'none', '常见 1 个月押金'],
  CL: [183, 'none', '常见 1 个月押金'],
  AR: [183, 'none', '常见 1–2 个月押金，高通胀下续租频繁调价'],
  UY: [183, 'none', '常见 1–2 个月押金'],
  PR: [183, 'none', '美国领地，惯例同美国（约 1 个月押金）'],
  CA: [183, 'treaty', '通常半月到 1 个月押金'],
  US: [183, 'none', '通常 1 个月房租押金，部分州设上限'],
  AU: [183, 'none', '通常 4 周房租押金（bond），存政府机构'],
  NZ: [183, 'none', '最多 4 周押金，存 Tenancy Services'],
  FJ: [183, 'none', '常见 1 个月押金'],
  ZA: [183, 'none', '常见 1–2 个月押金'],
  MA: [183, 'none', '常见 1–2 个月押金'],
  EG: [183, 'none', '常见 1–2 个月押金'],
  KE: [183, 'none', '常见 1–3 个月押金'],
  MU: [183, 'none', '常见 1–2 个月押金'],
  GH: [183, 'none', '常见 6–12 个月租金预付（年付为主）'],
  SN: [183, 'none', '常见 2–3 个月押金，高档房源常要求预付'],
  RW: [183, 'treaty', '常见 1–2 个月押金'],
  ET: [183, 'none', '常见 2–6 个月预付'],
};

// ── 执行回填（幂等）──
const countries = JSON.parse(readFileSync(TARGET, 'utf-8'));
const codes = countries.map((c) => c.code);
const need = codes.filter((code) => PASS[code] == null || LONGSTAY[code] == null);

// 幂等：SNAPSHOT_DATE 相同且字段已存在则跳过写入（重复运行输出 0 变更）
let changed = 0;
const entryEnum = new Set(['visaFree', 'visaOnArrival', 'eVisa', 'visaRequired']);
const levelEnum = new Set(['friendly', 'restricted', 'unknown']);

for (const c of countries) {
  const p = PASS[c.code];
  const l = LONGSTAY[c.code];
  if (p == null || l == null) {
    console.error(`snapshot-passport: 缺少 ${c.code} 的快照数据，跳过（字段将不写入）`);
    continue;
  }
  const visaPassport = {
    entry: p[0],
    entryNote: p[1],
    work: p[2],
    digitalNomad: p[3],
    longTerm: p[4],
    snapshotDate: SNAPSHOT_DATE,
  };
  const longStay = {
    taxResidencyDays: l[0],
    socialSecurityCn: l[1],
    rentalCustom: l[2],
    snapshotDate: SNAPSHOT_DATE,
  };
  const before = JSON.stringify([c.visaPassport, c.longStay]);
  c.visaPassport = visaPassport;
  c.longStay = longStay;
  if (c.sources == null) c.sources = {};
  c.sources.visaPassport = VISA_PASSPORT_SOURCE;
  c.sources.longStay = LONG_STAY_SOURCE;
  const after = JSON.stringify([c.visaPassport, c.longStay]);
  if (before !== after) changed += 1;
}

// 枚举合法性自检
for (const c of countries) {
  const v = c.visaPassport;
  if (v && (!entryEnum.has(v.entry) || !levelEnum.has(v.work) || !levelEnum.has(v.digitalNomad) || !levelEnum.has(v.longTerm))) {
    throw new Error(`枚举非法: ${c.code}`);
  }
  const l = c.longStay;
  if (l && l.taxResidencyDays != null && (l.taxResidencyDays < 30 || l.taxResidencyDays > 365)) {
    throw new Error(`taxResidencyDays 越界: ${c.code} = ${l.taxResidencyDays}`);
  }
}

writeFileSync(TARGET, JSON.stringify(countries, null, 2) + '\n');
console.log(
  `snapshot-passport 完成：visaPassport ${countries.filter((c) => c.visaPassport).length}/${countries.length}，` +
    `longStay ${countries.filter((c) => c.longStay).length}/${countries.length}，变更 ${changed} 国（快照 ${SNAPSHOT_DATE}）` +
    (need.length ? `；缺数据: ${need.join(',')}` : ''),
);
