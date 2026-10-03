// 数据管道 1/5：选城底座（GeoNames cities15000 CC BY 4.0）
// 输出 /tmp/pipeline/selection.json —— 61 座新城的坐标/人口/时区（真实获取）
// 分类字段（continent/subregion/中文国名）为 UN M49 标准分类与专名翻译，见 DATA.md
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/pipeline';
fs.mkdirSync(OUT, { recursive: true });

// ---- 61 城扩充清单（不含现有 39 城）----
// geoName: GeoNames asciiname 匹配名；iso2: ISO 3166-1
const NEW_CITIES = [
  // 欧洲 +14（南欧）
  { id: 'seville', nameZh: '塞维利亚', nameEn: 'Seville', countryZh: '西班牙', iso2: 'ES', region: 'europe', subregion: 'southern-europe', geoName: 'Sevilla' },
  { id: 'malaga', nameZh: '马拉加', nameEn: 'Málaga', countryZh: '西班牙', iso2: 'ES', region: 'europe', subregion: 'southern-europe', geoName: 'Málaga', ascii: 'Malaga' },
  { id: 'valletta', nameZh: '瓦莱塔', nameEn: 'Valletta', countryZh: '马耳他', iso2: 'MT', region: 'europe', subregion: 'southern-europe' },
  { id: 'dubrovnik', nameZh: '杜布罗夫尼克', nameEn: 'Dubrovnik', countryZh: '克罗地亚', iso2: 'HR', region: 'europe', subregion: 'southern-europe' },
  // 西欧
  { id: 'vienna', nameZh: '维也纳', nameEn: 'Vienna', countryZh: '奥地利', iso2: 'AT', region: 'europe', subregion: 'western-europe', geoName: 'Wien', ascii: 'Vienna' },
  { id: 'amsterdam', nameZh: '阿姆斯特丹', nameEn: 'Amsterdam', countryZh: '荷兰', iso2: 'NL', region: 'europe', subregion: 'western-europe' },
  { id: 'zurich', nameZh: '苏黎世', nameEn: 'Zurich', countryZh: '瑞士', iso2: 'CH', region: 'europe', subregion: 'western-europe', geoName: 'Zürich', ascii: 'Zuerich' },
  // 北欧
  { id: 'copenhagen', nameZh: '哥本哈根', nameEn: 'Copenhagen', countryZh: '丹麦', iso2: 'DK', region: 'europe', subregion: 'northern-europe', geoName: 'Copenhagen' },
  { id: 'stockholm', nameZh: '斯德哥尔摩', nameEn: 'Stockholm', countryZh: '瑞典', iso2: 'SE', region: 'europe', subregion: 'northern-europe' },
  { id: 'oslo', nameZh: '奥斯陆', nameEn: 'Oslo', countryZh: '挪威', iso2: 'NO', region: 'europe', subregion: 'northern-europe' },
  { id: 'helsinki', nameZh: '赫尔辛基', nameEn: 'Helsinki', countryZh: '芬兰', iso2: 'FI', region: 'europe', subregion: 'northern-europe' },
  { id: 'riga', nameZh: '里加', nameEn: 'Riga', countryZh: '拉脱维亚', iso2: 'LV', region: 'europe', subregion: 'northern-europe' },
  { id: 'vilnius', nameZh: '维尔纽斯', nameEn: 'Vilnius', countryZh: '立陶宛', iso2: 'LT', region: 'europe', subregion: 'northern-europe' },
  // 东欧
  { id: 'krakow', nameZh: '克拉科夫', nameEn: 'Kraków', countryZh: '波兰', iso2: 'PL', region: 'europe', subregion: 'eastern-europe', geoName: 'Kraków', ascii: 'Krakow' },
  { id: 'bucharest', nameZh: '布加勒斯特', nameEn: 'Bucharest', countryZh: '罗马尼亚', iso2: 'RO', region: 'europe', subregion: 'eastern-europe' },
  { id: 'belgrade', nameZh: '贝尔格莱德', nameEn: 'Belgrade', countryZh: '塞尔维亚', iso2: 'RS', region: 'europe', subregion: 'southeastern-europe', geoName: 'Beograd', ascii: 'Belgrade' },
  // 亚洲 +20（东亚）
  { id: 'shanghai', nameZh: '上海', nameEn: 'Shanghai', countryZh: '中国', iso2: 'CN', region: 'asia', subregion: 'eastern-asia' },
  { id: 'chengdu', nameZh: '成都', nameEn: 'Chengdu', countryZh: '中国', iso2: 'CN', region: 'asia', subregion: 'eastern-asia' },
  { id: 'dali', nameZh: '大理', nameEn: 'Dali', countryZh: '中国', iso2: 'CN', region: 'asia', subregion: 'eastern-asia', geoName: 'Dali' },
  { id: 'hong-kong', nameZh: '香港', nameEn: 'Hong Kong', countryZh: '中国香港', iso2: 'HK', region: 'asia', subregion: 'eastern-asia', geoName: 'Hong Kong' },
  { id: 'fukuoka', nameZh: '福冈', nameEn: 'Fukuoka', countryZh: '日本', iso2: 'JP', region: 'asia', subregion: 'eastern-asia' },
  { id: 'kyoto', nameZh: '京都', nameEn: 'Kyoto', countryZh: '日本', iso2: 'JP', region: 'asia', subregion: 'eastern-asia' },
  { id: 'busan', nameZh: '釜山', nameEn: 'Busan', countryZh: '韩国', iso2: 'KR', region: 'asia', subregion: 'eastern-asia' },
  // 东南亚
  { id: 'hanoi', nameZh: '河内', nameEn: 'Hanoi', countryZh: '越南', iso2: 'VN', region: 'asia', subregion: 'southeastern-asia', geoName: 'Hà Nội', ascii: 'Hanoi' },
  { id: 'phnom-penh', nameZh: '金边', nameEn: 'Phnom Penh', countryZh: '柬埔寨', iso2: 'KH', region: 'asia', subregion: 'southeastern-asia' },
  { id: 'cebu', nameZh: '宿务', nameEn: 'Cebu', countryZh: '菲律宾', iso2: 'PH', region: 'asia', subregion: 'southeastern-asia', geoName: 'Cebu City' },
  // 南亚
  { id: 'bangalore', nameZh: '班加罗尔', nameEn: 'Bengaluru', countryZh: '印度', iso2: 'IN', region: 'asia', subregion: 'southern-asia', geoName: 'Bengaluru', ascii: 'Bangalore' },
  { id: 'goa', nameZh: '果阿', nameEn: 'Goa (Panaji)', countryZh: '印度', iso2: 'IN', region: 'asia', subregion: 'southern-asia', geoName: 'Panjim' },
  { id: 'colombo', nameZh: '科伦坡', nameEn: 'Colombo', countryZh: '斯里兰卡', iso2: 'LK', region: 'asia', subregion: 'southern-asia' },
  // 西亚
  { id: 'dubai', nameZh: '迪拜', nameEn: 'Dubai', countryZh: '阿联酋', iso2: 'AE', region: 'asia', subregion: 'western-asia' },
  { id: 'tel-aviv', nameZh: '特拉维夫', nameEn: 'Tel Aviv', countryZh: '以色列', iso2: 'IL', region: 'asia', subregion: 'western-asia' },
  { id: 'amman', nameZh: '安曼', nameEn: 'Amman', countryZh: '约旦', iso2: 'JO', region: 'asia', subregion: 'western-asia' },
  { id: 'yerevan', nameZh: '埃里温', nameEn: 'Yerevan', countryZh: '亚美尼亚', iso2: 'AM', region: 'asia', subregion: 'western-asia' },
  // 中亚
  { id: 'almaty', nameZh: '阿拉木图', nameEn: 'Almaty', countryZh: '哈萨克斯坦', iso2: 'KZ', region: 'asia', subregion: 'central-asia' },
  // 北美 +8（中美/北美/加勒比）
  { id: 'cancun', nameZh: '坎昆', nameEn: 'Cancún', countryZh: '墨西哥', iso2: 'MX', region: 'north-america', subregion: 'central-america', geoName: 'Cancún', ascii: 'Cancun' },
  { id: 'oaxaca', nameZh: '瓦哈卡', nameEn: 'Oaxaca', countryZh: '墨西哥', iso2: 'MX', region: 'north-america', subregion: 'central-america', geoName: 'Oaxaca de Juárez', ascii: 'Oaxaca' },
  { id: 'los-angeles', nameZh: '洛杉矶', nameEn: 'Los Angeles', countryZh: '美国', iso2: 'US', region: 'north-america', subregion: 'northern-america' },
  { id: 'miami', nameZh: '迈阿密', nameEn: 'Miami', countryZh: '美国', iso2: 'US', region: 'north-america', subregion: 'northern-america' },
  { id: 'austin', nameZh: '奥斯汀', nameEn: 'Austin', countryZh: '美国', iso2: 'US', region: 'north-america', subregion: 'northern-america' },
  { id: 'vancouver', nameZh: '温哥华', nameEn: 'Vancouver', countryZh: '加拿大', iso2: 'CA', region: 'north-america', subregion: 'northern-america' },
  { id: 'toronto', nameZh: '多伦多', nameEn: 'Toronto', countryZh: '加拿大', iso2: 'CA', region: 'north-america', subregion: 'northern-america' },
  { id: 'san-juan', nameZh: '圣胡安', nameEn: 'San Juan', countryZh: '波多黎各', iso2: 'PR', region: 'north-america', subregion: 'caribbean' },
  // 南美 +4
  { id: 'santiago', nameZh: '圣地亚哥', nameEn: 'Santiago', countryZh: '智利', iso2: 'CL', region: 'south-america', subregion: 'south-america', geoName: 'Santiago' },
  { id: 'montevideo', nameZh: '蒙得维的亚', nameEn: 'Montevideo', countryZh: '乌拉圭', iso2: 'UY', region: 'south-america', subregion: 'south-america' },
  { id: 'cuzco', nameZh: '库斯科', nameEn: 'Cusco', countryZh: '秘鲁', iso2: 'PE', region: 'south-america', subregion: 'south-america', geoName: 'Cusco' },
  { id: 'floripa', nameZh: '弗洛里亚诺波利斯', nameEn: 'Florianópolis', countryZh: '巴西', iso2: 'BR', region: 'south-america', subregion: 'south-america', geoName: 'Florianópolis', ascii: 'Florianopolis' },
  // 非洲 +8
  { id: 'cairo', nameZh: '开罗', nameEn: 'Cairo', countryZh: '埃及', iso2: 'EG', region: 'africa', subregion: 'northern-africa' },
  { id: 'nairobi', nameZh: '内罗毕', nameEn: 'Nairobi', countryZh: '肯尼亚', iso2: 'KE', region: 'africa', subregion: 'eastern-africa' },
  { id: 'kigali', nameZh: '基加利', nameEn: 'Kigali', countryZh: '卢旺达', iso2: 'RW', region: 'africa', subregion: 'eastern-africa' },
  { id: 'addis-ababa', nameZh: '亚的斯亚贝巴', nameEn: 'Addis Ababa', countryZh: '埃塞俄比亚', iso2: 'ET', region: 'africa', subregion: 'eastern-africa' },
  { id: 'johannesburg', nameZh: '约翰内斯堡', nameEn: 'Johannesburg', countryZh: '南非', iso2: 'ZA', region: 'africa', subregion: 'southern-africa' },
  { id: 'dakar', nameZh: '达喀尔', nameEn: 'Dakar', countryZh: '塞内加尔', iso2: 'SN', region: 'africa', subregion: 'western-africa' },
  { id: 'accra', nameZh: '阿克拉', nameEn: 'Accra', countryZh: '加纳', iso2: 'GH', region: 'africa', subregion: 'western-africa' },
  { id: 'port-louis', nameZh: '路易港', nameEn: 'Port Louis', countryZh: '毛里求斯', iso2: 'MU', region: 'africa', subregion: 'eastern-africa' },
  // 大洋洲 +7
  { id: 'sydney', nameZh: '悉尼', nameEn: 'Sydney', countryZh: '澳大利亚', iso2: 'AU', region: 'oceania', subregion: 'australia-nz' },
  { id: 'melbourne', nameZh: '墨尔本', nameEn: 'Melbourne', countryZh: '澳大利亚', iso2: 'AU', region: 'oceania', subregion: 'australia-nz' },
  { id: 'brisbane', nameZh: '布里斯班', nameEn: 'Brisbane', countryZh: '澳大利亚', iso2: 'AU', region: 'oceania', subregion: 'australia-nz' },
  { id: 'perth', nameZh: '珀斯', nameEn: 'Perth', countryZh: '澳大利亚', iso2: 'AU', region: 'oceania', subregion: 'australia-nz' },
  { id: 'auckland', nameZh: '奥克兰', nameEn: 'Auckland', countryZh: '新西兰', iso2: 'NZ', region: 'oceania', subregion: 'australia-nz' },
  { id: 'wellington', nameZh: '惠灵顿', nameEn: 'Wellington', countryZh: '新西兰', iso2: 'NZ', region: 'oceania', subregion: 'australia-nz' },
  { id: 'nadi', nameZh: '楠迪', nameEn: 'Nadi', countryZh: '斐济', iso2: 'FJ', region: 'oceania', subregion: 'melanesia' },
];

// ---- 解析 GeoNames cities15000.txt ----
// 列：1 geonameid, 2 name, 3 asciiname, 4 alternatenames, 5 lat, 6 lng, 7 fcl, 8 fcode,
//     9 country, ... 15 population, 16 elevation, 17 dem, 18 timezone
const raw = fs.readFileSync('/tmp/cities15000.txt', 'utf8');
const idx = new Map(); // `${asciiName}|${cc}` -> row
for (const line of raw.split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const key = `${f[2]}|${f[8]}`;
  const row = { name: f[1], ascii: f[2], lat: Number(f[4]), lng: Number(f[5]), cc: f[8], pop: Number(f[14]), tz: f[17], fcode: f[7] };
  if (!idx.has(key)) idx.set(key, row);
}

function lookup(city) {
  const candidates = [city.geoName ?? city.nameEn, city.ascii ?? city.geoName ?? city.nameEn].filter(Boolean);
  for (const name of candidates) {
    const hit = idx.get(`${name}|${city.iso2}`);
    if (hit) return hit;
  }
  // 兜底：ascii 名不含变音
  for (const name of candidates) {
    for (const [key, row] of idx) {
      if (key.startsWith(`${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|${city.iso2}`)) return row;
    }
  }
  return null;
}

const results = [];
const missing = [];
for (const c of NEW_CITIES) {
  const hit = lookup(c);
  if (!hit) {
    missing.push(`${c.id} (${c.geoName ?? c.nameEn}|${c.iso2})`);
    continue;
  }
  results.push({
    id: c.id,
    nameZh: c.nameZh,
    nameEn: c.nameEn,
    countryZh: c.countryZh,
    iso2: c.iso2,
    region: c.region,
    subregion: c.subregion,
    lat: hit.lat,
    lng: hit.lng,
    population: hit.pop > 0 ? hit.pop : null,
    timezone: hit.tz,
  });
}

console.log(`matched: ${results.length}/${NEW_CITIES.length}`);
if (missing.length) console.log('MISSING:\n' + missing.join('\n'));
fs.writeFileSync(path.join(OUT, 'selection.json'), JSON.stringify(results, null, 1));
