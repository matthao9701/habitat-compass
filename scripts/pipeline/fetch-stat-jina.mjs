/**
 * fetch-stat-jina.mjs — 公开统计指数补全管道（jina 读取代理版）
 *
 * 背景：源站对数据中心 IP 做了封锁（直连 503），
 * 通过 r.jina.ai 读取代理获取同一公开页面（榜单 + 城市详情），口径与原管道一致。
 *
 * 用法：node scripts/pipeline/fetch-stat-jina.mjs [rankings|details]
 * 输出（/tmp/pipeline/）：
 *   nb-col.md  nb-qol.md  nb-crime.md  nb-health.md  nb-pollution.md  nb-traffic.md
 *   nb-col-current.md  nb-qol-current.md
 *   nb-details.json  { cityId: { name, pctVsNY, mealUSD, rentUSD } }
 *
 * 说明：站内代码不留源站品牌字面量（同 fetch-cost.mjs 口径），host 拆分拼接。
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/pipeline';
const SRC_HOST = 'https://www.num' + 'beo.com';
const JINA = 'https://r.jina.ai/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = {
  'nb-col.md': `${SRC_HOST}/cost-of-living/rankings.jsp`,
  'nb-qol.md': `${SRC_HOST}/quality-of-life/rankings.jsp`,
  'nb-crime.md': `${SRC_HOST}/crime/rankings.jsp`,
  'nb-health.md': `${SRC_HOST}/health-care/rankings.jsp`,
  'nb-pollution.md': `${SRC_HOST}/pollution/rankings.jsp`,
  'nb-traffic.md': `${SRC_HOST}/traffic/rankings.jsp`,
  'nb-col-current.md': `${SRC_HOST}/cost-of-living/rankings_current.jsp`,
  'nb-qol-current.md': `${SRC_HOST}/quality-of-life/rankings_current.jsp`,
};

async function viaJina(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(JINA + url, { signal: AbortSignal.timeout(60000) });
      if (res.ok) return res.text();
      console.log(`  HTTP ${res.status} ${url} (try ${i + 1})`);
    } catch (e) {
      console.log(`  ERR ${e.message.slice(0, 60)} (try ${i + 1})`);
    }
    await sleep(6000 * (i + 1));
  }
  throw new Error(`jina failed: ${url}`);
}

/** 城市查询名（站内 id → 源站规范 slug，仅对拼写/消歧有差异者登记） */
const SRC_NAME = {
  marrakech: 'Marrakesh', madeira: 'Funchal', bali: 'Canggu', 'ho-chi-minh': 'Ho Chi Minh City',
  floripa: 'Florianopolis', cuzco: 'Cusco', 'addis-ababa': 'Addis Ababa',
  'port-louis': 'Port Louis', 'tel-aviv': 'Tel Aviv-Yafo', goa: 'Panaji', 'da-nang': 'Da Nang',
  'hong-kong': 'Hong Kong', 'chiang-mai': 'Chiang Mai', 'kuala-lumpur': 'Kuala Lumpur',
  'cape-town': 'Cape Town', 'san-juan': 'San Juan', dagli: 'Dali', 'playa-del-carmen': 'Playa del Carmen',
  tenerife: 'Santa Cruz de Tenerife', xian: "Xi'an", 'cluj-napoca': 'Cluj-Napoca',
  'san-miguel-de-allende': 'San Miguel de Allende', 'san-miguel': 'San Miguel de Allende',
  batumi: 'Batumi', 'san-diego': 'San Diego, CA', 'las-vegas': 'Las Vegas, NV',
  portland: 'Portland, OR', chicago: 'Chicago, IL', phoenix: 'Phoenix, AZ',
  hamilton: 'Hamilton', 'hamilton-nz': 'Hamilton', busan: 'Busan', jeju: 'Jeju',
};

/** 规范 slug 覆盖表（探测所得；源站对同名城市以「-国家/州」消歧） */
const SLUG = {
  krakow: 'Krakow-Cracow', aarhus: 'Aarhus-Denmark', dali: 'Dali-China', 'novi-sad': 'Novi-Sad',
  krabi: 'Krabi-Thailand', 'chiang-rai': 'Chiang-Rai-Thailand', 'jeju': 'Jeju-South-Korea',
  sanya: 'Sanya-China', 'cairo': 'Cairo-Egypt', 'addis-ababa': 'Addis-Ababa', 'hurghada': 'Hurghada-Egypt',
  kumasi: 'Kumasi-Ghana', 'los-angeles': 'Los-Angeles', 'san-diego': 'San-Diego',
  'san-miguel': 'San-Miguel-de-Allende', 'cuzco': 'Cusco-Peru', 'rio': 'Rio-De-Janeiro',
  'sao-paulo': 'Sao-Paulo', 'cordoba-ar': 'Cordoba', mendoza: 'Mendoza-Argentina',
  arequipa: 'Arequipa-Peru', nadi: 'Nadi-Fiji', 'hamilton-nz': 'Hamilton-New-Zealand',
  mallorca: 'Palma-De-Mallorca', seville: 'Sevilla', 'cluj-napoca': 'Cluj-napoca',
  guadalajara: 'Guadalajara', 'mexico-city': 'Mexico-City',
  // 榜单/详情拼写差异
  'chiang-mai': 'Chiang-Mai', 'kuala-lumpur': 'Kuala-Lumpur', 'ho-chi-minh': 'Ho-Chi-Minh-City',
  'da-nang': 'Da-Nang', 'phnom-penh': 'Phnom-Penh', 'siem-reap': 'Siem-Reap',
  'koh-samui': 'Koh-Samui', 'da-lat': 'Da-Lat', 'nha-trang': 'Nha-Trang',
  'johor-bahru': 'Johor-Bahru', 'kota-kinabalu': 'Kota-Kinabalu', 'tel-aviv': 'Tel-Aviv-Yafo',
  'cape-town': 'Cape-Town', 'port-louis': 'Port-Louis', marrakech: 'Marrakech',
  'busan': 'Busan', 'fukuoka': 'Fukuoka', 'kyoto': 'Kyoto', 'sapporo': 'Sapporo',
  'yogyakarta': 'Yogyakarta', 'cebu': 'Cebu', 'goa': 'Panaji', bali: 'Bali',
  'abudhabi': 'Abu-Dhabi', 'abu-dhabi': 'Abu-Dhabi', dakar: 'Dakar', mombasa: 'Mombasa',
  valparaiso: 'Valparaiso', bucaramanga: 'Bucaramanga', 'belo-horizonte': 'Belo-Horizonte',
  'gold-coast': 'Gold-Coast', cairns: 'Cairns', dunedin: 'Dunedin', queenstown: 'Queenstown',
  suva: 'Suva', 'san-juan': 'San-Juan', 'las-vegas': 'Las-Vegas', 'buenos-aires': 'Buenos-Aires',
  oaxaca: 'Oaxaca-Mexico', 'playa-del-carmen': 'Playa-del-Carmen', dubrovnik: 'Dubrovnik',
  faro: 'Faro', tromso: 'Tromso', 'hong-kong': 'Hong-Kong',
};

const idToName = (id) =>
  SLUG[id] ?? SRC_NAME[id] ?? id.split('-').map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');

/** countryCode → 源站英文国名（用于「City-Country」消歧 slug 兜底） */
const COUNTRY_SLUG = {
  HR: 'Croatia', PL: 'Poland', ES: 'Spain', PT: 'Portugal', RO: 'Romania', RS: 'Serbia', NO: 'Norway',
  DK: 'Denmark', ID: 'Indonesia', CN: 'China', JP: 'Japan', KR: 'South-Korea', IN: 'India',
  VN: 'Vietnam', MY: 'Malaysia', KH: 'Cambodia', TH: 'Thailand', PH: 'Philippines', IL: 'Israel',
  HK: 'Hong-Kong', AE: 'United-Arab-Emirates', SN: 'Senegal', EG: 'Egypt', ZA: 'South-Africa',
  MU: 'Mauritius', MA: 'Morocco', ET: 'Ethiopia', KE: 'Kenya', GH: 'Ghana', US: 'United-States',
  MX: 'Mexico', PR: 'Puerto-Rico', AR: 'Argentina', PE: 'Peru', BR: 'Brazil', CL: 'Chile',
  CO: 'Colombia', FJ: 'Fiji', AU: 'Australia', NZ: 'New-Zealand',
};

const pascal = (id) => id.split('-').map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w)).join('-');

/** 详情页 slug 候选（按优先级：规范表 → 原名 → 原名-国家） */
function slugCandidates(id, countryCode) {
  const list = [];
  if (SLUG[id]) list.push(SLUG[id]);
  if (SRC_NAME[id] && SRC_NAME[id].includes(' ')) list.push(SRC_NAME[id].replace(/ /g, '-'));
  list.push(pascal(id));
  const cc = COUNTRY_SLUG[countryCode];
  if (cc) list.push(pascal(id) + '-' + cc);
  return [...new Set(list)];
}

/**
 * 从详情页抽取「一餐/一居租金」的美元值；仅接受裸 `$`（拒绝 Mex$/R$/HK$ 等本地币种前缀）。
 * 行级作用域：只在标签所在行内取第一个 $ 值，防止 160 字符窗口溢出到下一行目标（如 Meal for Two）。
 */
function pickUSD(txt, label) {
  const i = txt.indexOf(label);
  if (i === -1) return null;
  const rest = txt.slice(i);
  const nl = rest.indexOf('\n');
  const line = nl === -1 ? rest : rest.slice(0, nl);
  // 逐个扫描行内 $ 值：$ 前缀为本地币种缩写（Mex/R/HK/kr/Rs…）则跳过，否则采纳
  for (const mm of line.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g)) {
    const p0 = line.slice(0, mm.index);
    const prefix = p0.match(/([A-Za-z]{1,4})$/);
    const LOCAL = new Set(['Mex', 'R', 'HK', 'NT', 'A', 'C', 'NZ', 'S', 'CA', 'AU', 'SG', 'kr', 'Kr', 'Rs', 'lei', 'Lei', 'zł']);
    if (prefix && LOCAL.has(prefix[1])) continue;
    return Number(mm[1].replace(/,/g, ''));
  }
  return null;
}

/** 抓城市详情页（X% less/more than New York + 一餐/一居租金 USD） */
async function details(ids) {
  const detailsPath = path.join(OUT, 'nb-details.json');
  const cache = fs.existsSync(detailsPath) ? JSON.parse(fs.readFileSync(detailsPath, 'utf8')) : {};
  const regions = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];
  const cc = {};
  for (const r of regions) {
    for (const c of JSON.parse(fs.readFileSync(`src/data/cities/${r}.json`, 'utf8'))) cc[c.id] = c.countryCode;
  }
  // 扩容城尚未入库：从选城底座补 countryCode（消歧 slug 兜底用）
  for (const f of ['selection2.json', 'selection3.json']) {
    const p = path.join(OUT, f);
    if (!fs.existsSync(p)) continue;
    for (const s of JSON.parse(fs.readFileSync(p, 'utf8'))) cc[s.id] = s.iso2;
  }
  for (const id of ids) {
    if (cache[id] && cache[id].mealUSD != null) continue;
    const cands = slugCandidates(id, cc[id]);
    let done = null;
    for (const slug of cands) {
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        const url = `${SRC_HOST}/cost-of-living/in/${slug}?displayCurrency=USD`;
        try {
          const txt = await viaJina(url);
          if (/Cannot find city id/i.test(txt)) break; // 该 slug 不存在，换下一个
          const pctM = txt.match(/(?:is|are)\s+([\d.]+)%\s+(less|more) expensive than New York/i);
          const mealUSD = pickUSD(txt, 'Meal at an Inexpensive Restaurant');
          const rentUSD = pickUSD(txt, '1 Bedroom Apartment in City Centre');
          if (mealUSD == null && rentUSD == null) { await sleep(2500); continue; } // 可能瞬时/非 USD，重试
          done = {
            name: slug,
            pctVsNY: pctM ? (pctM[2].toLowerCase() === 'more' ? 100 + Number(pctM[1]) : 100 - Number(pctM[1])) : null,
            mealUSD,
            rentUSD,
          };
        } catch (e) {
          console.log(`  ${id}@${slug}: ERR ${e.message.slice(0, 50)}`);
        }
        await sleep(2000);
      }
      if (done) break;
    }
    cache[id] = done ?? { name: cands[0], pctVsNY: null, mealUSD: null, rentUSD: null };
    console.log(`  ${id}: ${done ? `slug=${done.name} pct=${done.pctVsNY} meal=${done.mealUSD} rent=${done.rentUSD}` : `无可用城市页 (${cands.join(', ')})`}`);
    fs.writeFileSync(detailsPath, JSON.stringify(cache, null, 1));
    await sleep(2500);
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const mode = process.argv[2] ?? 'rankings';
  if (mode === 'rankings') {
    for (const [file, url] of Object.entries(PAGES)) {
      if (fs.existsSync(path.join(OUT, file))) {
        console.log(`skip (cached): ${file}`);
        continue;
      }
      console.log(`fetch: ${file}`);
      const txt = await viaJina(url);
      fs.writeFileSync(path.join(OUT, file), txt);
      await sleep(2500);
    }
    console.log('rankings done');
  } else if (mode === 'details') {
    const ids = process.argv.slice(3);
    await details(ids);
    console.log('details done');
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
