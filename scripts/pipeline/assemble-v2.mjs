// 第十轮：装配 100 新城并追加到现有 100 城（只增不改）
// 读取：/tmp/pipeline/selection2.json + cost-rankings.json + cost-details.json + climate.json + epi.json
// 基底：src/data/cities/*.json（现有 100 城原样保留，字段值不动）
// 写回：src/data/cities/*.json（合并后 200 城）
import fs from 'node:fs';
import path from 'node:path';

const PIPE = '/tmp/pipeline';
const ROOT = 'src/data/cities';
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];

const norm = (s) => s.toLowerCase().trim();
const fold = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ø]/g, 'o')
    .replace(/[ł]/g, 'l')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '');

// rankings 表内名称差异候选（nameEn 之外追加）
const EXTRA_NAME = {
  batumi: ['Batumi, Ajara'],
  'san-diego': ['San Diego, CA'],
  'las-vegas': ['Las Vegas, NV'],
  portland: ['Portland, OR'],
  chicago: ['Chicago, IL'],
  phoenix: ['Phoenix, AZ'],
};

// ISO → [continent, subregion]（与 assemble.mjs ISO_GEO 同口径）
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
  GH: ['africa', 'western-africa'], SN: ['africa', 'western-africa'],
  KE: ['africa', 'eastern-africa'], RW: ['africa', 'eastern-africa'], ET: ['africa', 'eastern-africa'],
  MU: ['africa', 'eastern-africa'], ZA: ['africa', 'southern-africa'],
  MX: ['north-america', 'central-america'], CR: ['north-america', 'central-america'],
  US: ['north-america', 'northern-america'], CA: ['north-america', 'northern-america'],
  PR: ['north-america', 'caribbean'],
  BR: ['south-america', 'south-america'], AR: ['south-america', 'south-america'],
  CL: ['south-america', 'south-america'], CO: ['south-america', 'south-america'],
  PE: ['south-america', 'south-america'], UY: ['south-america', 'south-america'],
  AU: ['oceania', 'australia-nz'], NZ: ['oceania', 'australia-nz'], FJ: ['oceania', 'melanesia'],
};

const BAND_ORDINAL = { 'very high': 5, high: 4, moderate: 3, low: 2, 'very low': 1 };

function sizeOrdinal(pop) {
  if (pop == null) return null;
  if (pop >= 10_000_000) return 5;
  if (pop >= 3_000_000) return 4;
  if (pop >= 1_000_000) return 3;
  if (pop >= 300_000) return 2;
  return 1;
}

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

function main() {
  const selection = JSON.parse(fs.readFileSync(path.join(PIPE, 'selection2.json'), 'utf8'));
  const rank = JSON.parse(fs.readFileSync(path.join(PIPE, 'cost-rankings.json'), 'utf8'));
  const details = fs.existsSync(path.join(PIPE, 'cost-details.json'))
    ? JSON.parse(fs.readFileSync(path.join(PIPE, 'cost-details.json'), 'utf8'))
    : {};
  const climate = JSON.parse(fs.readFileSync(path.join(PIPE, 'climate.json'), 'utf8'));
  const epi = JSON.parse(fs.readFileSync(path.join(PIPE, 'epi.json'), 'utf8'));

  // ---- rankings 索引（city|country 折叠键，国家消歧） ----
  const colByCity = new Map();
  for (const r of rank.colRows) colByCity.set(`${fold(r.city)}|${fold(r.country)}`, r);
  const qolByCity = new Map();
  for (const r of rank.qolRows) {
    const n = r.nums;
    qolByCity.set(`${fold(r.city)}|${fold(r.country)}`, {
      qolIndex: n[0], purchasingPower: n[1], safety: n[2], healthCare: n[3],
      colIndex: n[4], propertyPriceRatio: n[5], traffic: n[6], pollution: n[7], climate: n[8],
    });
  }

  function rankMatch(id, nameEn, iso) {
    const countryEn = COUNTRY_EN[iso] ?? '';
    const ck = fold(countryEn);
    const keys = [nameEn, ...(EXTRA_NAME[id] ?? [])].map((n) => `${fold(n)}|${ck}`);
    for (const k of keys) {
      if (colByCity.has(k)) return { col: colByCity.get(k), qol: qolByCity.get(k) ?? null };
    }
    for (const k of keys) {
      if (qolByCity.has(k)) return { col: null, qol: qolByCity.get(k) };
    }
    return { col: null, qol: null };
  }

  // ---- 基底：现有 100 城原样保留 ----
  const base = new Map();
  for (const r of REGIONS) {
    for (const c of JSON.parse(fs.readFileSync(path.join(ROOT, `${r}.json`), 'utf8'))) base.set(c.id, { city: c, region: r });
  }

  // ---- 39 旧城拟合点：visaStatus 非空（人工快照）者为旧城 ----
  const oldPairs = [];
  for (const { city } of base.values()) {
    if (city.visaStatus != null && typeof city.livingScore === 'number' && typeof city.monthlyCostUSD === 'number') {
      oldPairs.push([city.livingScore, city.monthlyCostUSD]);
    }
  }
  const { a, b } = fitCost(oldPairs);
  console.log(`成本拟合: monthlyCostUSD = ${a.toFixed(2)} × livingScore + ${b.toFixed(2)}  (n=${oldPairs.length})`);
  const estMonthly = (idx) => Math.max(300, Math.min(6000, Math.round(a * idx + b)));

  // ---- 装配 100 新城 ----
  const added = [];
  const misses = { col: [], qol: [], det: [], cli: [] };
  const backfilled = { cli: [], det: 0 };
  for (const s of selection) {
    const [continent, subregion] = ISO_GEO[s.iso2] ?? [null, null];
    if (!continent) throw new Error(`新城 ${s.id} 缺 ISO_GEO（${s.iso2}）`);
    if (base.has(s.id)) {
      // 幂等：已装配的新城仅回填补抓成功的详情价格（rent/meal），其余字段不动
      const cur = base.get(s.id).city;
      const det = details[s.id];
      if (det && cur.housingLevel == null && cur.mealUSD == null && (det.housingLevel != null || det.mealUSD != null)) {
        cur.housingLevel = det.housingLevel ?? null;
        cur.mealUSD = det.mealUSD ?? null;
        console.log(`  回填详情价格: ${s.id} (rent=${cur.housingLevel} meal=${cur.mealUSD})`);
      }
      // 气候回填：首次装配时 climate.json 尚未跑完的城，补 climateDetail
      const cli2 = climate[s.id] ?? null;
      if (cli2 && cur.climateDetail == null) {
        cur.climateDetail = {
          avgTempC: cli2.avgTempC,
          annualPrecipMm: cli2.annualPrecipMm,
          precipDays: cli2.precipDays,
          sunshineHours: cli2.sunshineHours,
          summary: cli2.summary,
        };
        backfilled.cli.push(s.id);
      }
      continue;
    }
    const { col, qol } = rankMatch(s.id, s.nameEn, s.iso2);
    if (!col) misses.col.push(s.id);
    if (!qol) misses.qol.push(s.id);
    if (!details[s.id]) misses.det.push(s.id);
    const cli = climate[s.id] ?? null;
    if (!cli) misses.cli.push(s.id);
    const e = epi[s.iso2] ?? null;
    const det = details[s.id] ?? {};
    const livingScore = col?.nums?.[0] ?? qol?.colIndex ?? null;
    const city = {
      id: s.id,
      nameZh: s.nameZh,
      nameEn: s.nameEn,
      countryZh: s.countryZh,
      countryEn: COUNTRY_EN[s.iso2] ?? null,
      countryCode: s.iso2,
      continent,
      subregion,
      region: continent,
      population: s.population ?? s.fallback?.population ?? null,
      timezone: s.timezone ?? s.fallback?.timezone ?? null,
      cost: livingScore != null ? [Math.round(estMonthly(livingScore) * 0.85), Math.round(estMonthly(livingScore) * 1.2)] : null,
      monthlyCostUSD: livingScore != null ? estMonthly(livingScore) : null,
      livingScore,
      housingLevel: det.housingLevel ?? null,
      mealUSD: det.mealUSD ?? null,
      visaScore: null,
      visaLabel: null,
      visaStatus: null,
      visaDetail: null,
      internet: null,
      internetMbps: null,
      safety: qol?.safety ?? null,
      healthcareIndex: qol?.healthCare ?? null,
      pollutionIndex: qol?.pollution ?? null,
      trafficIndex: qol?.traffic ?? null,
      purchasingPowerIndex: qol?.purchasingPower ?? null,
      climateIndex: qol?.climate ?? null,
      climate: null, // 枚举字段（mediterranean 等）；本轮新城不派生枚举，温度在 climateDetail
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
      englishBand: e?.band ?? null,
      englishScore: e?.score ?? null,
      pace: null,
      size: sizeOrdinal(s.population),
      digitalNomadVisa: null,
      tags: s.tags ?? [],
      traits: null,
    };
    base.set(s.id, { city, region: continent });
    added.push(s.id);
  }

  console.log(`新增 ${added.length} 城`);
  if (backfilled.cli.length) console.log(`气候回填 ${backfilled.cli.length} 城`);
  console.log(`rankings 缺 cost: ${misses.col.length}  缺 QOL 9 指数: ${misses.qol.length}  缺详情价格: ${misses.det.length}  缺气候: ${misses.cli.length}`);
  if (misses.cli.length) console.log('  缺气候:', misses.cli.join(' '));

  // ---- 分大洲写回：旧城按原顺序保留（值不动），新城 append 在末尾（不整体排序） ----
  const outByRegion = {};
  for (const r of REGIONS) outByRegion[r] = [];
  for (const { city, region } of base.values()) outByRegion[region].push(city);
  let total = 0;
  for (const r of REGIONS) {
    fs.writeFileSync(path.join(ROOT, `${r}.json`), JSON.stringify(outByRegion[r], null, 1));
    total += outByRegion[r].length;
    console.log(`${r}: ${outByRegion[r].length}`);
  }
  console.log(`总计 ${total} 城`);
}

// ISO2 → 公开统计英文国名（rankings 匹配用）
const COUNTRY_EN = {
  PT: 'Portugal', ES: 'Spain', IT: 'Italy', DE: 'Germany', NL: 'Netherlands', CH: 'Switzerland',
  AT: 'Austria', CZ: 'Czech Republic', PL: 'Poland', RO: 'Romania', GR: 'Greece', HR: 'Croatia',
  RS: 'Serbia', HU: 'Hungary', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  LT: 'Lithuania', EE: 'Estonia', MT: 'Malta',
  TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines', JP: 'Japan',
  KR: 'South Korea', TW: 'Taiwan', CN: 'China', IN: 'India', AE: 'United Arab Emirates',
  IL: 'Israel', GE: 'Georgia', TR: 'Turkey', KH: 'Cambodia',
  MX: 'Mexico', US: 'United States', CA: 'Canada', PR: 'Puerto Rico',
  BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', UY: 'Uruguay',
  EG: 'Egypt', MA: 'Morocco', ZA: 'South Africa', KE: 'Kenya', GH: 'Ghana',
  AU: 'Australia', NZ: 'New Zealand', FJ: 'Fiji',
};

main();
