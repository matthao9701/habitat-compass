// 数据管道（第十一轮扩容·方案A 质量优先）：40 座新城选城底座（GeoNames cities15000 CC BY 4.0）
// 输出 /tmp/pipeline/selection3.json —— 40 新城坐标/人口/时区（真实获取）
// 选城口径：全部落在既有 65 国参考库内（CountryCard 可关联）；全部在公开统计
//   「生活成本榜 ∩ 生活质量榜」双榜在列（六指数 + livingScore 可取，质量优先）。
// tags 为编辑标注（与站内标签池同 id，供兴趣维度召回）。
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/pipeline';
fs.mkdirSync(OUT, { recursive: true });

const NEW_CITIES = [
  // ---- 欧洲 +19 ----
  // 意大利 +3
  { id: 'milan', nameZh: '米兰', nameEn: 'Milan', countryZh: '意大利', iso2: 'IT', geoName: 'Milan', tags: ['arts', 'shopping', 'food', 'nightlife'] },
  { id: 'rome', nameZh: '罗马', nameEn: 'Rome', countryZh: '意大利', iso2: 'IT', geoName: 'Rome', tags: ['history', 'arts', 'food', 'culture'] },
  { id: 'turin', nameZh: '都灵', nameEn: 'Turin', countryZh: '意大利', iso2: 'IT', geoName: 'Turin', tags: ['history', 'food', 'arts', 'coffee'] },
  // 德国 +5
  { id: 'cologne', nameZh: '科隆', nameEn: 'Cologne', countryZh: '德国', iso2: 'DE', geoName: 'Cologne', tags: ['arts', 'food', 'nightlife', 'culture'] },
  { id: 'frankfurt', nameZh: '法兰克福', nameEn: 'Frankfurt', countryZh: '德国', iso2: 'DE', geoName: 'Frankfurt am Main', ascii: 'Frankfurt', tags: ['startup', 'arts', 'food', 'shopping'] },
  { id: 'dusseldorf', nameZh: '杜塞尔多夫', nameEn: 'Düsseldorf', countryZh: '德国', iso2: 'DE', geoName: 'Dusseldorf', ascii: 'Düsseldorf', tags: ['arts', 'shopping', 'food', 'nightlife'] },
  { id: 'stuttgart', nameZh: '斯图加特', nameEn: 'Stuttgart', countryZh: '德国', iso2: 'DE', geoName: 'Stuttgart', tags: ['startup', 'arts', 'food', 'outdoor'] },
  { id: 'nuremberg', nameZh: '纽伦堡', nameEn: 'Nuremberg', countryZh: '德国', iso2: 'DE', geoName: 'Nuremberg', tags: ['history', 'food', 'festivals', 'arts'] },
  // 荷兰 +2
  { id: 'the-hague', nameZh: '海牙', nameEn: 'The Hague', countryZh: '荷兰', iso2: 'NL', geoName: 'The Hague', ascii: 'The Hague', tags: ['history', 'arts', 'beach', 'family'] },
  { id: 'utrecht', nameZh: '乌得勒支', nameEn: 'Utrecht', countryZh: '荷兰', iso2: 'NL', geoName: 'Utrecht', tags: ['history', 'coffee', 'food', 'arts'] },
  // 瑞士 +3
  { id: 'basel', nameZh: '巴塞尔', nameEn: 'Basel', countryZh: '瑞士', iso2: 'CH', geoName: 'Basel', tags: ['arts', 'food', 'history', 'shopping'] },
  { id: 'bern', nameZh: '伯尔尼', nameEn: 'Bern', countryZh: '瑞士', iso2: 'CH', geoName: 'Bern', tags: ['history', 'food', 'nature', 'arts'] },
  { id: 'lausanne', nameZh: '洛桑', nameEn: 'Lausanne', countryZh: '瑞士', iso2: 'CH', geoName: 'Lausanne', tags: ['nature', 'outdoor', 'food', 'arts'] },
  // 奥地利 +1
  { id: 'graz', nameZh: '格拉茨', nameEn: 'Graz', countryZh: '奥地利', iso2: 'AT', geoName: 'Graz', tags: ['history', 'arts', 'food', 'coffee'] },
  // 波兰 +3
  { id: 'warsaw', nameZh: '华沙', nameEn: 'Warsaw', countryZh: '波兰', iso2: 'PL', geoName: 'Warsaw', tags: ['history', 'food', 'nightlife', 'startup'] },
  { id: 'gdansk', nameZh: '格但斯克', nameEn: 'Gdańsk', countryZh: '波兰', iso2: 'PL', geoName: 'Gdansk', ascii: 'Gdańsk', tags: ['history', 'beach', 'food', 'arts'] },
  { id: 'poznan', nameZh: '波兹南', nameEn: 'Poznań', countryZh: '波兰', iso2: 'PL', geoName: 'Poznan', ascii: 'Poznań', tags: ['history', 'food', 'nightlife', 'startup'] },
  // 罗马尼亚 +1
  { id: 'timisoara', nameZh: '蒂米什瓦拉', nameEn: 'Timișoara', countryZh: '罗马尼亚', iso2: 'RO', geoName: 'Timisoara', ascii: 'Timișoara', tags: ['history', 'arts', 'food', 'coffee'] },
  // 挪威 +1
  { id: 'trondheim', nameZh: '特隆赫姆', nameEn: 'Trondheim', countryZh: '挪威', iso2: 'NO', geoName: 'Trondheim', tags: ['nature', 'outdoor', 'food', 'startup'] },

  // ---- 亚洲 +11 ----
  // 中国 +3
  { id: 'beijing', nameZh: '北京', nameEn: 'Beijing', countryZh: '中国', iso2: 'CN', geoName: 'Beijing', tags: ['history', 'food', 'culture', 'shopping'] },
  { id: 'guangzhou', nameZh: '广州', nameEn: 'Guangzhou', countryZh: '中国', iso2: 'CN', geoName: 'Guangzhou', tags: ['food', 'shopping', 'history', 'nightlife'] },
  { id: 'shenzhen', nameZh: '深圳', nameEn: 'Shenzhen', countryZh: '中国', iso2: 'CN', geoName: 'Shenzhen', tags: ['startup', 'shopping', 'food', 'fitness'] },
  // 印度 +4
  { id: 'hyderabad', nameZh: '海得拉巴', nameEn: 'Hyderabad', countryZh: '印度', iso2: 'IN', geoName: 'Hyderabad', tags: ['food', 'startup', 'history', 'street-markets'] },
  { id: 'kolkata', nameZh: '加尔各答', nameEn: 'Kolkata', countryZh: '印度', iso2: 'IN', geoName: 'Kolkata', tags: ['culture', 'arts', 'food', 'history'] },
  { id: 'chennai', nameZh: '金奈', nameEn: 'Chennai', countryZh: '印度', iso2: 'IN', geoName: 'Chennai', tags: ['beach', 'food', 'history', 'arts'] },
  { id: 'ahmedabad', nameZh: '艾哈迈达巴德', nameEn: 'Ahmedabad', countryZh: '印度', iso2: 'IN', geoName: 'Ahmedabad', tags: ['history', 'food', 'street-markets', 'arts'] },
  // 以色列 +1
  { id: 'haifa', nameZh: '海法', nameEn: 'Haifa', countryZh: '以色列', iso2: 'IL', geoName: 'Haifa', tags: ['beach', 'nature', 'food', 'history'] },
  // 哈萨克斯坦 +1
  { id: 'astana', nameZh: '阿斯塔纳', nameEn: 'Astana', countryZh: '哈萨克斯坦', iso2: 'KZ', geoName: 'Astana', ascii: 'Nur-Sultan', tags: ['history', 'arts', 'food', 'startup'] },
  // 土耳其 +1
  { id: 'ankara', nameZh: '安卡拉', nameEn: 'Ankara', countryZh: '土耳其', iso2: 'TR', geoName: 'Ankara', tags: ['history', 'food', 'arts', 'shopping'] },
  // 阿联酋 +1
  { id: 'sharjah', nameZh: '沙迦', nameEn: 'Sharjah', countryZh: '阿联酋', iso2: 'AE', geoName: 'Sharjah', tags: ['history', 'arts', 'food', 'family'] },

  // ---- 美洲 +10 ----
  // 加拿大 +5
  { id: 'edmonton', nameZh: '埃德蒙顿', nameEn: 'Edmonton', countryZh: '加拿大', iso2: 'CA', geoName: 'Edmonton', tags: ['outdoor', 'nature', 'festivals', 'food'] },
  { id: 'winnipeg', nameZh: '温尼伯', nameEn: 'Winnipeg', countryZh: '加拿大', iso2: 'CA', geoName: 'Winnipeg', tags: ['arts', 'food', 'festivals', 'history'] },
  { id: 'halifax', nameZh: '哈利法克斯', nameEn: 'Halifax', countryZh: '加拿大', iso2: 'CA', geoName: 'Halifax', tags: ['beach', 'food', 'history', 'arts'] },
  { id: 'quebec-city', nameZh: '魁北克城', nameEn: 'Quebec City', countryZh: '加拿大', iso2: 'CA', geoName: 'Quebec', ascii: 'Quebec City', tags: ['history', 'food', 'festivals', 'arts'] },
  { id: 'victoria', nameZh: '维多利亚', nameEn: 'Victoria', countryZh: '加拿大', iso2: 'CA', geoName: 'Victoria', tags: ['nature', 'outdoor', 'food', 'arts'] },
  // 墨西哥 +1
  { id: 'queretaro', nameZh: '克雷塔罗', nameEn: 'Querétaro', countryZh: '墨西哥', iso2: 'MX', geoName: 'Queretaro', ascii: 'Querétaro', tags: ['history', 'food', 'arts', 'wine'] },
  // 巴西 +4
  { id: 'brasilia', nameZh: '巴西利亚', nameEn: 'Brasília', countryZh: '巴西', iso2: 'BR', geoName: 'Brasilia', ascii: 'Brasília', tags: ['arts', 'history', 'food', 'startup'] },
  { id: 'porto-alegre', nameZh: '阿雷格里港', nameEn: 'Porto Alegre', countryZh: '巴西', iso2: 'BR', geoName: 'Porto Alegre', tags: ['food', 'nightlife', 'arts', 'coffee'] },
  { id: 'recife', nameZh: '累西腓', nameEn: 'Recife', countryZh: '巴西', iso2: 'BR', geoName: 'Recife', tags: ['beach', 'food', 'culture', 'festivals'] },
  { id: 'campinas', nameZh: '坎皮纳斯', nameEn: 'Campinas', countryZh: '巴西', iso2: 'BR', geoName: 'Campinas', tags: ['food', 'startup', 'coffee', 'arts'] },
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

const out = [];
const fails = [];
for (const c of NEW_CITIES) {
  const g = geoLookup(geo, [c.geoName, c.ascii].filter(Boolean), c.iso2) ?? (c.fallback ? { ...c.fallback, name: c.geoName } : null);
  if (!g) { fails.push(c.id); continue; }
  out.push({ ...c, population: g.pop, lat: g.lat, lng: g.lng, timezone: g.tz });
}
console.log(`GeoNames 未匹配: ${fails.join(',') || '无'}`);
console.log(`选城底座: ${out.length}/${NEW_CITIES.length}`);

const REGION_BY_ISO = {
  IT: 'europe', DE: 'europe', NL: 'europe', CH: 'europe', AT: 'europe', PL: 'europe', RO: 'europe', NO: 'europe',
  CN: 'asia', IN: 'asia', IL: 'asia', KZ: 'asia', TR: 'asia', AE: 'asia',
  CA: 'north-america', MX: 'north-america', BR: 'south-america',
};
const quota = {};
for (const c of out) quota[REGION_BY_ISO[c.iso2]] = (quota[REGION_BY_ISO[c.iso2]] ?? 0) + 1;
console.log('新增大洲分布:', JSON.stringify(quota));

fs.writeFileSync(path.join(OUT, 'selection3.json'), JSON.stringify(out, null, 1));
console.log(`written: ${OUT}/selection3.json`);
