/**
 * fetch-country.mjs — 第六轮：国家级参考数据管道
 *
 * 数据源：
 *  1. World Bank API（CC BY 4.0）：国家全表（ISO2→ISO3/首都/英文国名）+ 逐国
 *     NY.GDP.PCAP.CD（人均 GDP，现价美元，最新可得年）与 SP.POP.TOTL（总人口）
 *  2. Numbeo quality-of-life/rankings_by_country.jsp：国家级 Safety / Health Care /
 *     QoL / Purchasing Power / Pollution / Climate 指数（NYC = 100 口径）
 *  3. 手工快照表 MANUAL：官方语言 / 货币 / HDI (UNDP 2023-24) / CPI (Transparency
 *     International 2023) / 最高边际个税率 / 数字游民签证概览——只填有可靠依据的
 *     单元格，其余 null（延续「缺失不编造」原则）；GPI 与固定宽带网速因源站
 *     （visionofhumanity / speedtest.net）在本环境不可达，全部留 null 待补录。
 *
 * 产物：src/data/countries.json（数组，每项含 updatedAt 与逐字段 sources）
 * 运行：node scripts/pipeline/fetch-country.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CITIES_DIR = path.join(ROOT, 'src/data/cities');
const OUT = path.join(ROOT, 'src/data/countries.json');
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; QijuCompass-pipeline/1.0)' };

// ---------- 0. 收集城市里的国家集合 ----------
const CITY_FILES = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];
const countriesNeeded = new Map(); // iso2 -> { nameZh, cityCount }
for (const f of CITY_FILES) {
  const arr = JSON.parse(fs.readFileSync(path.join(CITIES_DIR, `${f}.json`), 'utf8'));
  for (const c of arr) {
    if (!countriesNeeded.has(c.countryCode)) countriesNeeded.set(c.countryCode, { nameZh: c.countryZh, cityCount: 0 });
    countriesNeeded.get(c.countryCode).cityCount += 1;
  }
}
console.log(`需要国家级数据的代码：${countriesNeeded.size}`);

// ---------- 1. World Bank 国家全表 ----------
const wbAll = JSON.parse(
  fs.readFileSync('/tmp/wb-countries.json', 'utf8'),
)[1];
const wbByIso2 = new Map();
for (const r of wbAll) wbByIso2.set(r.iso2Code, r);
console.log(`World Bank 全表：${wbByIso2.size} 国`);

// ---------- 2. World Bank 逐国指标（GDP per capita / Population，mrnev=1） ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wbIndicator(iso3, indicator) {
  const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}?format=json&mrnev=1`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(9000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const row = j?.[1]?.[0];
      return typeof row?.value === 'number' ? { value: row.value, year: row.date } : null;
    } catch (e) {
      if (attempt === 2) return { error: String(e) };
      await sleep(600 * (attempt + 1));
    }
  }
  return null;
}

// ---------- 3. Numbeo 国家 QoL 排名表 ----------
function parseNumbeoCountry(html) {
  const rows = new Map();
  const re = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(),
    );
    if (cells.length < 9) continue;
    // 列：rank, country, QoL, PP, Safety, Health Care, CoL, Traffic, Pollution, Climate
    const name = cells[1];
    if (!name) continue;
    const num = (s) => {
      const v = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
      return Number.isFinite(v) ? v : null;
    };
    rows.set(name, {
      qol: num(cells[2]),
      purchasingPower: num(cells[3]),
      safety: num(cells[4]),
      healthCare: num(cells[5]),
      costIndex: num(cells[6]),
      traffic: num(cells[7]),
      pollution: num(cells[8]),
      climate: num(cells[9]) ?? null,
    });
  }
  return rows;
}

const numbeoHtml = fs.readFileSync('/tmp/numbeo-country.html', 'utf8');
const numbeoCountry = parseNumbeoCountry(numbeoHtml);
console.log(`Numbeo 国家表：${numbeoCountry.size} 国`);

// ---------- 4. 手工快照表（只填可靠单元格；null = 无可靠依据） ----------
// languages: 官方语言（常用顺序）；currency/currencyCode；hdi: UNDP HDR 2023-24；
// cpi: TI CPI 2023；taxTopRatePct: 最高边际个税率（不含地方附加与社保，仅事实参考）；
// visaOverview: 国家级数字游民签证概览（一句话，与城市级数据互补）
const MANUAL = {
  ES: { languages: ['西班牙语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.911, cpi: 60, taxTopRatePct: 47, visaOverview: '有官方远程工作签证（2023 年起，需受雇合同或自雇证明）' },
  MX: { languages: ['西班牙语'], currency: '墨西哥比索', currencyCode: 'MXN', hdi: 0.781, cpi: 31, taxTopRatePct: 35, visaOverview: '无专门数字游民签证；临时居民签证（财务偿付能力证明）常被远程工作者使用' },
  AU: { languages: ['英语'], currency: '澳大利亚元', currencyCode: 'AUD', hdi: 0.946, cpi: 75, taxTopRatePct: 45, visaOverview: '无专门数字游民签证；访客签证政策下远程为境外雇主工作较普遍' },
  PT: { languages: ['葡萄牙语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.874, cpi: 62, taxTopRatePct: 48, visaOverview: '有官方数字游民签证（D8，需约 4 倍葡萄牙最低工资的月收入）' },
  HR: { languages: ['克罗地亚语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.878, cpi: 50, taxTopRatePct: 30, visaOverview: '有官方数字游民居留许可（一年期，不可连续延期、可重新申请）' },
  CN: { languages: ['汉语（普通话）'], currency: '人民币', currencyCode: 'CNY', hdi: 0.788, cpi: 42, taxTopRatePct: 45, visaOverview: '无专门数字游民签证；工作类居留许可需国内雇主担保' },
  JP: { languages: ['日语'], currency: '日元', currencyCode: 'JPY', hdi: 0.92, cpi: 73, taxTopRatePct: 45, visaOverview: '有官方数字游民签证（2024 年起，6 个月，需年收入约 1000 万日元）' },
  VN: { languages: ['越南语'], currency: '越南盾', currencyCode: 'VND', hdi: 0.726, cpi: 41, taxTopRatePct: 35, visaOverview: '无专门数字游民签证；电子签/商务签下远程办公处灰色地带' },
  TH: { languages: ['泰语'], currency: '泰铢', currencyCode: 'THB', hdi: 0.803, cpi: 35, taxTopRatePct: 35, visaOverview: '有目的地签证 DTV（2024 年起，单次最长 180 天，可付费续期）' },
  US: { languages: ['英语'], currency: '美元', currencyCode: 'USD', hdi: 0.927, cpi: 69, taxTopRatePct: 37, visaOverview: '无专门数字游民签证；B1/免签计划下为境外雇主远程工作属灰色地带' },
  IN: { languages: ['印地语', '英语'], currency: '印度卢比', currencyCode: 'INR', hdi: 0.644, cpi: 39, taxTopRatePct: 30, visaOverview: '无专门数字游民签证；电子商务签不允许实际就业活动' },
  MY: { languages: ['马来语', '英语'], currency: '马来西亚林吉特', currencyCode: 'MYR', hdi: 0.807, cpi: 50, taxTopRatePct: 30, visaOverview: '有 DE Rantau 数字游民通行证（3-12 个月，可续期）' },
  KR: { languages: ['韩语'], currency: '韩元', currencyCode: 'KRW', hdi: 0.929, cpi: 63, taxTopRatePct: 45, visaOverview: '有数字游民（Workcation）签证（2024 年起试行）' },
  ZA: { languages: ['英语', '祖鲁语', '南非荷兰语'], currency: '南非兰特', currencyCode: 'ZAR', hdi: 0.717, cpi: 41, taxTopRatePct: 45, visaOverview: '有官方数字游民签证（2024 年移民修正法案引入）' },
  CA: { languages: ['英语', '法语'], currency: '加拿大元', currencyCode: 'CAD', hdi: 0.935, cpi: 76, taxTopRatePct: 53, visaOverview: '无专门数字游民签证；访客身份为境外雇主远程工作被普遍接受' },
  CO: { languages: ['西班牙语'], currency: '哥伦比亚比索', currencyCode: 'COP', hdi: 0.758, cpi: 39, taxTopRatePct: 39, visaOverview: '有官方数字游民签证（V 类签证 V-NOMADA，2022 年起）' },
  BR: { languages: ['葡萄牙语'], currency: '巴西雷亚尔', currencyCode: 'BRL', hdi: 0.76, cpi: 36, taxTopRatePct: 28, visaOverview: '有官方数字游民签证（VITEM XIV，2022 年起）' },
  PE: { languages: ['西班牙语'], currency: '秘鲁索尔', currencyCode: 'PEN', hdi: 0.762, cpi: 33, taxTopRatePct: 30, visaOverview: '无专门数字游民签证（2023 年提案未落地）' },
  NZ: { languages: ['英语', '毛利语'], currency: '新西兰元', currencyCode: 'NZD', hdi: 0.939, cpi: 85, taxTopRatePct: 39, visaOverview: '无专门数字游民签证；访客签证政策允许远程为境外雇主工作' },
  NL: { languages: ['荷兰语', '英语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.946, cpi: 79, taxTopRatePct: 49, visaOverview: '无专门数字游民签证；自雇居留（DAFT 仅限美国/荷兰国民）' },
  NO: { languages: ['挪威语'], currency: '挪威克朗', currencyCode: 'NOK', hdi: 0.966, cpi: 84, taxTopRatePct: null, visaOverview: null },
  DE: { languages: ['德语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.95, cpi: 79, taxTopRatePct: 45, visaOverview: '无专门数字游民签证；自雇（Freiberufler）签证是常见路径' },
  RS: { languages: ['塞尔维亚语'], currency: '塞尔维亚第纳尔', currencyCode: 'RSD', hdi: null, cpi: 53, taxTopRatePct: 10, visaOverview: null },
  HU: { languages: ['匈牙利语'], currency: '匈牙利福林', currencyCode: 'HUF', hdi: 0.851, cpi: 42, taxTopRatePct: 15, visaOverview: '有官方白卡（White Card）数字游民许可（一年期可续）' },
  RO: { languages: ['罗马尼亚语'], currency: '罗马尼亚列伊', currencyCode: 'RON', hdi: 0.827, cpi: 46, taxTopRatePct: 10, visaOverview: null },
  CZ: { languages: ['捷克语'], currency: '捷克克朗', currencyCode: 'CZK', hdi: 0.895, cpi: 57, taxTopRatePct: 23, visaOverview: '无专门数字游民签证；Zivno 自雇签证是常见路径' },
  GE: { languages: ['格鲁吉亚语'], currency: '格鲁吉亚拉里', currencyCode: 'GEL', hdi: 0.814, cpi: 53, taxTopRatePct: 20, visaOverview: '有官方数字游民/远程工作者一年期居留（收入门槛较低）' },
  IT: { languages: ['意大利语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.906, cpi: 56, taxTopRatePct: 43, visaOverview: '有官方数字游民签证（2024 年起，需学历/收入门槛）' },
  DK: { languages: ['丹麦语'], currency: '丹麦克朗', currencyCode: 'DKK', hdi: 0.952, cpi: 90, taxTopRatePct: null, visaOverview: null },
  FI: { languages: ['芬兰语', '瑞典语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.942, cpi: 87, taxTopRatePct: null, visaOverview: null },
  PL: { languages: ['波兰语'], currency: '波兰兹罗提', currencyCode: 'PLN', hdi: 0.881, cpi: 54, taxTopRatePct: 32, visaOverview: null },
  LV: { languages: ['拉脱维亚语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.879, cpi: 53, taxTopRatePct: 31, visaOverview: '有官方数字游民签证（2022 年起，一年期）' },
  SE: { languages: ['瑞典语'], currency: '瑞典克朗', currencyCode: 'SEK', hdi: 0.952, cpi: 82, taxTopRatePct: null, visaOverview: null },
  CH: { languages: ['德语', '法语', '意大利语'], currency: '瑞士法郎', currencyCode: 'CHF', hdi: 0.967, cpi: 82, taxTopRatePct: null, visaOverview: null },
  EE: { languages: ['爱沙尼亚语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.899, cpi: 76, taxTopRatePct: 22, visaOverview: '有官方数字游民签证（D 类，为境外雇主远程工作）' },
  MT: { languages: ['马耳他语', '英语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.915, cpi: 51, taxTopRatePct: 35, visaOverview: '有官方数字游民居留许可（Nomad Residence Permit，一年可续）' },
  LT: { languages: ['立陶宛语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.879, cpi: 61, taxTopRatePct: 32, visaOverview: null },
  AT: { languages: ['德语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.926, cpi: 71, taxTopRatePct: 55, visaOverview: null },
  GR: { languages: ['希腊语'], currency: '欧元', currencyCode: 'EUR', hdi: 0.893, cpi: 51, taxTopRatePct: 44, visaOverview: '有官方数字游民签证（G 类，月收入门槛约 3,500 欧元）' },
  TR: { languages: ['土耳其语'], currency: '土耳其里拉', currencyCode: 'TRY', hdi: 0.855, cpi: 34, taxTopRatePct: 40, visaOverview: null },
  KZ: { languages: ['哈萨克语', '俄语'], currency: '哈萨克斯坦坚戈', currencyCode: 'KZT', hdi: 0.802, cpi: 39, taxTopRatePct: 10, visaOverview: null },
  AM: { languages: ['亚美尼亚语'], currency: '亚美尼亚德拉姆', currencyCode: 'AMD', hdi: 0.786, cpi: 47, taxTopRatePct: 22, visaOverview: null },
  JO: { languages: ['阿拉伯语'], currency: '约旦第纳尔', currencyCode: 'JOD', hdi: 0.736, cpi: 53, taxTopRatePct: 30, visaOverview: null },
  ID: { languages: ['印尼语'], currency: '印尼盾', currencyCode: 'IDR', hdi: 0.713, cpi: 34, taxTopRatePct: 35, visaOverview: '有官方远程工作签证 E33G（2024 年起，年收入门槛约 6 万美元）' },
  AE: { languages: ['阿拉伯语'], currency: '阿联酋迪拉姆', currencyCode: 'AED', hdi: 0.937, cpi: 68, taxTopRatePct: 0, visaOverview: '有虚拟工作签证（一年期，需月收入约 3,500 美元证明）' },
  KH: { languages: ['高棉语'], currency: '柬埔寨瑞尔', currencyCode: 'KHR', hdi: null, cpi: 22, taxTopRatePct: 20, visaOverview: null },
  LK: { languages: ['僧伽罗语', '泰米尔语'], currency: '斯里兰卡卢比', currencyCode: 'LKR', hdi: 0.78, cpi: 34, taxTopRatePct: 36, visaOverview: null },
  PH: { languages: ['菲律宾语', '英语'], currency: '菲律宾比索', currencyCode: 'PHP', hdi: 0.71, cpi: 34, taxTopRatePct: 35, visaOverview: null },
  TW: { languages: ['汉语（国语）'], currency: '新台币', currencyCode: 'TWD', hdi: null, cpi: 67, taxTopRatePct: 40, visaOverview: '无专门数字游民签证；就业金卡（Employment Gold Card）为主流路径' },
  IL: { languages: ['希伯来语'], currency: '以色列新谢克尔', currencyCode: 'ILS', hdi: 0.915, cpi: 58, taxTopRatePct: 50, visaOverview: null },
  HK: { languages: ['汉语（粤语/普通话）', '英语'], currency: '港币', currencyCode: 'HKD', hdi: null, cpi: 75, taxTopRatePct: 15, visaOverview: '无专门数字游民签证；高端人才通行证计划（高才通）为主流路径' },
  SG: { languages: ['英语', '马来语', '汉语', '泰米尔语'], currency: '新加坡元', currencyCode: 'SGD', hdi: 0.949, cpi: 83, taxTopRatePct: 24, visaOverview: '无专门数字游民签证；EP / ONE Pass 为雇佣类路径' },
  GH: { languages: ['英语'], currency: '塞地', currencyCode: 'GHS', hdi: 0.602, cpi: 43, taxTopRatePct: 35, visaOverview: null },
  SN: { languages: ['法语'], currency: '西非法郎', currencyCode: 'XOF', hdi: 0.517, cpi: 43, taxTopRatePct: null, visaOverview: null },
  RW: { languages: ['卢旺达语', '英语', '法语'], currency: '卢旺达法郎', currencyCode: 'RWF', hdi: 0.548, cpi: 53, taxTopRatePct: 30, visaOverview: null },
  EG: { languages: ['阿拉伯语'], currency: '埃及镑', currencyCode: 'EGP', hdi: 0.728, cpi: 35, taxTopRatePct: 25, visaOverview: null },
  MU: { languages: ['英语', '法语'], currency: '毛里求斯卢比', currencyCode: 'MUR', hdi: 0.796, cpi: 58, taxTopRatePct: 20, visaOverview: '有官方数字游民签证 Premium Visa（一年期可续）' },
  MA: { languages: ['阿拉伯语', '柏柏尔语'], currency: '摩洛哥迪拉姆', currencyCode: 'MAD', hdi: 0.698, cpi: 37, taxTopRatePct: 37, visaOverview: null },
  KE: { languages: ['斯瓦希里语', '英语'], currency: '肯尼亚先令', currencyCode: 'KES', hdi: 0.601, cpi: 31, taxTopRatePct: 30, visaOverview: 'Class K 居留（有固定境外收入者）常被视作数字游民路径' },
  ET: { languages: ['阿姆哈拉语'], currency: '埃塞俄比亚比尔', currencyCode: 'ETB', hdi: 0.492, cpi: 26, taxTopRatePct: 35, visaOverview: null },
  PR: { languages: ['西班牙语', '英语'], currency: '美元', currencyCode: 'USD', hdi: null, cpi: null, taxTopRatePct: null, visaOverview: null },
  AR: { languages: ['西班牙语'], currency: '阿根廷比索', currencyCode: 'ARS', hdi: 0.849, cpi: 37, taxTopRatePct: 35, visaOverview: null },
  UY: { languages: ['西班牙语'], currency: '乌拉圭比索', currencyCode: 'UYU', hdi: 0.83, cpi: 76, taxTopRatePct: 36, visaOverview: null },
  CL: { languages: ['西班牙语'], currency: '智利比索', currencyCode: 'CLP', hdi: 0.86, cpi: 67, taxTopRatePct: null, visaOverview: null },
  FJ: { languages: ['英语', '斐济语', '印地语'], currency: '斐济元', currencyCode: 'FJD', hdi: 0.729, cpi: null, taxTopRatePct: null, visaOverview: null },
};

// ---------- 5. 装配 ----------
const MANUAL_SOURCES = {
  languages: '手工快照（官方语言，ISO/各国官方口径）',
  currency: '手工快照（ISO 4217）',
  currencyCode: '手工快照（ISO 4217）',
  hdi: 'UNDP《人类发展报告 2023-24》手工转录',
  cpi: 'Transparency International CPI 2023 手工转录',
  taxTopRatePct: '手工快照（最高边际个税率，不含地方附加与社保；仅事实参考非税务建议）',
  visaOverview: '手工快照（各国移民局公开信息概述，以官方为准）',
};
const WB_SOURCES = {
  nameZh: '手工快照（中文国名，常用译名）',
  nameEn: 'World Bank country table (CC BY 4.0)',
  iso3: 'World Bank country table (CC BY 4.0)',
  capital: 'World Bank country table (CC BY 4.0)',
  population: 'World Bank SP.POP.TOTL (CC BY 4.0)',
  gdpPerCapitaUSD: 'World Bank NY.GDP.PCAP.CD (CC BY 4.0)',
};
const NUMBEO_SOURCES = {
  safety: 'Numbeo country rankings (NYC=100)',
  healthcare: 'Numbeo country rankings (NYC=100)',
  qol: 'Numbeo country rankings (NYC=100)',
  pollution: 'Numbeo country rankings (NYC=100)',
  climate: 'Numbeo country rankings (NYC=100)',
};

const today = new Date().toISOString().slice(0, 10);
const out = [];
const missing = [];
for (const [iso2, meta] of countriesNeeded) {
  const wb = wbByIso2.get(iso2);
  if (!wb || !wb.id) {
    missing.push(iso2);
    continue;
  }
  const gdp = await wbIndicator(wb.id, 'NY.GDP.PCAP.CD');
  await sleep(220);
  const pop = await wbIndicator(wb.id, 'SP.POP.TOTL');
  await sleep(220);
  if (gdp?.error) console.log(`  WB GDP ${iso2} 失败: ${gdp.error}`);
  const nb = numbeoCountry.get(wb.name) ?? null;
  const man = MANUAL[iso2] ?? {};

  out.push({
    code: iso2,
    iso3: wb.id ?? null,
    nameZh: meta.nameZh,
    nameEn: wb.name ?? null,
    capital: wb.capitalCity ?? null,
    languages: man.languages ?? null,
    currency: man.currency ?? null,
    currencyCode: man.currencyCode ?? null,
    population: pop?.value ?? null,
    gdpPerCapitaUSD: gdp?.value ?? null,
    hdi: man.hdi ?? null,
    gpi: null, // visionofhumanity 源不可达，留 null 待补录
    cpi: man.cpi ?? null,
    numbeoSafety: nb?.safety ?? null,
    numbeoHealthcare: nb?.healthCare ?? null,
    numbeoQol: nb?.qol ?? null,
    numbeoPollution: nb?.pollution ?? null,
    numbeoClimate: nb?.climate ?? null,
    internetMbpsFixed: null, // speedtest.net 源不可达（403），留 null 待补录
    visaOverview: man.visaOverview ?? null,
    taxTopRatePct: man.taxTopRatePct ?? null,
    cityCount: meta.cityCount,
    updatedAt: today,
    sources: {
      nameEn: WB_SOURCES.nameEn,
      iso3: WB_SOURCES.iso3,
      capital: WB_SOURCES.capital,
      population: WB_SOURCES.population,
      gdpPerCapitaUSD: WB_SOURCES.gdpPerCapitaUSD,
      languages: man.languages ? MANUAL_SOURCES.languages : null,
      currency: man.currency ? MANUAL_SOURCES.currency : null,
      currencyCode: man.currencyCode ? MANUAL_SOURCES.currencyCode : null,
      hdi: man.hdi != null ? MANUAL_SOURCES.hdi : null,
      cpi: man.cpi != null ? MANUAL_SOURCES.cpi : null,
      taxTopRatePct: man.taxTopRatePct != null ? MANUAL_SOURCES.taxTopRatePct : null,
      visaOverview: man.visaOverview ? MANUAL_SOURCES.visaOverview : null,
      numbeoSafety: nb ? NUMBEO_SOURCES.safety : null,
      numbeoHealthcare: nb ? NUMBEO_SOURCES.healthcare : null,
      numbeoQol: nb ? NUMBEO_SOURCES.qol : null,
      numbeoPollution: nb ? NUMBEO_SOURCES.pollution : null,
      numbeoClimate: nb ? NUMBEO_SOURCES.climate : null,
    },
  });
  console.log(`✓ ${iso2} ${meta.nameZh} | GDP ${gdp?.value ? Math.round(gdp.value) : '—'} | Safety ${nb?.safety ?? '—'} | CPI ${man.cpi ?? '—'}`);
}
if (missing.length) console.log(`✗ World Bank 全表未覆盖：${missing.join(',')}`);

out.sort((a, b) => b.cityCount - a.cityCount);
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`\n产出 ${OUT}：${out.length} 国（缺失 ${missing.length}）`);
