// 数据管道（第十二轮扩容·接入 WhereNext）：30 座新城选城底座（GeoNames cities15000 CC BY 4.0）
// 输出 /tmp/pipeline/selection4.json —— 30 新城坐标/人口/时区（真实获取）
// 选城口径（质量优先 + 数据源扩充）：
//   1. 全部落在既有 65 国参考库内（CountryCard 可关联）；
//   2. 全部来自 WhereNext「Best Value Cities 2026」374 城数据集（CC BY 4.0，
//      ICP 2021 PLI 锚定的 costIndex/qualityScore）——首批接入的候选补充数据源；
//   3. 与公开统计双榜（生活成本榜 ∩ 生活质量榜）交叉命名对齐，尽量保证指数可取；
//   4. 区域平衡 + 优先补足城市数 ≤3 的国家。
// tags 为编辑标注（与站内标签池同 id）。
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/pipeline';
fs.mkdirSync(OUT, { recursive: true });

const NEW_CITIES = [
  // ---- 亚洲 +8 ----
  { id: 'incheon', nameZh: '仁川', nameEn: 'Incheon', countryZh: '韩国', iso2: 'KR', geoName: 'Incheon', tags: ['beach', 'food', 'shopping', 'startup'] },
  { id: 'daejeon', nameZh: '大田', nameEn: 'Daejeon', countryZh: '韩国', iso2: 'KR', geoName: 'Daejeon', tags: ['startup', 'nature', 'food', 'family'] },
  { id: 'taichung', nameZh: '台中', nameEn: 'Taichung', countryZh: '中国台湾', iso2: 'TW', geoName: 'Taichung', tags: ['food', 'arts', 'culture', 'nightlife'] },
  { id: 'tainan', nameZh: '台南', nameEn: 'Tainan', countryZh: '中国台湾', iso2: 'TW', geoName: 'Tainan', tags: ['history', 'food', 'street-markets', 'culture'] },
  { id: 'surabaya', nameZh: '泗水', nameEn: 'Surabaya', countryZh: '印度尼西亚', iso2: 'ID', geoName: 'Surabaya', tags: ['history', 'food', 'street-markets', 'shopping'] },
  { id: 'bandung', nameZh: '万隆', nameEn: 'Bandung', countryZh: '印度尼西亚', iso2: 'ID', geoName: 'Bandung', tags: ['nature', 'food', 'shopping', 'coffee'] },
  { id: 'quezon-city', nameZh: '奎松城', nameEn: 'Quezon City', countryZh: '菲律宾', iso2: 'PH', geoName: 'Quezon City', tags: ['food', 'street-markets', 'shopping', 'family'] },
  { id: 'kandy', nameZh: '康提', nameEn: 'Kandy', countryZh: '斯里兰卡', iso2: 'LK', geoName: 'Kandy', tags: ['nature', 'history', 'tea-culture', 'outdoor'] },

  // ---- 非洲 +2 ----
  { id: 'rabat', nameZh: '拉巴特', nameEn: 'Rabat', countryZh: '摩洛哥', iso2: 'MA', geoName: 'Rabat', tags: ['history', 'beach', 'culture', 'food'] },
  { id: 'curepipe', nameZh: '居尔皮普', nameEn: 'Curepipe', countryZh: '毛里求斯', iso2: 'MU', geoName: 'Curepipe', tags: ['nature', 'outdoor', 'food', 'family'] },

  // ---- 欧洲 +12 ----
  { id: 'malmo', nameZh: '马尔默', nameEn: 'Malmö', countryZh: '瑞典', iso2: 'SE', geoName: 'Malmo', ascii: 'Malmö', tags: ['startup', 'food', 'arts', 'beach'] },
  { id: 'uppsala', nameZh: '乌普萨拉', nameEn: 'Uppsala', countryZh: '瑞典', iso2: 'SE', geoName: 'Uppsala', tags: ['history', 'culture', 'coffee', 'nature'] },
  { id: 'odense', nameZh: '欧登塞', nameEn: 'Odense', countryZh: '丹麦', iso2: 'DK', geoName: 'Odense', tags: ['history', 'arts', 'family', 'cycling'] },
  { id: 'aalborg', nameZh: '奥尔堡', nameEn: 'Aalborg', countryZh: '丹麦', iso2: 'DK', geoName: 'Aalborg', tags: ['history', 'nightlife', 'arts', 'food'] },
  { id: 'linz', nameZh: '林茨', nameEn: 'Linz', countryZh: '奥地利', iso2: 'AT', geoName: 'Linz', tags: ['arts', 'culture', 'food', 'outdoor'] },
  { id: 'plzen', nameZh: '比尔森', nameEn: 'Plzeň', countryZh: '捷克', iso2: 'CZ', geoName: 'Plzen', ascii: 'Plzeň', tags: ['beer-culture', 'history', 'food', 'festivals'] },
  { id: 'ostrava', nameZh: '俄斯特拉发', nameEn: 'Ostrava', countryZh: '捷克', iso2: 'CZ', geoName: 'Ostrava', tags: ['festivals', 'nightlife', 'food', 'history'] },
  { id: 'szeged', nameZh: '塞格德', nameEn: 'Szeged', countryZh: '匈牙利', iso2: 'HU', geoName: 'Szeged', tags: ['history', 'festivals', 'food', 'outdoor'] },
  { id: 'iasi', nameZh: '雅西', nameEn: 'Iași', countryZh: '罗马尼亚', iso2: 'RO', geoName: 'Iasi', ascii: 'Iași', tags: ['history', 'culture', 'food', 'coffee'] },
  { id: 'parnu', nameZh: '派尔努', nameEn: 'Pärnu', countryZh: '爱沙尼亚', iso2: 'EE', geoName: 'Parnu', ascii: 'Pärnu', tags: ['beach', 'wellness', 'nature', 'history'] },
  { id: 'klaipeda', nameZh: '克莱佩达', nameEn: 'Klaipėda', countryZh: '立陶宛', iso2: 'LT', geoName: 'Klaipeda', ascii: 'Klaipėda', tags: ['beach', 'history', 'food', 'outdoor'] },
  { id: 'heraklion', nameZh: '伊拉克利翁', nameEn: 'Heraklion', countryZh: '希腊', iso2: 'GR', geoName: 'Heraklion', tags: ['history', 'beach', 'food', 'culture'] },

  // ---- 美洲 +6 ----
  { id: 'concepcion', nameZh: '康塞普西翁', nameEn: 'Concepción', countryZh: '智利', iso2: 'CL', geoName: 'Concepcion', ascii: 'Concepción', tags: ['music', 'food', 'nightlife', 'nature'] },
  { id: 'la-serena', nameZh: '拉塞雷纳', nameEn: 'La Serena', countryZh: '智利', iso2: 'CL', geoName: 'La Serena', tags: ['beach', 'nature', 'history', 'wine'] },
  { id: 'maldonado', nameZh: '马尔多纳多', nameEn: 'Maldonado', countryZh: '乌拉圭', iso2: 'UY', geoName: 'Maldonado', tags: ['beach', 'wellness', 'food', 'family'] },
  { id: 'rosario', nameZh: '罗萨里奥', nameEn: 'Rosario', countryZh: '阿根廷', iso2: 'AR', geoName: 'Rosario', tags: ['arts', 'nightlife', 'food', 'history'] },
  { id: 'san-francisco', nameZh: '旧金山', nameEn: 'San Francisco', countryZh: '美国', iso2: 'US', geoName: 'San Francisco', tags: ['startup', 'food', 'arts', 'outdoor'] },
  { id: 'denver', nameZh: '丹佛', nameEn: 'Denver', countryZh: '美国', iso2: 'US', geoName: 'Denver', tags: ['outdoor', 'beer-culture', 'fitness', 'startup'] },

  // ---- 大洋洲 +1 / 北欧补位 +1 ----
  { id: 'lautoka', nameZh: '劳托卡', nameEn: 'Lautoka', countryZh: '斐济', iso2: 'FJ', geoName: 'Lautoka', tags: ['beach', 'nature', 'fruit', 'outdoor'] },
  { id: 'espoo', nameZh: '埃斯波', nameEn: 'Espoo', countryZh: '芬兰', iso2: 'FI', geoName: 'Espoo', tags: ['nature', 'outdoor', 'startup', 'family'] },
];

// ---- 解析 GeoNames cities15000.txt（与既有 selection 同口径）----
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

function parseGeo() {
  const rows = fs.readFileSync('/tmp/cities15000.txt', 'utf8').split('\n').filter(Boolean);
  const byKey = new Map();
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

const geo = parseGeo();
const existing = new Set(
  ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania']
    .flatMap((r) => JSON.parse(fs.readFileSync(`src/data/cities/${r}.json`, 'utf8')))
    .map((c) => c.id),
);
const dupIds = NEW_CITIES.filter((c) => existing.has(c.id)).map((c) => c.id);
if (dupIds.length) throw new Error(`与现有城市库重复: ${dupIds.join(',')}`);
// 同名异国消歧：nelson-nz 与既有 nelson（若有）区分；cebu/hamilton 等已规避
const GEO_ALT = { Davao: 'Davao City' };

const out = [];
const fails = [];
for (const c of NEW_CITIES) {
  const cands = [c.geoName, c.ascii, GEO_ALT[c.geoName]].filter(Boolean);
  const g = geoLookup(geo, cands, c.iso2);
  if (!g) { fails.push(c.id); continue; }
  out.push({ ...c, population: g.pop, lat: g.lat, lng: g.lng, timezone: g.tz });
}
console.log(`GeoNames 未匹配: ${fails.join(',') || '无'}`);
console.log(`选城底座: ${out.length}/${NEW_CITIES.length}`);

const REGION_BY_ISO = {
  KR: 'asia', TW: 'asia', ID: 'asia', PH: 'asia', LK: 'asia',
  MA: 'africa', MU: 'africa',
  SE: 'europe', DK: 'europe', AT: 'europe', CZ: 'europe', HU: 'europe', RO: 'europe', EE: 'europe', LT: 'europe', GR: 'europe', FI: 'europe',
  CL: 'south-america', UY: 'south-america', AR: 'south-america', US: 'north-america',
  FJ: 'oceania',
};
const quota = {};
for (const c of out) quota[REGION_BY_ISO[c.iso2]] = (quota[REGION_BY_ISO[c.iso2]] ?? 0) + 1;
console.log('新增大洲分布:', JSON.stringify(quota));

fs.writeFileSync(path.join(OUT, 'selection4.json'), JSON.stringify(out, null, 1));
console.log(`written: ${OUT}/selection4.json`);
