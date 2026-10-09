/**
 * backfill-indices.mjs — 用公开统计榜单 + 城市详情，补全现有 200 城的缺失指数
 *
 * 只增不改：仅填充当前为 null 的字段；已存在值一律保留（旧城/中间代口径不动）。
 * 数据来源（/tmp/pipeline/）：
 *   nb-col.md / nb-col-current.md        生活成本指数（NYC=100）
 *   nb-qol.md / nb-qol-current.md        生活质量 9 指数（NYC=100）
 *   nb-crime.md                          犯罪指数（→ safety = 100 - crime）
 *   nb-health.md / nb-pollution.md       医疗 / 污染指数
 *   nb-details.json                      城市详情（pctVsNY 反推成本 + 一餐/一居租金 USD）
 *
 * 用法：node scripts/pipeline/backfill-indices.mjs [--write]
 *   无 --write → dry-run，仅打印各字段可补数量与样例，不改文件。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/data/cities';
const PIPE = '/tmp/pipeline';
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];
const WRITE = process.argv.includes('--write');

const fold = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ø]/g, 'o')
    .replace(/[ł]/g, 'l')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '');

/** 榜单城市名规整：去括号别名（Krakow (Cracow) → Krakow；Bali (Canggu & Ubud) → Bali） */
const normCity = (s) => fold((s ?? '').replace(/\s*\([^)]*\)/g, ''));

/** 榜单「City, Country」单元格 → { city, country }（兼容美式「City, ST, United States」） */
function splitCityCountry(cell) {
  const clean = cell.replace(/\s*\([^)]*\)/g, '');
  const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return { city: normCity(parts[0]), country: fold(parts[parts.length - 1]) };
}

const ckey = (city, country) => city + '|' + country;

/** ISO2 → 源站英文国名（与 assemble 的 COUNTRY_EN 同口径 + 补全） */
const COUNTRY_EN = {
  PT: 'Portugal', ES: 'Spain', IT: 'Italy', DE: 'Germany', NL: 'Netherlands', CH: 'Switzerland',
  AT: 'Austria', CZ: 'Czech Republic', PL: 'Poland', RO: 'Romania', GR: 'Greece', HR: 'Croatia',
  RS: 'Serbia', HU: 'Hungary', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  LT: 'Lithuania', EE: 'Estonia', MT: 'Malta', LV: 'Latvia',
  TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines', JP: 'Japan',
  KR: 'South Korea', TW: 'Taiwan', CN: 'China', IN: 'India', AE: 'United Arab Emirates',
  IL: 'Israel', GE: 'Georgia', TR: 'Turkey', KH: 'Cambodia', HK: 'Hong Kong', SG: 'Singapore',
  LK: 'Sri Lanka', JO: 'Jordan', AM: 'Armenia', KZ: 'Kazakhstan',
  MX: 'Mexico', US: 'United States', CA: 'Canada', PR: 'Puerto Rico', CR: 'Costa Rica',
  BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', UY: 'Uruguay',
  EG: 'Egypt', MA: 'Morocco', ZA: 'South Africa', KE: 'Kenya', GH: 'Ghana', SN: 'Senegal',
  RW: 'Rwanda', ET: 'Ethiopia', MU: 'Mauritius', TN: 'Tunisia',
  AU: 'Australia', NZ: 'New Zealand', FJ: 'Fiji',
};

/** 城市名补充（源站拼写差异） */
const EXTRA_NAME = {
  tenerife: ['Santa Cruz de Tenerife'], 'san-miguel': ['San Miguel de Allende'],
  'san-miguel-de-allende': ['San Miguel de Allende'], 'tel-aviv': ['Tel Aviv-Yafo'],
  goa: ['Panaji'], cuzco: ['Cusco'], 'chiang-mai': ['Chiang Mai'], 'kuala-lumpur': ['Kuala Lumpur'],
  'ho-chi-minh': ['Ho Chi Minh City'], 'hong-kong': ['Hong Kong'], 'cape-town': ['Cape Town'],
  'da-lat': ['Da Lat'], 'nha-trang': ['Nha Trang'], 'chiang-rai': ['Chiang Rai'],
  'koh-samui': ['Koh Samui'], 'phnom-penh': ['Phnom Penh'], 'siem-reap': ['Siem Reap'],
  'addis-ababa': ['Addis Ababa'], 'port-louis': ['Port Louis'], 'hamilton-nz': ['Hamilton'],
  'gold-coast': ['Gold Coast'], 'san-juan': ['San Juan'], marrakech: ['Marrakesh'],
  madeira: ['Funchal'], bali: ['Canggu'], floripa: ['Florianopolis'], 'da-nang': ['Da Nang'],
  'playa-del-carmen': ['Playa del Carmen'], 'cluj-napoca': ['Cluj-Napoca'],
};

function read(file) {
  const p = path.join(PIPE, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

/** 解析 COL 类榜单（markdown 表格）：city|country → { col, rent, colPlusRent, groceries, restaurant, pp } */
function parseCol(file) {
  const map = new Map();
  for (const line of read(file).split('\n')) {
    const cells = line.split('|').map((s) => s.trim());
    if (cells.length < 8) continue;
    const cityCell = cells.find((c) => c.includes(', ') && /[A-Za-z]/.test(c));
    if (!cityCell) continue;
    const parsed = splitCityCountry(cityCell);
    if (!parsed) continue;
    const nums = cells.filter((c) => /^\d+(\.\d+)?$/.test(c)).map(Number);
    if (nums.length < 6) continue;
    map.set(ckey(parsed.city, parsed.country), {
      col: nums[0], rent: nums[1], colPlusRent: nums[2], groceries: nums[3], restaurant: nums[4], pp: nums[5],
    });
  }
  return map;
}

/** 解析 QOL 榜单（纯行）：City, Country qol pp safety health col property traffic pollution climate */
function parseQol(file) {
  const map = new Map();
  for (const line of read(file).split('\n')) {
    const m = line.match(/^(.+?), ([A-Za-z .()'-]+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/);
    if (!m) continue;
    map.set(ckey(normCity(m[1]), fold(m[2])), {
      qol: +m[3], pp: +m[4], safety: +m[5], health: +m[6], col: +m[7],
      property: +m[8], traffic: +m[9], pollution: +m[10], climate: +m[11],
    });
  }
  return map;
}

/** 解析两列榜单（crime: index+? / health: index+exp / pollution: index+exp）→ City|Country → {a,b} */
function parsePair(file) {
  const map = new Map();
  for (const line of read(file).split('\n')) {
    const m = line.match(/^(.+?), ([A-Za-z .()'-]+?)\s+([\d.]+)\s+([\d.]+)\s*$/);
    if (!m) continue;
    map.set(ckey(normCity(m[1]), fold(m[2])), { a: +m[3], b: +m[4] });
  }
  return map;
}

function main() {
  // 合并 mid-year + current（current 优先覆盖，取最新）
  const col = new Map([...parseCol('nb-col.md'), ...parseCol('nb-col-current.md')]);
  const qol = new Map([...parseQol('nb-qol.md'), ...parseQol('nb-qol-current.md')]);
  const crime = parsePair('nb-crime.md');
  const health = parsePair('nb-health.md');
  const pollution = parsePair('nb-pollution.md');
  const details = fs.existsSync(path.join(PIPE, 'nb-details.json'))
    ? JSON.parse(read('nb-details.json'))
    : {};

  console.log(`榜单条目：col=${col.size} qol=${qol.size} crime=${crime.size} health=${health.size} pollution=${pollution.size}`);
  console.log(`详情缓存：${Object.keys(details).length}`);

  const cities = REGIONS.flatMap((r) =>
    JSON.parse(fs.readFileSync(path.join(ROOT, `${r}.json`), 'utf8')).map((c) => ({ c, region: r })),
  );

  const byRegion = {};
  for (const { c, region } of cities) (byRegion[region] ??= []).push(c);

  const stats = {};
  const samples = {};
  const bump = (k) => (stats[k] = (stats[k] ?? 0) + 1);
  const sample = (k, v) => ((samples[k] ??= []), samples[k].length < 8 && samples[k].push(v));

  for (const { c } of cities) {
    const cn = COUNTRY_EN[c.countryCode] ?? '';
    const ck = fold(cn);
    const keys = [c.nameEn, ...(EXTRA_NAME[c.id] ?? [])].filter(Boolean).map((n) => ckey(normCity(n), ck));

    const colHit = keys.map((k) => col.get(k)).find(Boolean) ?? null;
    const qolHit = keys.map((k) => qol.get(k)).find(Boolean) ?? null;
    const crimeHit = keys.map((k) => crime.get(k)).find(Boolean) ?? null;
    const healthHit = keys.map((k) => health.get(k)).find(Boolean) ?? null;
    const pollHit = keys.map((k) => pollution.get(k)).find(Boolean) ?? null;
    const det = details[c.id] ?? null;

    // 成本：优先榜单 col，其次 QOL 的 col 列，再次详情页 pctVsNY 反推
    let livingScore = null;
    if (colHit) livingScore = colHit.col;
    else if (qolHit) livingScore = qolHit.col;
    else if (det?.pctVsNY != null) livingScore = Math.round(det.pctVsNY * 10) / 10;

    // 六指数（安全优先 QOL，其次 100-crime）
    const safety = qolHit ? qolHit.safety : crimeHit ? Math.round((100 - crimeHit.a) * 10) / 10 : null;
    const healthcareIndex = qolHit ? qolHit.health : healthHit ? healthHit.a : null;
    const pollutionIndex = qolHit ? qolHit.pollution : pollHit ? pollHit.a : null;
    const trafficIndex = qolHit ? qolHit.traffic : null;
    const purchasingPowerIndex = qolHit ? qolHit.pp : colHit ? colHit.pp : null;
    const climateIndex = qolHit ? qolHit.climate : null;
    const housingLevel = det?.rentUSD != null ? Math.round(det.rentUSD * 100) / 100 : null;
    const mealUSD = det?.mealUSD != null ? Math.round(det.mealUSD * 100) / 100 : null;

    const fill = (key, val) => {
      if (c[key] == null && val != null) {
        bump(key);
        if (key !== 'housingLevel' && key !== 'mealUSD' && key !== 'healthcareIndex' && key !== 'pollutionIndex' && key !== 'trafficIndex' && key !== 'climateIndex') {
          sample(key, `${c.id}=${val}`);
        }
        if (WRITE) c[key] = val;
      }
    };
    fill('livingScore', livingScore);
    fill('safety', safety);
    fill('healthcareIndex', healthcareIndex);
    fill('pollutionIndex', pollutionIndex);
    fill('trafficIndex', trafficIndex);
    fill('purchasingPowerIndex', purchasingPowerIndex);
    fill('climateIndex', climateIndex);
    fill('housingLevel', housingLevel);
    fill('mealUSD', mealUSD);
  }

  console.log('\n=== 可补全统计（仅当前为 null 的字段）===');
  for (const k of ['livingScore', 'safety', 'healthcareIndex', 'pollutionIndex', 'trafficIndex', 'purchasingPowerIndex', 'climateIndex', 'housingLevel', 'mealUSD']) {
    console.log(`${k.padEnd(22)} 可补 ${String(stats[k] ?? 0).padStart(3)}   样例: ${(samples[k] ?? []).slice(0, 5).join(', ')}`);
  }

  if (WRITE) {
    for (const r of REGIONS) {
      const file = path.join(ROOT, `${r}.json`);
      const orig = fs.readFileSync(file, 'utf8');
      // 保留各文件原有缩进（oceania 为 2 空格，其余为 1）
      const indent = (orig.match(/\[\n( +)\{/) || [])[1]?.length ?? 1;
      const nl = orig.endsWith('\n') ? '\n' : '';
      fs.writeFileSync(file, JSON.stringify(byRegion[r], null, indent) + nl);
    }
    console.log('\n✓ 已写回 6 个城市文件（只增不改）');
  } else {
    console.log('\n(dry-run，未写文件；加 --write 落盘)');
  }
}

main();
