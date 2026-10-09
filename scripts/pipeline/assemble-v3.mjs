// 第十一轮扩容·方案A：把 40 座新城（结构字段）追加到现有 200 城（只增不改）
// 读取：/tmp/pipeline/selection3.json（坐标/人口/时区）+ climate.json + epi.json
// 基底：src/data/cities/*.json（现有城市原样保留，字段值不动）
// 说明：指数（livingScore/safety/healthcare/...）与价格（housingLevel/mealUSD）
//       由 backfill-indices.mjs --write 统一填充；cost/monthlyCostUSD 由 fill-cost.mjs 计算。
import fs from 'node:fs';
import path from 'node:path';

const PIPE = '/tmp/pipeline';
const ROOT = 'src/data/cities';
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];

const ISO_GEO = {
  IT: ['europe', 'southern-europe'], DE: ['europe', 'western-europe'],
  NL: ['europe', 'western-europe'], CH: ['europe', 'western-europe'],
  AT: ['europe', 'western-europe'], PL: ['europe', 'eastern-europe'],
  RO: ['europe', 'eastern-europe'], NO: ['europe', 'northern-europe'],
  CN: ['asia', 'eastern-asia'], IN: ['asia', 'southern-asia'],
  IL: ['asia', 'western-asia'], KZ: ['asia', 'central-asia'],
  TR: ['europe', 'southern-europe'], AE: ['asia', 'western-asia'],
  CA: ['north-america', 'northern-america'], MX: ['north-america', 'central-america'],
  BR: ['south-america', 'south-america'],
};

const COUNTRY_EN = {
  IT: 'Italy', DE: 'Germany', NL: 'Netherlands', CH: 'Switzerland', AT: 'Austria',
  PL: 'Poland', RO: 'Romania', NO: 'Norway', CN: 'China', IN: 'India', IL: 'Israel',
  KZ: 'Kazakhstan', TR: 'Turkey', AE: 'United Arab Emirates', CA: 'Canada', MX: 'Mexico',
  BR: 'Brazil',
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

function main() {
  const selection = JSON.parse(fs.readFileSync(path.join(PIPE, 'selection3.json'), 'utf8'));
  const climate = JSON.parse(fs.readFileSync(path.join(PIPE, 'climate.json'), 'utf8'));
  const epi = JSON.parse(fs.readFileSync(path.join(PIPE, 'epi.json'), 'utf8'));

  const base = new Map();
  for (const r of REGIONS) {
    for (const c of JSON.parse(fs.readFileSync(path.join(ROOT, `${r}.json`), 'utf8'))) base.set(c.id, { city: c, region: r });
  }

  const added = [];
  const misses = { geo: [], cli: [], epi: [] };
  for (const s of selection) {
    const geo = ISO_GEO[s.iso2];
    if (!geo) { misses.geo.push(s.id); continue; }
    if (base.has(s.id)) continue; // 幂等
    const [continent, subregion] = geo;
    const cli = climate[s.id] ?? null;
    if (!cli) misses.cli.push(s.id);
    const e = epi[s.iso2] ?? null;
    if (!e) misses.epi.push(s.id);
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
      population: s.population ?? null,
      timezone: s.timezone ?? null,
      cost: null,
      monthlyCostUSD: null,
      livingScore: null,
      housingLevel: null,
      mealUSD: null,
      visaScore: null,
      visaLabel: null,
      visaStatus: null,
      visaDetail: null,
      internet: null,
      internetMbps: null,
      safety: null,
      healthcareIndex: null,
      pollutionIndex: null,
      trafficIndex: null,
      purchasingPowerIndex: null,
      climateIndex: null,
      climate: null,
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
  if (misses.geo.length) console.log(`缺 ISO_GEO: ${misses.geo.join(' ')}`);
  if (misses.cli.length) console.log(`缺气候: ${misses.cli.join(' ')}`);
  if (misses.epi.length) console.log(`缺 EPI: ${misses.epi.join(' ')}`);

  const outByRegion = {};
  for (const r of REGIONS) outByRegion[r] = [];
  for (const { city, region } of base.values()) outByRegion[region].push(city);
  let total = 0;
  for (const r of REGIONS) {
    const file = path.join(ROOT, `${r}.json`);
    const orig = fs.readFileSync(file, 'utf8');
    const indent = (orig.match(/\[\n( +)\{/) || [])[1]?.length ?? 1;
    const nl = orig.endsWith('\n') ? '\n' : '';
    fs.writeFileSync(file, JSON.stringify(outByRegion[r], null, indent) + nl);
    total += outByRegion[r].length;
    console.log(`${r}: ${outByRegion[r].length}`);
  }
  console.log(`总计 ${total} 城`);
}

main();
