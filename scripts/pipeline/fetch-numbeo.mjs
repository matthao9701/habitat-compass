// 数据管道 2/5：Numbeo 公开指数（引用口径，NYC=100）
// 用法：node scripts/pipeline/fetch-numbeo.mjs [batch] [batchSize]
//   无参 → 只拉两张 rankings 表并解析全量指数，输出 /tmp/pipeline/numbeo-rankings.json
//   带参 → 在此基础上逐城爬详情页第 [batch*batchSize, (batch+1)*batchSize) 个城市，
//          累积写 /tmp/pipeline/numbeo-details.json
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/pipeline';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36';

const CITY_COUNTRY = {
  lisbon: 'Portugal', porto: 'Portugal', madeira: 'Portugal',
  barcelona: 'Spain', mallorca: 'Spain', valencia: 'Spain', madrid: 'Spain', seville: 'Spain', malaga: 'Spain',
  florence: 'Italy', valletta: 'Malta', split: 'Croatia', zagreb: 'Croatia', dubrovnik: 'Croatia',
  athens: 'Greece', budapest: 'Hungary', prague: 'Czech Republic', berlin: 'Germany',
  vienna: 'Austria', amsterdam: 'Netherlands', zurich: 'Switzerland',
  copenhagen: 'Denmark', stockholm: 'Sweden', oslo: 'Norway', helsinki: 'Finland',
  riga: 'Latvia', vilnius: 'Lithuania', tallinn: 'Estonia',
  krakow: 'Poland', bucharest: 'Romania', belgrade: 'Serbia',
  tbilisi: 'Georgia', istanbul: 'Turkey',
  bangkok: 'Thailand','chiang-mai': 'Thailand', phuket: 'Thailand',
  bali: 'Indonesia', penang: 'Malaysia', 'kuala-lumpur': 'Malaysia', singapore: 'Singapore',
  'ho-chi-minh': 'Vietnam', 'da-nang': 'Vietnam', hanoi: 'Vietnam',
  tokyo: 'Japan', seoul: 'South Korea', taipei: 'Taiwan',
  shanghai: 'China', chengdu: 'China', dali: 'China', fukuoka: 'Japan', kyoto: 'Japan', busan: 'South Korea',
  'hong-kong': 'Hong Kong', bangalore: 'India', goa: 'India', colombo: 'Sri Lanka',
  dubai: 'United Arab Emirates', 'tel-aviv': 'Israel', amman: 'Jordan', yerevan: 'Armenia', almaty: 'Kazakhstan',
  'mexico-city': 'Mexico', merida: 'Mexico', 'playa-del-carmen': 'Mexico', cancun: 'Mexico', oaxaca: 'Mexico',
  'los-angeles': 'United States', miami: 'United States', austin: 'United States',
  vancouver: 'Canada', toronto: 'Canada', 'san-juan': 'Puerto Rico',
  medellin: 'Colombia', bogota: 'Colombia', 'buenos-aires': 'Argentina',
  rio: 'Brazil', lima: 'Peru', cuzco: 'Peru', santiago: 'Chile', montevideo: 'Uruguay', floripa: 'Brazil',
  marrakech: 'Morocco', 'cape-town': 'South Africa', johannesburg: 'South Africa',
  cairo: 'Egypt', nairobi: 'Kenya', kigali: 'Rwanda', 'addis-ababa': 'Ethiopia',
  dakar: 'Senegal', accra: 'Ghana', 'port-louis': 'Mauritius',
  sydney: 'Australia', melbourne: 'Australia', brisbane: 'Australia', perth: 'Australia',
  auckland: 'New Zealand', wellington: 'New Zealand', nadi: 'Fiji',
  // ---- 第十轮扩容 100 新城 ----
  coimbra: 'Portugal', braga: 'Portugal', faro: 'Portugal',
  bilbao: 'Spain', granada: 'Spain', tenerife: 'Spain',
  bologna: 'Italy', naples: 'Italy', palermo: 'Italy', catania: 'Italy', verona: 'Italy', pisa: 'Italy',
  hamburg: 'Germany', munich: 'Germany', leipzig: 'Germany',
  rotterdam: 'Netherlands', geneva: 'Switzerland', salzburg: 'Austria',
  brno: 'Czech Republic', wroclaw: 'Poland', 'cluj-napoca': 'Romania',
  thessaloniki: 'Greece', rijeka: 'Croatia', 'novi-sad': 'Serbia',
  gothenburg: 'Sweden', bergen: 'Norway', tromso: 'Norway', aarhus: 'Denmark',
  tampere: 'Finland', kaunas: 'Lithuania', tartu: 'Estonia', sliema: 'Malta', debrecen: 'Hungary',
  pattaya: 'Thailand', 'ko-samui': 'Thailand', krabi: 'Thailand', 'chiang-rai': 'Thailand',
  'da-lat': 'Vietnam', 'nha-trang': 'Vietnam',
  jakarta: 'Indonesia', yogyakarta: 'Indonesia',
  'johor-bahru': 'Malaysia', 'kota-kinabalu': 'Malaysia',
  manila: 'Philippines', davao: 'Philippines',
  osaka: 'Japan', sapporo: 'Japan', jeju: 'South Korea', kaohsiung: 'Taiwan',
  kunming: 'China', sanya: 'China', xian: 'China', hangzhou: 'China',
  delhi: 'India', mumbai: 'India', pune: 'India', jaipur: 'India',
  'abu-dhabi': 'United Arab Emirates', jerusalem: 'Israel', batumi: 'Georgia',
  antalya: 'Turkey', izmir: 'Turkey', 'siem-reap': 'Cambodia',
  guadalajara: 'Mexico', monterrey: 'Mexico', 'san-miguel-de-allende': 'Mexico',
  'san-diego': 'United States', 'las-vegas': 'United States', portland: 'United States',
  chicago: 'United States', phoenix: 'United States',
  montreal: 'Canada', calgary: 'Canada', ottawa: 'Canada',
  'sao-paulo': 'Brazil', 'belo-horizonte': 'Brazil', curitiba: 'Brazil',
  cordoba: 'Argentina', mendoza: 'Argentina', valparaiso: 'Chile',
  cali: 'Colombia', bucaramanga: 'Colombia', arequipa: 'Peru',
  alexandria: 'Egypt', hurghada: 'Egypt', casablanca: 'Morocco', tangier: 'Morocco',
  pretoria: 'South Africa', durban: 'South Africa', mombasa: 'Kenya', kumasi: 'Ghana',
  adelaide: 'Australia', canberra: 'Australia', 'gold-coast': 'Australia', hobart: 'Australia', cairns: 'Australia',
  hamilton: 'New Zealand', christchurch: 'New Zealand', dunedin: 'New Zealand', queenstown: 'New Zealand',
  suva: 'Fiji',
};

// Numbeo 上的城市拼写与排名表/详情 URL 名
const NUMBEO_NAME = {
  marrakech: 'Marrakesh', madeira: 'Funchal', bali: 'Canggu', 'ho-chi-minh': 'Ho Chi Minh City',
  bangalore: 'Bangalore', floripa: 'Florianopolis', cuzco: 'Cusco', 'addis-ababa': 'Addis Ababa',
  'port-louis': 'Port Louis', 'tel-aviv': 'Tel Aviv-Yafo', goa: 'Panaji', 'da-nang': 'Da Nang',
  'hong-kong': 'Hong Kong', phuket: 'Phuket', 'chiang-mai': 'Chiang Mai', 'kuala-lumpur': 'Kuala Lumpur',
  'cape-town': 'Cape Town', 'san-juan': 'San Juan', dali: 'Dali', 'playa-del-carmen': 'Playa del Carmen',
  tenerife: 'Santa Cruz de Tenerife', xian: "Xi'an", 'cluj-napoca': 'Cluj-Napoca', 'san-miguel-de-allende': 'San Miguel de Allende',
  batumi: 'Batumi, Ajara', 'san-diego': 'San Diego, CA', 'las-vegas': 'Las Vegas, NV',
  portland: 'Portland, OR', chicago: 'Chicago, IL', phoenix: 'Phoenix, AZ',
};

function stripTags(s) {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&#8364;|&euro;/g, 'EUR')
    .replace(/&#36;|&dollar;/g, 'USD')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 解析 rankings 页 → [{ city, country, indices: {列名: number} }] */
function parseRankings(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRe.exec(html))) {
    const row = m[1];
    if (!row.includes('cityOrCountryInIndicesTable')) continue;
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => stripTags(x[1]));
    const cityTd = tds.find((t) => t.includes(','));
    if (!cityTd) continue;
    const nums = tds.filter((t) => /^-?\d+(\.\d+)?$/.test(t)).map(Number);
    // 第一列是 rank，其余为各指数列
    const comma = cityTd.lastIndexOf(', ');
    const city = cityTd.slice(0, comma).trim();
    const country = cityTd.slice(comma + 2).trim();
    rows.push({ city, country, nums });
  }
  return rows;
}

/** rankings 表头列名 */
function parseHeaders(html) {
  const thRe = /<th[^>]*>([\s\S]*?)<\/th>/g;
  const out = [];
  let m;
  while ((m = thRe.exec(html))) {
    const t = stripTags(m[1]);
    if (t) out.push(t);
  }
  return out;
}

async function get(url) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
    if (res.ok) return res.text();
    if (res.status === 429) {
      console.log(`  429 backoff ${url}`);
      await new Promise((r) => setTimeout(r, 25000 * (i + 1)));
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  throw new Error(`HTTP 429 persistent ${url}`);
}

async function main() {
  const batchArg = process.argv[2];
  const batchSize = Number(process.argv[3] ?? 25);

  // ---- 1. rankings ----
  const rankingsPath = path.join(OUT, 'numbeo-rankings.json');
  if (batchArg === undefined || !fs.existsSync(rankingsPath)) {
    const [colHtml, qolHtml] = await Promise.all([
      get('https://www.numbeo.com/cost-of-living/rankings.jsp'),
      get('https://www.numbeo.com/quality-of-life/rankings.jsp'),
    ]);
    const colHeads = parseHeaders(colHtml).filter((h) => h.toLowerCase().includes('index'));
    const qolHeads = parseHeaders(qolHtml).filter((h) => h.toLowerCase().includes('index'));
    console.log('COL headers:', colHeads.join(' | '));
    console.log('QOL headers:', qolHeads.join(' | '));
    const colRows = parseRankings(colHtml);
    const qolRows = parseRankings(qolHtml);
    console.log(`rankings rows: col=${colRows.length} qol=${qolRows.length}`);
    fs.writeFileSync(rankingsPath, JSON.stringify({ colHeads, qolHeads, colRows, qolRows }, null, 1));
  }

  // ---- 2. 详情页顺序抓取（--details 全量；数字 batch 分批） ----
  if (batchArg === undefined) {
    console.log('rankings done. run with --details for detail pages.');
    return;
  }
  const batch = batchArg === '--details' ? 0 : Number(batchArg);
  const detailsPath = path.join(OUT, 'numbeo-details.json');
  const details = fs.existsSync(detailsPath) ? JSON.parse(fs.readFileSync(detailsPath, 'utf8')) : {};

  // 组装 100 城的详情 URL 名（cityId → "Name, Country"）
  const rank = JSON.parse(fs.readFileSync(rankingsPath, 'utf8'));
  const byCountry = new Map();
  for (const r of rank.colRows) {
    const key = `${r.city.toLowerCase()}, ${r.country.toLowerCase()}`;
    byCountry.set(key, r);
  }
  const order = Object.keys(CITY_COUNTRY);
  let scope = order;
  if (batchArg === '--new') {
    // --new：只抓当前城市库尚不存在的城（第十轮扩容增量）
    const existingIds = new Set(
      ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania']
        .flatMap((r) => JSON.parse(fs.readFileSync(`src/data/cities/${r}.json`, 'utf8')))
        .map((c) => c.id),
    );
    scope = order.filter((id) => !existingIds.has(id));
    console.log(`--new scope: ${scope.length}/${order.length}`);
  }
  const list = batchArg === '--new' ? scope : (batchArg === '--details' ? order : scope.slice(batch * batchSize, (batch + 1) * batchSize));
  const targets = batchArg === '--new' ? list : (batchArg === '--details' ? order : list);

  for (const id of targets) {
    if (details[id]) continue;
    const country = CITY_COUNTRY[id];
    const name = NUMBEO_NAME[id] ?? idToName(id);
    let ok = false;
    try {
      const html = await get(`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(name).replace(/%20/g, '+')}?currency=USD&displayCurrency=USD`);
      const meal = extractPrice(html, 'Meal at an Inexpensive Restaurant');
      const rent = extractPrice(html, '1 Bedroom Apartment in City Centre');
      if (meal !== null || rent !== null) {
        details[id] = { mealUSD: meal, rent1brUSD: rent, source: name };
        ok = true;
      }
    } catch (e) {
      console.log(`  ${id}: ERR ${e.message}`);
    }
    console.log(`  ${id}: ${ok ? `meal=${details[id]?.mealUSD} rent=${details[id]?.rent1brUSD}` : 'null'}`);
    fs.writeFileSync(detailsPath, JSON.stringify(details, null, 1));
    await new Promise((r) => setTimeout(r, 3200));
  }
  console.log(`batch ${batch} done, details cached: ${Object.keys(details).length}/${order.length}`);
}

/** cityId → Numbeo 查询名兜底（Pascal Case 化） */
function idToName(id) {
  const special = NUMBEO_NAME[id];
  if (special) return special;
  return id
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** 从详情页 HTML 提取某条目的 USD 价格 */
function extractPrice(html, label) {
  const idx = html.indexOf(label);
  if (idx === -1) return null;
  const seg = html.slice(idx, idx + 600);
  const m = seg.match(/first_currency[^>]*>([\s\S]*?)<\/span>/);
  if (!m) return null;
  const raw = m[1].replace(/&#\d+;/g, '').replace(/[^0-9.]/g, '');
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
