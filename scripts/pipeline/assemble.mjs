/**
 * 装配管道：39 旧城富化 + 61 新城装配 → 输出 6 大洲 JSON（共 100 城）
 *
 * 数据源（均真实抓取，缺失字段保持 null，严禁编造）：
 * - /tmp/cities15000.txt          GeoNames cities15000（CC BY 4.0）：坐标/人口/国家/时区
 * - /tmp/pipeline/selection.json  61 新城底座（含 continent/subregion/latlng/population/timezone）
 * - /tmp/pipeline/numbeo-rankings.json  Numbeo 生活成本 / 生活质量指数榜（NYC=100 口径）
 * - /tmp/pipeline/numbeo-details.json   Numbeo 城市详情页（平价一餐 / 市中心 1 居租金，USD）
 * - /tmp/pipeline/climate.json    Open-Meteo 近 10 年聚合（CC BY 4.0）
 * - /tmp/pipeline/epi.json        EF EPI 英语普及度（ISO2 → score/band）
 * - src/data/cities/*.json        既有 39 城手工库（保留其编辑性字段与原 costIndex）
 *
 * 估算口径（DATA.md 同步记录）：新城 monthlyCostUSD = round(a·costIndex + b)，
 * a/b 由 39 城既有 (costIndex, monthlyCostUSD) 最小二乘拟合；cost 区间 = 拟合值 ×[0.85, 1.2]。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'src/data/cities');
const PIPE = '/tmp/pipeline';
const GEO_TXT = '/tmp/cities15000.txt';

// ---------------------------------------------------------------------------
// ISO2 → [continent, subregion]（产品口径：在 UN M49 基础上，墨西哥/加勒比归北美，
// 格鲁吉亚/土耳其按既有库归欧洲；全表见 DATA.md）
// ---------------------------------------------------------------------------
const ISO_GEO = {
  PT: ['europe', 'southern-europe'], ES: ['europe', 'southern-europe'], HR: ['europe', 'southern-europe'],
  GR: ['europe', 'southern-europe'], IT: ['europe', 'southern-europe'], MT: ['europe', 'southern-europe'],
  RS: ['europe', 'southern-europe'], GE: ['europe', 'southern-europe'], TR: ['europe', 'southern-europe'],
  AT: ['europe', 'western-europe'], NL: ['europe', 'western-europe'], CH: ['europe', 'western-europe'],
  DE: ['europe', 'western-europe'],
  DK: ['europe', 'northern-europe'], SE: ['europe', 'northern-europe'], NO: ['europe', 'northern-europe'],
  FI: ['europe', 'northern-europe'], EE: ['europe', 'northern-europe'], LV: ['europe', 'northern-europe'],
  LT: ['europe', 'northern-europe'],
  CZ: ['europe', 'eastern-europe'], HU: ['europe', 'eastern-europe'], PL: ['europe', 'eastern-europe'],
  RO: ['europe', 'eastern-europe'],
  JP: ['asia', 'eastern-asia'], KR: ['asia', 'eastern-asia'], TW: ['asia', 'eastern-asia'],
  HK: ['asia', 'eastern-asia'], CN: ['asia', 'eastern-asia'],
  TH: ['asia', 'south-eastern-asia'], ID: ['asia', 'south-eastern-asia'], MY: ['asia', 'south-eastern-asia'],
  SG: ['asia', 'south-eastern-asia'], VN: ['asia', 'south-eastern-asia'], KH: ['asia', 'south-eastern-asia'],
  PH: ['asia', 'south-eastern-asia'],
  IN: ['asia', 'southern-asia'], LK: ['asia', 'southern-asia'],
  AE: ['asia', 'western-asia'], IL: ['asia', 'western-asia'], JO: ['asia', 'western-asia'],
  AM: ['asia', 'western-asia'],
  KZ: ['asia', 'central-asia'],
  MA: ['africa', 'northern-africa'], EG: ['africa', 'northern-africa'],
  SN: ['africa', 'western-africa'], GH: ['africa', 'western-africa'],
  KE: ['africa', 'eastern-africa'], RW: ['africa', 'eastern-africa'], ET: ['africa', 'eastern-africa'],
  MU: ['africa', 'eastern-africa'],
  ZA: ['africa', 'southern-africa'],
  US: ['north-america', 'northern-america'], CA: ['north-america', 'northern-america'],
  MX: ['north-america', 'northern-america'], PR: ['north-america', 'caribbean'],
  CO: ['south-america', 'south-america'], BR: ['south-america', 'south-america'],
  AR: ['south-america', 'south-america'], UY: ['south-america', 'south-america'],
  PE: ['south-america', 'south-america'], CL: ['south-america', 'south-america'],
  AU: ['oceania', 'australasia'], NZ: ['oceania', 'australasia'], FJ: ['oceania', 'melanesia'],
};

// 39 旧城 → 国家 ISO2 + GeoNames ascii 候选
const OLD_ISO = {
  lisbon: { iso: 'PT', ascii: ['Lisbon'] },
  porto: { iso: 'PT', ascii: ['Porto'] },
  madeira: { iso: 'PT', ascii: ['Funchal'] },
  barcelona: { iso: 'ES', ascii: ['Barcelona'] },
  mallorca: { iso: 'ES', ascii: ['Palma'] },
  valencia: { iso: 'ES', ascii: ['Valencia'] },
  madrid: { iso: 'ES', ascii: ['Madrid'] },
  split: { iso: 'HR', ascii: ['Split'] },
  zagreb: { iso: 'HR', ascii: ['Zagreb'] },
  athens: { iso: 'GR', ascii: ['Athens'] },
  budapest: { iso: 'HU', ascii: ['Budapest'] },
  prague: { iso: 'CZ', ascii: ['Prague'] },
  berlin: { iso: 'DE', ascii: ['Berlin'] },
  tbilisi: { iso: 'GE', ascii: ['Tbilisi'] },
  istanbul: { iso: 'TR', ascii: ['Istanbul'] },
  florence: { iso: 'IT', ascii: ['Florence', 'Firenze'] },
  tallinn: { iso: 'EE', ascii: ['Tallinn'] },
  bangkok: { iso: 'TH', ascii: ['Bangkok'] },
  'chiang-mai': { iso: 'TH', ascii: ['Chiang Mai'] },
  phuket: { iso: 'TH', ascii: ['Phuket'] },
  bali: { iso: 'ID', ascii: ['Denpasar'] },
  penang: { iso: 'MY', ascii: ['George Town'] },
  'kuala-lumpur': { iso: 'MY', ascii: ['Kuala Lumpur'] },
  singapore: { iso: 'SG', ascii: ['Singapore'] },
  'ho-chi-minh': { iso: 'VN', ascii: ['Ho Chi Minh City'] },
  'da-nang': { iso: 'VN', ascii: ['Da Nang'] },
  tokyo: { iso: 'JP', ascii: ['Tokyo'] },
  seoul: { iso: 'KR', ascii: ['Seoul'] },
  taipei: { iso: 'TW', ascii: ['Taipei'] },
  marrakech: { iso: 'MA', ascii: ['Marrakesh', 'Marrakech'] },
  'cape-town': { iso: 'ZA', ascii: ['Cape Town'] },
  'mexico-city': { iso: 'MX', ascii: ['Mexico City'] },
  merida: { iso: 'MX', ascii: ['Merida'] },
  'playa-del-carmen': { iso: 'MX', ascii: ['Playa del Carmen'] },
  medellin: { iso: 'CO', ascii: ['Medellin'] },
  bogota: { iso: 'CO', ascii: ['Bogota'] },
  'buenos-aires': { iso: 'AR', ascii: ['Buenos Aires'] },
  rio: { iso: 'BR', ascii: ['Rio de Janeiro'] },
  lima: { iso: 'PE', ascii: ['Lima'] },
};

// 61 新城兴趣 tags（编辑标注，与 16 标签池同 id；供兴趣维度召回）
const NEW_TAGS = {
  seville: ['history', 'food', 'festivals', 'arts', 'outdoor'],
  malaga: ['beach', 'food', 'arts', 'outdoor', 'nightlife'],
  valletta: ['history', 'beach', 'watersports', 'food'],
  dubrovnik: ['history', 'beach', 'watersports', 'food'],
  vienna: ['arts', 'history', 'coffee', 'food', 'shopping'],
  amsterdam: ['startup', 'nightlife', 'arts', 'lgbtq', 'coffee', 'outdoor'],
  zurich: ['outdoor', 'nature', 'coffee', 'shopping', 'fitness'],
  copenhagen: ['startup', 'coffee', 'shopping', 'fitness', 'arts'],
  stockholm: ['startup', 'nature', 'arts', 'coffee', 'outdoor'],
  oslo: ['nature', 'outdoor', 'arts', 'coffee'],
  helsinki: ['startup', 'nature', 'coffee', 'arts'],
  riga: ['history', 'arts', 'food', 'nightlife'],
  vilnius: ['history', 'arts', 'food', 'coffee'],
  krakow: ['history', 'food', 'nightlife', 'arts'],
  bucharest: ['startup', 'food', 'nightlife', 'history'],
  belgrade: ['nightlife', 'food', 'history', 'festivals'],
  shanghai: ['food', 'shopping', 'nightlife', 'startup', 'arts'],
  chengdu: ['food', 'pets', 'history', 'nature', 'festivals'],
  dali: ['nature', 'wellness', 'arts', 'festivals', 'outdoor'],
  'hong-kong': ['food', 'shopping', 'nature', 'nightlife', 'startup'],
  fukuoka: ['food', 'nightlife', 'beach', 'shopping'],
  kyoto: ['history', 'arts', 'food', 'nature', 'wellness'],
  busan: ['beach', 'food', 'nightlife', 'nature', 'outdoor'],
  hanoi: ['food', 'history', 'coffee', 'nightlife'],
  'phnom-penh': ['history', 'food', 'nightlife'],
  cebu: ['beach', 'watersports', 'nature', 'food', 'outdoor'],
  bangalore: ['startup', 'food', 'coffee', 'nightlife', 'fitness'],
  goa: ['beach', 'wellness', 'food', 'nightlife', 'outdoor'],
  colombo: ['food', 'beach', 'history', 'shopping'],
  dubai: ['shopping', 'beach', 'food', 'nightlife', 'fitness'],
  'tel-aviv': ['beach', 'nightlife', 'startup', 'food', 'lgbtq'],
  amman: ['history', 'food', 'coffee'],
  yerevan: ['history', 'arts', 'coffee', 'food'],
  almaty: ['nature', 'outdoor', 'food', 'nightlife'],
  cancun: ['beach', 'watersports', 'nightlife', 'food', 'wellness'],
  oaxaca: ['food', 'arts', 'history', 'festivals'],
  'los-angeles': ['beach', 'startup', 'fitness', 'food', 'arts', 'outdoor'],
  miami: ['beach', 'nightlife', 'arts', 'food', 'watersports'],
  austin: ['startup', 'nightlife', 'food', 'festivals', 'outdoor'],
  vancouver: ['nature', 'outdoor', 'food', 'coffee', 'fitness'],
  toronto: ['food', 'arts', 'startup', 'shopping', 'nightlife'],
  'san-juan': ['beach', 'history', 'food', 'nightlife'],
  santiago: ['food', 'nightlife', 'outdoor', 'arts'],
  montevideo: ['beach', 'food', 'history', 'outdoor'],
  cuzco: ['history', 'nature', 'outdoor', 'festivals'],
  floripa: ['beach', 'watersports', 'wellness', 'nightlife', 'outdoor'],
  cairo: ['history', 'food', 'shopping'],
  nairobi: ['nature', 'outdoor', 'food', 'festivals'],
  kigali: ['nature', 'food', 'outdoor', 'wellness'],
  'addis-ababa': ['history', 'food', 'coffee', 'festivals'],
  johannesburg: ['food', 'arts', 'nightlife', 'shopping', 'nature'],
  dakar: ['beach', 'arts', 'food', 'festivals', 'watersports'],
  accra: ['beach', 'food', 'arts', 'nightlife'],
  'port-louis': ['beach', 'food', 'watersports', 'nature'],
  sydney: ['beach', 'outdoor', 'food', 'fitness', 'watersports'],
  melbourne: ['coffee', 'arts', 'food', 'shopping', 'startup'],
  brisbane: ['outdoor', 'beach', 'food', 'fitness'],
  perth: ['beach', 'outdoor', 'food', 'nature'],
  auckland: ['nature', 'outdoor', 'food', 'watersports'],
  wellington: ['coffee', 'arts', 'nature', 'food', 'outdoor'],
  nadi: ['beach', 'watersports', 'wellness', 'nature'],
};

// EF EPI band → 1-5 序数（english 维度展示值）
const BAND_ORDINAL = { 'very high': 5, high: 4, moderate: 3, low: 2, 'very low': 1 };

// Numbeo rankings 中城市名与库内 id 的覆盖映射（归一匹配失败的才需要）
const RANK_NAME_OVERRIDE = {
  madeira: 'Funchal', bali: 'Bali', penang: 'George Town', 'ho-chi-minh': 'Ho Chi Minh City',
  'da-nang': 'Da Nang', 'chiang-mai': 'Chiang Mai', 'kuala-lumpur': 'Kuala Lumpur',
  'cape-town': 'Cape Town', 'mexico-city': 'Mexico City', 'playa-del-carmen': 'Playa del Carmen',
  'buenos-aires': 'Buenos Aires', rio: 'Rio de Janeiro', marrakech: 'Marrakech',
  'tel-aviv': 'Tel Aviv', 'san-juan': 'San Juan', 'port-louis': 'Port Louis',
  'addis-ababa': 'Addis Ababa', 'los-angeles': 'Los Angeles, CA', 'miami': 'Miami, FL',
  'austin': 'Austin, TX', floripa: 'Florianopolis',
  cuzco: 'Cusco', 'hong-kong': 'Hong Kong',
  seville: 'Seville (Sevilla)', krakow: 'Krakow (Cracow)', bangalore: 'Bangalore',
};

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

function parseGeo() {
  const rows = fs.readFileSync(GEO_TXT, 'utf8').split('\n').filter(Boolean);
  const byKey = new Map(); // `${norm(asciiName)}|${iso}` → row（取人口最大者）
  for (const line of rows) {
    const f = line.split('\t');
    if (f.length < 19) continue;
    const pop = Number(f[14]) || 0;
    const entry = { pop, lat: Number(f[4]), lng: Number(f[5]), tz: f[17], name: f[2] };
    for (const n of [f[1], f[2], ...f[3].split(',')]) {
      if (!n) continue;
      const key = `${norm(n)}|${f[8]}`;
      const prev = byKey.get(key);
      if (!prev || pop > prev.pop) byKey.set(key, entry);
    }
  }
  return byKey;
}

function geoLookup(geo, asciiCandidates, iso) {
  for (const a of asciiCandidates) {
    const hit = geo.get(`${norm(a)}|${iso}`);
    if (hit) return hit;
  }
  return null;
}

/** 新城规模序数：按人口分层（与 39 城人工口径对齐的确定性映射） */
function sizeOrdinal(pop) {
  if (pop == null) return null;
  if (pop >= 10_000_000) return 5;
  if (pop >= 3_000_000) return 4;
  if (pop >= 1_000_000) return 3;
  if (pop >= 300_000) return 2;
  return 1;
}

/** 39 城既有 (costIndex, monthlyCostUSD) 最小二乘 */
function fitCost(pairs) {
  const n = pairs.length;
  const sx = pairs.reduce((s, p) => s + p[0], 0);
  const sy = pairs.reduce((s, p) => s + p[1], 0);
  const sxx = pairs.reduce((s, p) => s + p[0] * p[0], 0);
  const sxy = pairs.reduce((s, p) => s + p[0] * p[1], 0);
  const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - a * sx) / n;
  return { a, b };
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
function main() {
  const selection = JSON.parse(fs.readFileSync(path.join(PIPE, 'selection.json'), 'utf8'));
  const rank = JSON.parse(fs.readFileSync(path.join(PIPE, 'numbeo-rankings.json'), 'utf8'));
  const details = JSON.parse(fs.readFileSync(path.join(PIPE, 'numbeo-details.json'), 'utf8'));
  const climate = JSON.parse(fs.readFileSync(path.join(PIPE, 'climate.json'), 'utf8'));
  const epi = JSON.parse(fs.readFileSync(path.join(PIPE, 'epi.json'), 'utf8'));
  const geo = parseGeo();

  // ---- rankings 索引：norm("city") → row ----
  // col 表 nums 顺序：CoL / Rent / CoL+Rent / Groceries / Restaurant / LocalPP
  // qol 表 nums 顺序：QoL / PP / Safety / HealthCare / CoL / PropertyPriceRatio / Traffic / Pollution / Climate
  const colByCity = new Map();
  for (const r of rank.colRows) {
    const n = r.nums;
    colByCity.set(norm(r.city), {
      colIndex: n[0], rentIndex: n[1], colPlusRentIndex: n[2],
      groceriesIndex: n[3], restaurantIndex: n[4], localPurchasingPower: n[5],
    });
  }
  const qolByCity = new Map();
  for (const r of rank.qolRows) {
    const n = r.nums;
    qolByCity.set(norm(r.city), {
      qolIndex: n[0], purchasingPower: n[1], safety: n[2], healthCare: n[3],
      colIndex: n[4], propertyPriceRatio: n[5], traffic: n[6], pollution: n[7], climate: n[8],
    });
  }

  function rankMatch(id, nameEn) {
    const key = RANK_NAME_OVERRIDE[id] ?? nameEn;
    const nk = norm(key);
    const col = colByCity.get(nk) ?? colByCity.get(nk.replace(/\s/g, '')) ?? null;
    const qol = qolByCity.get(nk) ?? qolByCity.get(nk.replace(/\s/g, '')) ?? null;
    return { col, qol };
  }

  // ---- 39 旧城 GeoNames 底座 + rankings 匹配试探 ----
  // 旧城源一律取 git 原始快照（/tmp/pipeline/orig/），避免被上轮装配输出污染
  const oldCitiesByFile = {};
  for (const f of ['europe', 'asia', 'africa', 'americas']) {
    const p = path.join(PIPE, 'orig', `${f}.json`);
    if (!fs.existsSync(p)) continue;
    oldCitiesByFile[f] = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const oldAll = Object.values(oldCitiesByFile).flat();

  const geoFail = [];
  const rankFail = [];
  const oldPairs = []; // [costIndex, monthlyCostUSD]
  const oldBase = new Map(); // id → geo/city 基础信息
  for (const c of oldAll) {
    const conf = OLD_ISO[c.id];
    if (!conf) throw new Error(`旧城 ${c.id} 缺 OLD_ISO 配置`);
    const g = geoLookup(geo, conf.ascii, conf.iso);
    if (!g) geoFail.push(c.id);
    if (typeof c.costIndex === 'number' && typeof c.monthlyCostUSD === 'number') {
      oldPairs.push([c.costIndex, c.monthlyCostUSD]);
    }
    const { col, qol } = rankMatch(c.id, c.nameEn);
    if (!col) rankFail.push(c.id);
    oldBase.set(c.id, { conf, geo: g, col, qol, nameEn: c.nameEn });
  }
  console.log(`旧城 GeoNames 未匹配: ${geoFail.join(',') || '无'}`);
  console.log(`旧城 rankings 未匹配: ${rankFail.join(',') || '无'}`);

  // ---- 61 新城 rankings 匹配试探 ----
  const newRankFail = [];
  for (const s of selection) {
    const { col } = rankMatch(s.id, s.nameEn);
    if (!col) newRankFail.push(s.id);
  }
  console.log(`新城 rankings 未匹配: ${newRankFail.join(',') || '无'}`);

  // ---- 成本拟合 ----
  const { a, b } = fitCost(oldPairs);
  console.log(`成本拟合: monthlyCostUSD = ${a.toFixed(2)} × costIndex + ${b.toFixed(2)}  (n=${oldPairs.length})`);
  const estMonthly = (idx) => {
    const m = Math.round(a * idx + b);
    return Math.max(300, Math.min(6000, m));
  };

  // ---- 装配新城 ----
  const newCities = [];
  const assembleFail = [];
  for (const s of selection) {
    const [continent, subregion] = ISO_GEO[s.iso2] ?? [null, null];
    if (!continent) throw new Error(`新城 ${s.id} 缺 ISO_GEO（${s.iso2}）`);
    const { col, qol } = rankMatch(s.id, s.nameEn);
    const det = details[s.id] ?? null;
    const cli = climate[s.id] ?? null;
    const e = epi[s.iso2] ?? null;

    const city = {
      id: s.id,
      nameZh: s.nameZh,
      nameEn: s.nameEn,
      countryZh: s.countryZh,
      countryEn: null, // 由 GeoNames 国家表补充（见下方 COUNTRY_EN）
      countryCode: s.iso2,
      continent,
      subregion,
      region: continent, // v2: region = continent 六值
      population: s.population ?? null,
      timezone: s.timezone ?? null,
      cost: null,
      monthlyCostUSD: null,
      costIndex: col ? col.colIndex : null,
      rent1brUSD: det?.rent1brUSD ?? null,
      mealUSD: det?.mealUSD ?? null,
      visaScore: null,
      visaLabel: null,
      visaStatus: null,
      visaDetail: null,
      internet: null,
      internetMbps: null,
      safety: qol ? qol.safety : null,
      healthcareIndex: qol ? qol.healthCare : null,
      pollutionIndex: qol ? qol.pollution : null,
      trafficIndex: qol ? qol.traffic : null,
      purchasingPowerIndex: qol ? qol.purchasingPower : null,
      climateIndex: qol ? qol.climate : null,
      climate: cli ? Math.round(cli.avgTempC * 10) / 10 : null,
      climateType: null,
      climateDetail: cli
        ? {
            avgTempC: cli.avgTempC,
            annualPrecipMm: cli.annualPrecipMm,
            precipDays: cli.precipDays,
            sunshineHours: cli.sunshineHours,
            summary: cli.summary,
          }
        : null,
      community: null,
      english: e ? BAND_ORDINAL[e.band] ?? null : null,
      englishEpiBand: e?.band ?? null,
      englishEpiScore: e?.score ?? null,
      pace: null,
      size: sizeOrdinal(s.population),
      digitalNomadVisa: null,
      tags: NEW_TAGS[s.id] ?? [],
      traits: null,
    };
    if (city.costIndex != null) {
      city.monthlyCostUSD = estMonthly(city.costIndex);
      city.cost = [Math.round(city.monthlyCostUSD * 0.85), Math.round(city.monthlyCostUSD * 1.2)];
    }
    if (!cli) assembleFail.push(`climate:${s.id}`);
    if (city.tags.length === 0) assembleFail.push(`tags:${s.id}`);
    newCities.push(city);
  }
  console.log(`新城装配缺口: ${assembleFail.join(', ') || '无'}`);

  // ---- 富化旧城（保留编辑性字段与原 costIndex） ----
  const enriched = { europe: [], asia: [], africa: [], 'north-america': [], 'south-america': [] };
  for (const c of oldAll) {
    const base = oldBase.get(c.id);
    const g = base.geo;
    const [continent, subregion] = ISO_GEO[base.conf.iso];
    // americas 拆分
    const region = c.region === 'americas'
      ? continent // north-america / south-america
      : c.region;
    const e = epi[base.conf.iso] ?? null;
    const det = details[c.id] ?? null;
    const qol = base.qol;

    const next = {
      ...c,
      countryCode: base.conf.iso,
      region,
      continent,
      subregion,
      population: g ? g.pop : (c.population ?? null),
      timezone: g ? g.tz : (c.timezone ?? null),
      climateDetail: climate[c.id] ?? (c.climateDetail ?? null),
      rent1brUSD: det?.rent1brUSD ?? (c.rent1brUSD ?? null),
      mealUSD: det?.mealUSD ?? (c.mealUSD ?? null),
      healthcareIndex: qol ? qol.healthCare : (c.healthcareIndex ?? null),
      pollutionIndex: qol ? qol.pollution : (c.pollutionIndex ?? null),
      trafficIndex: qol ? qol.traffic : (c.trafficIndex ?? null),
      purchasingPowerIndex: qol ? qol.purchasingPower : (c.purchasingPowerIndex ?? null),
      climateIndex: qol ? qol.climate : (c.climateIndex ?? null),
      englishEpiBand: e?.band ?? null,
      englishEpiScore: e?.score ?? null,
      visaStatus: null,
      visaDetail: null,
    };
    // 签证结构化：从既有 visaLabel + digitalNomadVisa 推导三档（不新增事实）
    if (c.digitalNomadVisa === true) {
      const label = typeof c.visaLabel === 'string' ? c.visaLabel : null;
      const paren = label?.match(/（([^）]+)）/u);
      const kw = label?.match(/[\u4e00-\u9fa5A-Za-z0-9 ]{2,24}?(?:签证|居留|准证|许可|白卡|DTV)/u);
      const visaName = paren ? paren[1] : kw ? kw[0].trim() : null;
      next.visaStatus = 'official';
      next.visaDetail = { name: visaName, note: label };
    } else if (c.digitalNomadVisa === false) {
      next.visaStatus = 'none';
      next.visaDetail = { name: null, note: c.visaLabel ?? null };
    } else if (c.visaLabel) {
      next.visaStatus = 'alternative';
      next.visaDetail = { name: null, note: c.visaLabel };
    }
    if (next.digitalNomadVisa == null) next.digitalNomadVisa = next.visaStatus === 'official' ? true : next.visaStatus === 'none' ? false : null;
    enriched[region === 'americas' ? continent : region].push(next);
  }

  // ---- 大洲容器 ----
  const buckets = {
    europe: [...enriched.europe],
    asia: [...enriched.asia],
    africa: [...enriched.africa],
    'north-america': [...enriched['north-america']],
    'south-america': [...enriched['south-america']],
    oceania: [],
  };
  for (const c of newCities) buckets[c.region].push(c);

  // ---- 写文件 ----
  let total = 0;
  const stat = [];
  for (const [region, arr] of Object.entries(buckets)) {
    arr.sort((x, y) => x.nameZh.localeCompare(y.nameZh, 'zh'));
    fs.writeFileSync(path.join(OUT_DIR, `${region}.json`), JSON.stringify(arr, null, 1) + '\n');
    total += arr.length;
    stat.push(`${region}: ${arr.length}`);
  }
  const oldAmericas = path.join(OUT_DIR, 'americas.json');
  if (fs.existsSync(oldAmericas)) fs.rmSync(oldAmericas);

  // 39 城坐标（供气候补拉脚本）
  const oldCoord = oldAll.map((c) => {
    const g = oldBase.get(c.id).geo;
    return { id: c.id, nameEn: c.nameEn, lat: g?.lat ?? null, lng: g?.lng ?? null };
  });
  fs.writeFileSync(path.join(PIPE, 'selection-old.json'), JSON.stringify(oldCoord, null, 1));
  const noCoord = oldCoord.filter((c) => c.lat == null).map((c) => c.id);
  console.log(`旧城缺坐标: ${noCoord.join(',') || '无'}`);

  console.log(`\n=== 总计 ${total} 城 ===\n${stat.join('\n')}`);
}

main();
