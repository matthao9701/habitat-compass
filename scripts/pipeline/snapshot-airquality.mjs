// 第十轮：Open-Meteo Air Quality API（CC BY 4.0）PM2.5 年均回填 200 城
// 幂等：已带 airQuality 的城市跳过；输出直接写回 src/data/cities/*.json
// 数据：CAMS 全球再分析（2022-07-28 起可得），取 2022-08-01 ~ 2024-12-31 全期均值
// 分档（WHO 2021 年均指导值与过渡目标）：good ≤10 / fair ≤15 / moderate ≤25 / poor >25
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/data/cities';
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];
const START = '2022-08-01';
const END = '2024-12-31';
const PERIOD = '2022-08 ~ 2024-12';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (res.ok) return res.json();
    if (res.status === 429) {
      console.log(`  429 backoff ${url.slice(0, 80)}`);
      await sleep(15000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url.slice(0, 80)}`);
  }
  throw new Error('HTTP 429 persistent');
}

function bandOf(pm25) {
  if (pm25 <= 10) return 'good';
  if (pm25 <= 15) return 'fair';
  if (pm25 <= 25) return 'moderate';
  return 'poor';
}

function main() {
  const files = {};
  let total = 0;
  let done = 0;
  for (const r of REGIONS) {
    files[r] = JSON.parse(fs.readFileSync(path.join(ROOT, `${r}.json`), 'utf8'));
    total += files[r].length;
  }

  const queue = [];
  for (const r of REGIONS) {
    for (const c of files[r]) {
      if (c.airQuality == null) queue.push({ city: c, region: r });
      else done++;
    }
  }
  console.log(`空气管道：已完成 ${done}/${total}，待抓 ${queue.length}`);

  // ---- 坐标解析层：旧 100 城 JSON 无 lat/lng（经纬度历来在 RouteChart 内置表）----
  // 来源 1：selection2.json（本轮 100 新城，GeoNames 坐标）
  // 来源 2：GeoNames cities15000.txt 全表（34k 行）按 fold(name)+ISO2 匹配旧城
  // 来源 3：EXTRA_COORD 手工兜底（岛名/异名城：GeoNames asciiname 与 nameEn 折叠不一致）
  const EXTRA_COORD = {
    madeira: [32.6669, -16.9241], // Funchal
    mallorca: [39.5696, 2.6502], // Palma
    seville: [37.3891, -5.9845], // Sevilla
    zurich: [47.3769, 8.5417],
    bali: [-8.6705, 115.2126], // Denpasar
    penang: [5.4141, 100.3288], // George Town
    goa: [15.4909, 73.8278], // Panaji
    cebu: [10.3157, 123.8854],
    marrakech: [31.6295, -7.9811], // Marrakesh
  };
  const coord = new Map();
  const sel = JSON.parse(fs.readFileSync('/tmp/pipeline/selection2.json', 'utf8'));
  for (const s of sel.cities ?? sel) coord.set(s.id, [s.lat, s.lng]);
  const fold = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ø/g, 'o')
      .replace(/ł/g, 'l')
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]/g, '');
  const geoIndex = new Map(); // fold(name)|cc -> [lat, lng]（GeoNames 按人口降序，首个即最大城）
  if (fs.existsSync('/tmp/pipeline/cities15000.txt')) {
    for (const line of fs.readFileSync('/tmp/pipeline/cities15000.txt', 'utf8').split('\n')) {
      const f = line.split('\t');
      if (f.length < 15) continue;
      const key = `${fold(f[2])}|${f[8]}`; // f[2]=asciiname f[8]=country code
      if (!geoIndex.has(key)) geoIndex.set(key, [parseFloat(f[4]), parseFloat(f[5])]);
    }
  }
  let coordMiss = [];
  for (const { city } of queue) {
    if (coord.has(city.id)) continue;
    if (EXTRA_COORD[city.id]) {
      coord.set(city.id, EXTRA_COORD[city.id]);
      continue;
    }
    const hit = geoIndex.get(`${fold(city.nameEn)}|${city.countryCode}`) ?? geoIndex.get(`${fold(city.nameEn)}|${city.countryEn}`);
    if (hit) coord.set(city.id, hit);
    else coordMiss.push(city.id);
  }
  if (coordMiss.length) console.log(`  坐标未解析（跳过）: ${coordMiss.join(', ')}`);

  (async () => {
    let n = 0;
    for (const { city, region } of queue) {
      const c0 = coord.get(city.id);
      if (!c0) continue;
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c0[0].toFixed(4)}&longitude=${c0[1].toFixed(4)}&hourly=pm2_5&start_date=${START}&end_date=${END}&timezone=UTC`;
        const j = await get(url);
        const vals = (j.hourly?.pm2_5 ?? []).filter((v) => typeof v === 'number' && Number.isFinite(v));
        if (vals.length < 1000) {
          console.log(`  ${city.id}: 有效样本不足（${vals.length}）`);
          continue;
        }
        const pm25 = Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
        city.airQuality = { pm25, band: bandOf(pm25), period: PERIOD };
        n++;
        if (n % 20 === 0) {
          for (const r of REGIONS) fs.writeFileSync(path.join(ROOT, `${r}.json`), JSON.stringify(files[r], null, 1));
          console.log(`  progress ${n}/${queue.length}`);
        }
      } catch (e) {
        console.log(`  ${city.id}: ERR ${e.message}`);
      }
      await sleep(400); // Open-Meteo 免费档 600 req/min，400ms 足够保守
    }
    for (const r of REGIONS) fs.writeFileSync(path.join(ROOT, `${r}.json`), JSON.stringify(files[r], null, 1));
    console.log(`空气管道完成：本轮新增 ${n}/${queue.length}`);
  })();
}

main();
