// ABOUTME: 第十二轮 SEO/GEO 基建——构建后静态落地页生成器
// ABOUTME: 200 城 + 65 国 + 索引页 + 方法论页（zh/en）+ robots.txt + llms.txt + sitemap.xml
// 运行时机：vite build 之后（产物写入 dist/，express.static 自动命中目录 index.html）
// 数据来源：src/data/cities/*.json 与 src/data/countries.json（null 不编造）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const DOMAIN = (() => {
  const raw = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://demo.dev.coze.site';
  const withProto = raw.startsWith('http') ? raw : `https://${raw}`;
  return withProto.replace(/\/+$/, '');
})();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ---------- token 色值：从 tailwind.config.js 提取（与主站唯一事实源同步） ----------
function readToken(name) {
  const src = fs.readFileSync(path.join(ROOT, 'tailwind.config.js'), 'utf8');
  const patterns = {
    pine: /pine:\s*'(#[0-9A-Fa-f]{6})'/,
    pineDeep: /pine-deep:\s*'(#[0-9A-Fa-f]{6})'/,
    teal: /teal:\s*'(#[0-9A-Fa-f]{6})'/,
    paper: /paper:\s*'(#[0-9A-Fa-f]{6})'/,
    paperDeep: /'paper-deep':\s*'(#[0-9A-Fa-f]{6})'/,
    ink: /ink:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    'ink-soft': /soft:\s*'(#[0-9A-Fa-f]{6})'/,
    clay: /clay:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    clayDeep: /deep:\s*'(#[0-9A-Fa-f]{6})'/,
    ochre: /ochre:\s*'(#[0-9A-Fa-f]{6})'/,
    moss: /moss:\s*'(#[0-9A-Fa-f]{6})'/,
    sea: /sea:\s*'(#[0-9A-Fa-f]{6})'/,
  };
  const m = src.match(patterns[name]);
  if (!m) throw new Error(`tailwind.config.js 中找不到 token: ${name}`);
  return m[1];
}
const T = {
  pine: readToken('pine'),
  pineDeep: '#075985', // sky-800：CTA hover 深档（config 无对应 token，落地页自用）
  teal: readToken('teal'),
  paper: readToken('paper'),
  paperDeep: readToken('paperDeep'),
  ink: readToken('ink'),
  inkSoft: readToken('ink-soft'),
  clay: readToken('clay'),
  clayDeep: readToken('clayDeep'),
  ochre: readToken('ochre'),
  moss: readToken('moss'),
  sea: readToken('sea'),
  card: '#FFFFFF',
};

// ---------- 数据 ----------
const CONTINENTS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];
const CITIES = CONTINENTS.flatMap((r) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, `src/data/cities/${r}.json`), 'utf8')),
);
const COUNTRIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/countries.json'), 'utf8'));
const CITY_BY_ID = new Map(CITIES.map((c) => [c.id, c]));
const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
// countries.json 无 region 字段——由库内城市反推国家级大洲
const COUNTRY_REGION = new Map();
for (const c of CITIES) if (c.continent && !COUNTRY_REGION.has(c.countryCode)) COUNTRY_REGION.set(c.countryCode, c.continent);

// ---------- 工具 ----------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const page = (p) => `${DOMAIN}${p}`;

// 大洲标签（落地页自备，避免依赖 TS 词典）
const REGION_LABEL = {
  zh: { europe: '欧洲', asia: '亚洲', africa: '非洲', 'north-america': '北美洲', 'south-america': '南美洲', oceania: '大洋洲' },
  en: { europe: 'Europe', asia: 'Asia', africa: 'Africa', 'north-america': 'North America', 'south-america': 'South America', oceania: 'Oceania' },
};
const AIR_BAND = {
  zh: { good: '优', fair: '良', moderate: '一般', poor: '差' },
  en: { good: 'Good', fair: 'Fair', moderate: 'Moderate', poor: 'Poor' },
};
const EPI_BAND = {
  zh: { 'very-high': '很高', high: '较高', moderate: '中等', low: '较低', 'very-low': '很低' },
  en: { 'very-high': 'Very high', high: 'High', moderate: 'Moderate', low: 'Low', 'very-low': 'Very low' },
};
const VISA_STATUS = {
  zh: { official: '官方数字游民签证', alternative: '有替代长期居留途径', none: '暂无明确长期居留途径' },
  en: { official: 'Official digital nomad visa', alternative: 'Alternative long-stay route', none: 'No clear long-stay route' },
};
const TAG_LABEL = {
  zh: { food: '美食', nature: '自然', history: '历史', beach: '海滩', nightlife: '夜生活', arts: '艺术', festivals: '节庆', pets: '宠物友好', coffee: '咖啡', outdoor: '户外', watersports: '水上运动', skiing: '滑雪', music: '音乐', photography: '摄影', cooking: '烹饪', fitness: '健身', reading: '阅读', writing: '写作', crypto: '区块链', startups: '创业', gaming: '游戏', film: '电影', language: '语言学习', volunteer: '志愿', family: '亲子', lgbtq: 'LGBTQ 友好', 'adventure-sports': '探险运动', opera: '歌剧' },
  en: { food: 'food', nature: 'nature', history: 'history', beach: 'beach', nightlife: 'nightlife', arts: 'arts', festivals: 'festivals', pets: 'pet-friendly', coffee: 'coffee', outdoor: 'outdoors', watersports: 'watersports', skiing: 'skiing', music: 'music', photography: 'photography', cooking: 'cooking', fitness: 'fitness', reading: 'reading', writing: 'writing', crypto: 'crypto', startups: 'startups', gaming: 'gaming', film: 'film', language: 'languages', volunteer: 'volunteering', family: 'family', lgbtq: 'LGBTQ-friendly', 'adventure-sports': 'adventure sports', opera: 'opera' },
};

// ---------- 共享模板 ----------
const CSS = `
:root{--pine:${T.pine};--pine-deep:${T.pineDeep};--teal:${T.teal};--paper:${T.paper};--paper-deep:${T.paperDeep};--ink:${T.ink};--ink-soft:${T.inkSoft};--clay:${T.clay};--clay-deep:${T.clayDeep};--ochre:${T.ochre};--moss:${T.moss};--sea:${T.sea};--card:${T.card}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans SC',-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:var(--paper);color:var(--ink);line-height:1.7;font-size:16px}
.wrap{max-width:880px;margin:0 auto;padding:0 20px}
header{background:var(--card);border-bottom:1px solid var(--paper-deep)}
.hd{display:flex;align-items:center;justify-content:space-between;padding:14px 0;gap:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:18px;color:var(--ink);text-decoration:none}
.brand .dot{width:26px;height:26px;border-radius:8px;background:var(--pine);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px}
.hd nav{display:flex;gap:16px;font-size:14px;flex-wrap:wrap}
.hd nav a{color:var(--pine);text-decoration:none}
.hd nav a:hover{text-decoration:underline}
main{padding:28px 0 40px}
.crumbs{font-size:13px;color:var(--ink-soft);margin-bottom:14px}
.crumbs a{color:var(--pine);text-decoration:none}
.crumbs a:hover{text-decoration:underline}
h1{font-size:30px;line-height:1.3;margin:4px 0 6px;letter-spacing:.5px}
.sub{color:var(--ink-soft);font-size:14px;margin-bottom:18px}
.answer{background:var(--card);border:1px solid var(--paper-deep);border-left:4px solid var(--pine);border-radius:12px;padding:18px 20px;margin-bottom:22px}
.answer p{font-size:16.5px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-bottom:26px}
.card{background:var(--card);border:1px solid var(--paper-deep);border-radius:14px;padding:16px 18px}
.card h3{font-size:13px;color:var(--ink-soft);font-weight:600;letter-spacing:.4px;margin-bottom:6px}
.card .v{font-size:22px;font-weight:800;color:var(--ink)}
.card .v small{font-size:13px;font-weight:500;color:var(--ink-soft);margin-left:4px}
.card .src{font-size:12px;color:var(--ink-soft);margin-top:6px}
.card.none .v{font-size:15px;font-weight:600;color:var(--ink-soft)}
h2{font-size:20px;margin:26px 0 12px;letter-spacing:.4px}
details{background:var(--card);border:1px solid var(--paper-deep);border-radius:12px;padding:12px 18px;margin-bottom:10px}
details summary{cursor:pointer;font-weight:700;font-size:15.5px}
details p{margin-top:8px;color:var(--ink);font-size:15px}
.cta{display:block;background:var(--pine);color:#fff;text-align:center;text-decoration:none;font-weight:800;font-size:17px;padding:15px 20px;border-radius:14px;margin:26px 0 10px}
.cta:hover{background:var(--pine-deep)}
.cta-sub{text-align:center;color:var(--ink-soft);font-size:13px;margin-bottom:24px}
.list{background:var(--card);border:1px solid var(--paper-deep);border-radius:14px;padding:8px 18px;margin-bottom:22px}
.list a{color:var(--pine);text-decoration:none}
.list a:hover{text-decoration:underline}
.list li{padding:7px 0;border-bottom:1px dashed var(--paper-deep);list-style:none;display:flex;justify-content:space-between;gap:10px;font-size:14.5px;flex-wrap:wrap}
.list li:last-child{border-bottom:none}
.list .meta{color:var(--ink-soft);font-size:12.5px}
footer{border-top:1px solid var(--paper-deep);background:var(--card);padding:18px 0 26px;font-size:12.5px;color:var(--ink-soft)}
.badge{display:inline-block;background:var(--paper-deep);color:var(--pine-deep);font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;margin-left:8px;vertical-align:middle}
.note{font-size:13px;color:var(--ink-soft);margin:8px 0 18px}
.lang{font-size:13px}
.lang a{color:var(--teal);text-decoration:none;font-weight:600}
@media(max-width:560px){h1{font-size:24px}.card .v{font-size:19px}}
`;

function shell({ lang, title, desc, canonical, hreflang, jsonLd, body }) {
  const alt = lang === 'zh' ? hreflang.en : hreflang.zh;
  const langSwitch = lang === 'zh'
    ? `<span class="lang"><a href="${esc(alt)}" hreflang="en" rel="alternate">English</a></span>`
    : `<span class="lang"><a href="${esc(alt)}" hreflang="zh-Hans" rel="alternate">中文</a></span>`;
  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-Hans' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
${Object.entries(hreflang).map(([k, v]) => `<link rel="alternate" hreflang="${k === 'zh' ? 'zh-Hans' : 'en'}" href="${esc(v)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(hreflang.zh)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="栖居罗盘 · Siju Compass">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<style>${CSS}</style>
${jsonLd.map((j) => `<script type="application/ld+json">\n${JSON.stringify(j, null, 1)}\n</script>`).join('\n')}
</head>
<body>
<header><div class="wrap hd">
<a class="brand" href="${lang === 'zh' ? '/' : '/en/'}"><span class="dot">栖</span>栖居罗盘 · Siju Compass</a>
<nav>
<a href="${lang === 'zh' ? '/cities/' : '/en/cities/'}">${lang === 'zh' ? '城市索引' : 'Cities'}</a>
<a href="${lang === 'zh' ? '/countries/' : '/en/countries/'}">${lang === 'zh' ? '国家索引' : 'Countries'}</a>
<a href="${lang === 'zh' ? '/methodology/' : '/en/methodology/'}">${lang === 'zh' ? '方法论' : 'Methodology'}</a>
${langSwitch}
</nav>
</div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">
<p>${lang === 'zh'
    ? '数据来源：Numbeo 公开指数 · Open-Meteo（CC BY 4.0）· GeoNames（CC BY 4.0）· EF EPI · World Bank · WHO 2021 空气质量指导值分档 · Ookla Speedtest Intelligence。签证与政策多变，出行前务必核实官方渠道；本站为决策辅助工具，不构成任何投资、法律或移民建议。'
    : 'Data sources: Numbeo public indices · Open-Meteo (CC BY 4.0) · GeoNames (CC BY 4.0) · EF EPI · World Bank · WHO 2021 air quality guidelines · Ookla Speedtest Intelligence. Visa policies change frequently — always verify with official channels before travelling. This site is a decision-support tool, not investment, legal or immigration advice.'}</p>
<p style="margin-top:6px">${lang === 'zh' ? '匹配口径与数据许可详见' : 'Scoring methodology & data licences:'} <a href="${lang === 'zh' ? '/methodology/' : '/en/methodology/'}" style="color:var(--pine)">${lang === 'zh' ? '方法论页' : 'Methodology'}</a> · © 栖居罗盘 Siju Compass</p>
</div></footer>
</body>
</html>`;
}

// ---------- 城市：数据卡 ----------
function cityCards(city, lang) {
  const S = lang === 'zh' ? '来源' : 'Source';
  const money = (v) => `$${Math.round(v)}`;
  const no = (zh, en) => lang === 'zh' ? zh : en;
  const cards = [];
  const cost = city.monthlyCostUSD;
  cards.push(cost != null
    ? { h: no('月生活成本', 'Monthly cost'), v: money(cost), small: no('含房租 · 估算区间', 'incl. rent · est. range'), detail: `${city.cost?.[0] != null ? money(city.cost[0]) : '?'} – ${city.cost?.[1] != null ? money(city.cost[1]) : '?'}`, src: `${S}: Numbeo 成本指数（NYC=100）线性拟合 + 详情页快照，更新于 ${BUILD_DATE}` }
    : { h: no('月生活成本', 'Monthly cost'), none: no('数据待核实', 'Data pending'), src: `${S}: Numbeo 暂无该城成本详情（不编造数据）` });
  const safety = city.safety;
  cards.push(safety != null
    ? { h: no('安全指数', 'Safety index'), v: `${safety}<small>/100</small>`, src: `${S}: Numbeo Safety Index` }
    : { h: no('安全指数', 'Safety index'), none: no('数据待核实（国家级参考见下）', 'Data pending (see country-level)'), src: `${S}: Numbeo 暂无该城安全详情` });
  const cl = city.climateDetail;
  cards.push(cl
    ? { h: no('气候（十年均值）', 'Climate (10-yr avg)'), v: `${cl.avgTempC}<small>°C 年均</small>`, detail: `${cl.annualPrecipMm}mm · ${cl.sunshineHours}h 日照/年`, src: `${S}: Open-Meteo Historical（CC BY 4.0）2015–2024` }
    : { h: no('气候', 'Climate'), none: no('数据待核实', 'Data pending'), src: `${S}: Open-Meteo` });
  const mbps = city.internetMbps ?? COUNTRY_BY_CODE.get(city.countryCode)?.internetMbpsFixed ?? null;
  cards.push(mbps != null
    ? { h: no('固定宽带', 'Fixed broadband'), v: `${mbps}<small>Mbps 下行中位</small>`, src: `${S}: Ookla Speedtest Intelligence${city.internetMbps == null ? '（国家级）' : ''}` }
    : { h: no('固定宽带', 'Fixed broadband'), none: no('数据待核实', 'Data pending'), src: `${S}: Ookla` });
  const aq = city.airQuality;
  cards.push(aq
    ? { h: no('空气质量', 'Air quality'), v: `${aq.pm25}<small>µg/m³ PM2.5 · ${AIR_BAND[lang][aq.band]}</small>`, src: `${S}: Open-Meteo CAMS · WHO 2021 分档（${aq.period}）` }
    : { h: no('空气质量', 'Air quality'), none: no('数据待核实', 'Data pending'), src: `${S}: Open-Meteo Air Quality` });
  const co = COUNTRY_BY_CODE.get(city.countryCode);
  const visaCity = city.visaStatus ? (VISA_STATUS[lang][city.visaStatus] ?? city.visaStatus) : null;
  cards.push({ h: no('签证概览', 'Visa overview'), none: visaCity ?? (co?.visaOverview ?? no('以国家级信息为准 · 政策多变请核实官方渠道', 'See country-level info · verify with officials')), src: `${S}: ${co ? `${co.nameZh} 快照（${co.updatedAt}）` : '手工快照'} · 免责：签证政策多变，务必核实官方渠道` });
  return cards.map((c) => `<div class="card${c.none ? ' none' : ''}">
<h3>${c.h}</h3>
<div class="v">${c.none ?? c.v}${c.none ? '' : c.small ? `<small>${c.small}</small>` : ''}</div>
${c.detail ? `<div class="src">${c.detail}</div>` : ''}
<div class="src">${c.src}</div>
</div>`).join('\n');
}

// ---------- 城市：直答段 ----------
function cityAnswer(city, lang) {
  const co = COUNTRY_BY_CODE.get(city.countryCode);
  const region = REGION_LABEL[lang][city.continent] ?? '';
  const n = lang === 'zh' ? city.nameZh : city.nameEn;
  const cN = lang === 'zh' ? city.countryZh : (co?.nameEn ?? city.countryEn ?? city.countryZh);
  const tags = (city.tags ?? []).map((t) => TAG_LABEL[lang][t]).filter(Boolean).slice(0, 3);
  if (lang === 'zh') {
    const parts = [];
    if (city.monthlyCostUSD != null) parts.push(`月生活成本约 $${Math.round(city.monthlyCostUSD)}（含房租）`);
    else parts.push('官方生活成本数据待补充');
    if (city.safety != null) parts.push(`安全指数 ${city.safety}/100`);
    if (city.climateDetail) parts.push(`年均气温 ${city.climateDetail.avgTempC}°C`);
    const aq = city.airQuality ? `，PM2.5 年均 ${city.airQuality.pm25} µg/m³（${AIR_BAND.zh[city.airQuality.band]}）` : '';
    return `${city.nameZh}位于${cN}${region ? `（${region}）` : ''}，${parts.join('，')}${aq}。${tags.length ? `这座城市的特色标签包括${tags.join('、')}。` : ''}本页汇总其面向数字游民与远程工作者的关键定居数据：生活成本、安全、气候、网速、空气质量与签证概览，并标注每项数据的来源与日期。`;
  }
  const parts = [];
  if (city.monthlyCostUSD != null) parts.push(`an estimated monthly cost of ~$${Math.round(city.monthlyCostUSD)} incl. rent`);
  else parts.push('pending official cost data');
  if (city.safety != null) parts.push(`a safety index of ${city.safety}/100`);
  if (city.climateDetail) parts.push(`an average annual temperature of ${city.climateDetail.avgTempC}°C`);
  return `${city.nameEn} in ${cN}${region ? ` (${region})` : ''} offers ${parts.join(', ')} for digital nomads and remote workers. This page compiles cost of living, safety, climate, internet speed, air quality and visa overview with per-item data sources and dates.`;
}

// ---------- 城市：FAQ ----------
function cityFaq(city, lang) {
  const co = COUNTRY_BY_CODE.get(city.countryCode);
  const n = lang === 'zh' ? city.nameZh : city.nameEn;
  const cN = lang === 'zh' ? city.countryZh : (co?.nameEn ?? city.countryEn ?? city.countryZh);
  const faqs = [];
  if (lang === 'zh') {
    faqs.push({
      q: `${city.nameZh}生活成本多少？`,
      a: city.monthlyCostUSD != null
        ? `${city.nameZh}估算月生活成本约 $${Math.round(city.monthlyCostUSD)}（含一居室房租；区间 $${city.cost?.[0] != null ? Math.round(city.cost[0]) : '?'}–$${city.cost?.[1] != null ? Math.round(city.cost[1]) : '?'}），单餐约 $${city.mealUSD ?? '?'}，一居室月租约 $${city.rent1brUSD != null ? Math.round(city.rent1brUSD) : '?'}。口径为 Numbeo 成本指数线性拟合与详情页快照，随汇率与城市更新浮动。`
        : `${city.nameZh}暂无可靠的公开生活成本明细（Numbeo 无该城详情页），本站不编造数据；可参考其所在${city.countryZh}的国家级成本水位与 Numbeo 后续更新。`,
    });
    faqs.push({
      q: `${city.nameZh}安全吗？`,
      a: city.safety != null
        ? `${city.nameZh}的 Numbeo 安全指数为 ${city.safety}/100（越高越安全）。总体而言${city.safety >= 60 ? '治安处于较好水平，常规旅行防范即可' : city.safety >= 40 ? '治安中等，建议夜间避免偏僻区域并留意财物' : '治安压力较大，需提高防范意识并选择安全社区居住'}。`
        : `${city.nameZh}暂无城市级安全指数，其所在${city.countryZh}的 Numbeo 国家安全参考为 ${co?.numbeoSafety ?? '待补充'}/100${co?.gpi ? `，全球和平指数排名 #${co.gpi.rank}` : ''}。建议出行前查看最新领事与当地安全通报。`,
    });
    faqs.push({
      q: `持中国护照如何入境${city.countryZh}（前往${city.nameZh}）？`,
      a: co?.visaPassport
        ? `据 ${co.updatedAt} 快照：中国大陆护照赴${city.countryZh}为「${co.visaPassport.entry}」${co.visaPassport.entryNote ? `（${co.visaPassport.entryNote}）` : ''}。${co.visaOverview ? `${city.countryZh}提供${co.visaOverview}。` : ''}签证政策多变，出发前务必核实${city.countryZh}官方移民渠道。`
        : `${city.countryZh}的签证概览：${co?.visaOverview ?? '暂无结构化快照，请查询官方渠道'}。签证政策多变，出发前务必核实官方移民渠道。`,
    });
    const mbps = city.internetMbps ?? co?.internetMbpsFixed;
    faqs.push({
      q: `${city.nameZh}网速如何？`,
      a: mbps != null
        ? `${city.nameZh}${city.internetMbps != null ? '' : '（国家级口径）'}固定宽带下行中位约 ${mbps} Mbps（Ookla Speedtest Intelligence），${mbps >= 100 ? '足以支撑高清视频会议与大文件传输等重网络工作' : mbps >= 50 ? '可满足日常视频会议与远程协作' : '建议将重网络任务安排在网络低峰，或备移动热点'}。`
        : `${city.nameZh}暂无宽带中位数据，建议行前通过当地运营商页面或测速社区核实。`,
    });
    if (city.airQuality) {
      faqs.push({
        q: `${city.nameZh}空气质量如何？`,
        a: `${city.nameZh} PM2.5 年均约 ${city.airQuality.pm25} µg/m³（${city.airQuality.period}，Open-Meteo CAMS 再分析），按 WHO 2021 年均指导值分档为「${AIR_BAND.zh[city.airQuality.band]}」。${city.airQuality.band === 'poor' ? '对空气敏感人群建议备空气净化器并关注季节性差异。' : city.airQuality.band === 'moderate' ? '整体可接受，敏感人群留意季节波动。' : '空气整体良好。'}`,
      });
    }
  } else {
    faqs.push({
      q: `What is the cost of living in ${city.nameEn}?`,
      a: city.monthlyCostUSD != null
        ? `${city.nameEn} has an estimated monthly cost of ~$${Math.round(city.monthlyCostUSD)} including rent (range $${city.cost?.[0] != null ? Math.round(city.cost[0]) : '?'}–$${city.cost?.[1] != null ? Math.round(city.cost[1]) : '?'}), based on Numbeo cost-index fitting and page snapshots.`
        : `Reliable public cost details for ${city.nameEn} are not yet available (no Numbeo detail page); we do not fabricate data — see country-level figures instead.`,
    });
    faqs.push({
      q: `Is ${city.nameEn} safe?`,
      a: city.safety != null
        ? `${city.nameEn} scores ${city.safety}/100 on the Numbeo Safety Index (higher is safer).`
        : `City-level safety index is pending; country-level reference for ${cN} is ${co?.numbeoSafety ?? 'n/a'}/100${co?.gpi ? ` (Global Peace Index rank #${co.gpi.rank})` : ''}. Always check the latest official travel advisories.`,
    });
    faqs.push({
      q: `How can Chinese passport holders enter ${cN}?`,
      a: co?.visaPassport
        ? `Snapshot as of ${co.updatedAt}: mainland Chinese passport holders are ${co.visaPassport.entry} to ${cN}. Verify with official immigration channels before travel.`
        : `Check official immigration channels for the latest ${cN} entry rules for Chinese passport holders.`,
    });
    const mbps = city.internetMbps ?? co?.internetMbpsFixed;
    faqs.push({
      q: `How fast is the internet in ${city.nameEn}?`,
      a: mbps != null
        ? `Median fixed broadband download is about ${mbps} Mbps (Ookla)${city.internetMbps == null ? ' at country level' : ''}.`
        : 'No median broadband data yet — check local ISPs or speedtest communities.',
    });
  }
  return faqs;
}

// ---------- HTML 组装 ----------
function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
  };
}

function renderCityPage(city, lang) {
  const co = COUNTRY_BY_CODE.get(city.countryCode);
  const id = city.id;
  const pathZh = `/city/${id}/`;
  const pathEn = `/en/city/${id}/`;
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const n = lang === 'zh' ? city.nameZh : city.nameEn;
  const cN = lang === 'zh' ? city.countryZh : (co?.nameEn ?? city.countryEn ?? city.countryZh);
  const title = lang === 'zh'
    ? `${city.nameZh}数字游民定居指南 · 月成本 $${city.monthlyCostUSD != null ? Math.round(city.monthlyCostUSD) : '?'} · 安全/气候/网速/签证 | 栖居罗盘`
    : `${city.nameEn} for Digital Nomads · Cost, Safety, Climate, Internet & Visa | Siju Compass`;
  const desc = lang === 'zh'
    ? `${city.nameZh}（${city.countryZh}）生活成本约 $${city.monthlyCostUSD != null ? Math.round(city.monthlyCostUSD) : '?'}${city.safety != null ? `，安全指数 ${city.safety}/100` : ''}${city.climateDetail ? `，年均 ${city.climateDetail.avgTempC}°C` : ''}。含数据来源标注、常见问答与免费定居匹配测评。`
    : `${city.nameEn} (${cN}): ~$${city.monthlyCostUSD != null ? Math.round(city.monthlyCostUSD) : 'n/a'}/mo incl. rent${city.safety != null ? `, safety ${city.safety}/100` : ''}. Sources, FAQ and a free nomad matching quiz.`;
  const faqs = cityFaq(city, lang);
  const region = REGION_LABEL[lang][city.continent] ?? '';
  const crumbs = lang === 'zh'
    ? [{ name: '首页', item: page('/') }, { name: '城市索引', item: page('/cities/') }, { name: region || city.countryZh, item: page('/cities/') }, { name: city.nameZh, item: page(pathZh) }]
    : [{ name: 'Home', item: page('/en/') }, { name: 'Cities', item: page('/en/cities/') }, { name: region || cN, item: page('/en/cities/') }, { name: city.nameEn, item: page(pathEn) }];
  const badge = lang === 'zh' ? `<h1>${esc(city.nameZh)}<span class="badge">${esc(city.countryZh)} · ${esc(region)}</span></h1>` : `<h1>${esc(city.nameEn)}<span class="badge">${esc(cN)} · ${esc(region)}</span></h1>`;
  const countryLink = lang === 'zh' ? `/country/${(city.countryCode || '').toLowerCase()}/` : `/en/country/${(city.countryCode || '').toLowerCase()}/`;
  const body = `
<p class="crumbs">${crumbs.map((c, i) => i === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.item)}">${esc(c.name)}</a> ›`).join(' ')}</p>
${badge}
<p class="sub">${lang === 'zh' ? `${esc(city.countryZh)} · ${esc(region)} · 人口 ${city.population ? city.population.toLocaleString('en-US') : '—'} · ${esc(city.timezone ?? '—')}` : `${esc(cN)} · ${esc(region)} · Population ${city.population ? city.population.toLocaleString('en-US') : '—'} · ${esc(city.timezone ?? '—')}`}</p>
<div class="answer"><p>${esc(cityAnswer(city, lang))}</p></div>
<div class="grid">
${cityCards(city, lang)}
</div>
<h2>${lang === 'zh' ? '常见问答' : 'FAQ'}</h2>
${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}
<h2>${lang === 'zh' ? `关于${esc(city.countryZh)}` : `About ${esc(cN)}`}</h2>
<p class="note">${co ? (lang === 'zh'
    ? `${esc(city.countryZh)}：人均 GDP 约 $${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')}（World Bank），人类发展指数 ${co.hdi ?? '—'}，和平指数排名 #${co.gpi?.rank ?? '—'}（IEP ${co.gpi ? '2024' : ''}）。`
    : `${cN}: GDP per capita ~$${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')} (World Bank), HDI ${co.hdi ?? '—'}, Global Peace Index rank #${co.gpi?.rank ?? '—'} (IEP).`) : ''} <a href="${esc(countryLink)}">${lang === 'zh' ? `查看${esc(city.countryZh)}国家页 →` : `Open ${esc(cN)} country page →`}</a></p>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>
<p class="cta-sub">${lang === 'zh' ? '32 题简易版永久免费 · 无需注册 · 测评后按 11 维权重输出 Top 5 城市' : 'Lite quiz free forever · no signup · Top 5 cities scored on 11 dimensions'}</p>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [faqJsonLd(faqs), breadcrumbJsonLd(crumbs)], body });
}

function renderCountryPage(co, lang) {
  const code = co.code.toLowerCase();
  const pathZh = `/country/${code}/`;
  const pathEn = `/en/country/${code}/`;
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const n = lang === 'zh' ? co.nameZh : co.nameEn;
  const title = lang === 'zh'
    ? `${co.nameZh}数字游民与长期定居指南 · 签证/安全/网速/税负 | 栖居罗盘`
    : `${co.nameEn} for Digital Nomads · Visa, Safety, Internet & Tax | Siju Compass`;
  const desc = lang === 'zh'
    ? `${co.nameZh}定居要点：${co.visaOverview ?? '签证概览见正文'}；固定宽带中位 ${co.internetMbpsFixed ?? '—'} Mbps，Numbeo 安全参考 ${co.numbeoSafety ?? '—'}/100，库内 ${co.cityCount} 座城市数据。来源与日期逐项标注。`
    : `${co.nameEn} essentials: ${co.internetMbpsFixed ?? '—'} Mbps median broadband, Numbeo safety ${co.numbeoSafety ?? '—'}/100, ${co.cityCount} covered cities. Per-item sources & dates.`;
  const cities = CITIES.filter((c) => c.countryCode === co.code);
  const vp = co.visaPassport;
  const ls = co.longStay;
  const faqs = [];
  if (lang === 'zh') {
    faqs.push({ q: `持中国护照进入${co.nameZh}需要签证吗？`, a: vp ? `据 ${co.updatedAt} 快照，中国大陆护照为「${vp.entry}」${vp.entryNote ? `（${vp.entryNote}）` : ''}。` : '暂无结构化快照，请查询官方渠道。' + ' 签证政策多变，务必核实官方移民渠道。' });
    faqs.push({ q: `${co.nameZh}远程办公/数字游民签证情况？`, a: `${co.visaOverview ?? '暂无结构化信息'}${vp ? `；数字游民友好度：${vp.digitalNomad}` : ''}。政策更新频繁，以官方渠道为准。` });
    faqs.push({ q: `${co.nameZh}网速怎么样？`, a: co.internetMbpsFixed != null ? `固定宽带下行中位约 ${co.internetMbpsFixed} Mbps（Ookla Speedtest Intelligence），${co.internetMbpsFixed >= 100 ? '适合重网络远程工作' : '满足日常远程协作，重网络任务建议核实当地 ISP'}。` : '暂无数据，请查询当地 ISP。' });
    faqs.push({ q: `${co.nameZh}安全吗？`, a: `${co.numbeoSafety != null ? `Numbeo 国家安全参考 ${co.numbeoSafety}/100。` : ''}${co.gpi ? `全球和平指数（IEP 2024）排名 #${co.gpi.rank}（得分 ${co.gpi.score}）。` : ''}出行前请查看最新领事安全通报。` });
    faqs.push({ q: `${co.nameZh}长期居留与税务要注意什么？`, a: ls ? `税居门槛：${ls.taxResidencyDays ?? '—'} 天/年${ls.socialSecurityCn ? `；社保协定：${ls.socialSecurityCn === 'treaty' ? '与中国有社保协定' : ls.socialSecurityCn === 'negotiating' ? '协定协商中' : '暂无协定'}` : ''}${ls.rentalCustom ? `；租房惯例：${ls.rentalCustom}` : ''}。以上为快照参考，请以官方与专业税务意见为准。` : '暂无结构化快照。' });
  } else {
    faqs.push({ q: `Do Chinese passport holders need a visa for ${co.nameEn}?`, a: vp ? `Snapshot as of ${co.updatedAt}: mainland Chinese passport holders are ${vp.entry}. Verify with official channels.` : 'No structured snapshot — check official channels.' });
    faqs.push({ q: `Does ${co.nameEn} offer a digital nomad visa?`, a: `${co.visaOverview ?? 'No structured info'}${vp ? `; digital-nomad friendliness: ${vp.digitalNomad}` : ''}.` });
    faqs.push({ q: `How fast is the internet in ${co.nameEn}?`, a: co.internetMbpsFixed != null ? `Median fixed broadband is ~${co.internetMbpsFixed} Mbps (Ookla).` : 'No data yet.' });
    faqs.push({ q: `Is ${co.nameEn} safe?`, a: `${co.numbeoSafety != null ? `Numbeo safety ${co.numbeoSafety}/100. ` : ''}${co.gpi ? `Global Peace Index rank #${co.gpi.rank} (IEP 2024).` : ''}` });
  }
  const crumbs = lang === 'zh'
    ? [{ name: '首页', item: page('/') }, { name: '国家索引', item: page('/countries/') }, { name: co.nameZh, item: page(pathZh) }]
    : [{ name: 'Home', item: page('/en/') }, { name: 'Countries', item: page('/en/countries/') }, { name: co.nameEn, item: page(pathEn) }];
  const cityList = cities.map((c) => `<li><a href="${lang === 'zh' ? `/city/${c.id}/` : `/en/city/${c.id}/`}">${esc(lang === 'zh' ? c.nameZh : c.nameEn)}</a><span class="meta">${c.monthlyCostUSD != null ? `$${Math.round(c.monthlyCostUSD)}/mo` : '—'}${c.safety != null ? ` · 安全 ${c.safety}` : ''}</span></li>`).join('\n');
  const body = `
<p class="crumbs">${crumbs.map((c, i) => i === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.item)}">${esc(c.name)}</a> ›`).join(' ')}</p>
<h1>${esc(n)}<span class="badge">${esc(co.capital ?? '')} · ${esc((co.languages ?? []).join('、'))}</span></h1>
<p class="sub">${lang === 'zh' ? `人口 ${co.population ? co.population.toLocaleString('en-US') : '—'} · 货币 ${esc(co.currency ?? '—')} · 人均 GDP $${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')}` : `Population ${co.population ? co.population.toLocaleString('en-US') : '—'} · Currency ${esc(co.currency ?? '—')} · GDP/cap $${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')}`}</p>
<div class="answer"><p>${lang === 'zh'
    ? `${esc(co.nameZh)}是${co.cityCount ?? CITIES.length ? `本站收录 ${co.cityCount ?? cities.length} 座城市的` : ''}定居目的地。${co.internetMbpsFixed != null ? `固定宽带下行中位 ${co.internetMbpsFixed} Mbps，` : ''}${co.numbeoSafety != null ? `Numbeo 国家安全参考 ${co.numbeoSafety}/100，` : ''}${co.numbeoQol != null ? `Numbeo 生活质量指数 ${co.numbeoQol}。` : ''}${co.visaOverview ? `远程工作签证方面：${esc(co.visaOverview)}。` : ''}国家级数据逐项标注来源（World Bank/UNDP/IEP/Numbeo/Ookla），更新于 ${esc(co.updatedAt)}。`
    : `${esc(co.nameEn)} hosts ${co.cityCount ?? cities.length} covered cities. ${co.internetMbpsFixed != null ? `Median broadband ${co.internetMbpsFixed} Mbps; ` : ''}${co.numbeoQol != null ? `Numbeo QoL ${co.numbeoQol}; ` : ''}${co.visaOverview ? `remote-work visa: ${esc(co.visaOverview)}.` : ''} Sources per item (World Bank/UNDP/IEP/Numbeo/Ookla), updated ${esc(co.updatedAt)}.`}</p></div>
<div class="grid">
  <div class="card"><h3>${lang === 'zh' ? '和平指数' : 'Peace index'}</h3><div class="v">${co.gpi ? `#${co.gpi.rank}<small>IEP 2024 · ${co.gpi.score}</small>` : '—'}</div><div class="src">来源: IEP Global Peace Index（手工快照）</div></div>
  <div class="card"><h3>${lang === 'zh' ? '人类发展指数' : 'HDI'}</h3><div class="v">${co.hdi ?? '—'}</div><div class="src">来源: UNDP HDR（手工快照）</div></div>
  <div class="card"><h3>${lang === 'zh' ? '腐败感知指数' : 'CPI'}</h3><div class="v">${co.cpi ?? '—'}<small>/100</small></div><div class="src">来源: Transparency International（手工快照）</div></div>
  <div class="card"><h3>${lang === 'zh' ? '生活质量' : 'Quality of life'}</h3><div class="v">${co.numbeoQol ?? '—'}</div><div class="src">来源: Numbeo Quality of Life Index</div></div>
  <div class="card"><h3>${lang === 'zh' ? '税负参考' : 'Top tax rate'}</h3><div class="v">${co.taxTopRatePct != null ? `${co.taxTopRatePct}<small>% 最高档</small>` : '—'}</div><div class="src">来源: 手工快照 · 请以专业税务意见为准</div></div>
  <div class="card"><h3>${lang === 'zh' ? '数据快照日期' : 'Snapshot date'}</h3><div class="v" style="font-size:16px">${esc(co.updatedAt)}</div><div class="src">逐字段来源标注见方法论页</div></div>
</div>
<h2>${lang === 'zh' ? '常见问答' : 'FAQ'}</h2>
${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}
<h2>${lang === 'zh' ? `库内城市（${cities.length}）` : `Covered cities (${cities.length})`}</h2>
<ul class="list">${cityList}</ul>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>
<p class="cta-sub">${lang === 'zh' ? '签证/预算/安全硬约束过滤 + 分层匹配引擎' : 'Hard-constraint filtering + tiered matching engine'}</p>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [faqJsonLd(faqs), breadcrumbJsonLd(crumbs)], body });
}

// ---------- 索引页 ----------
function renderCitiesIndex(lang) {
  const pathZh = '/cities/', pathEn = '/en/cities/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const byRegion = CONTINENTS.map((r) => ({ r, cities: CITIES.filter((c) => c.continent === r) }));
  const title = lang === 'zh' ? `200 座城市定居资料库（六洲覆盖）| 栖居罗盘` : `200 City Guides for Digital Nomads (6 continents) | Siju Compass`;
  const desc = lang === 'zh' ? '按大洲浏览 200 座城市的数字游民定居数据：生活成本、安全、气候、网速、空气质量与签证概览，逐项标注来源。' : 'Browse 200 city guides across 6 continents: cost, safety, climate, internet, air quality and visa overview with per-item sources.';
  const body = `
<h1>${lang === 'zh' ? '城市资料库' : 'City guides'}<span class="badge">${CITIES.length} ${lang === 'zh' ? '座城市' : 'cities'} · 6 ${lang === 'zh' ? '大洲' : 'continents'}</span></h1>
<p class="sub">${lang === 'zh' ? '每城一页：直答摘要 + 成本/安全/气候/网速/空气/签证数据卡（来源与日期逐项标注）+ FAQ。' : 'One page per city: answer-first summary + data cards (sources & dates) + FAQ.'}</p>
${byRegion.map(({ r, cities }) => `<h2>${esc(REGION_LABEL[lang][r] ?? r)}（${cities.length}）</h2><ul class="list">${cities.map((c) => `<li><a href="${lang === 'zh' ? `/city/${c.id}/` : `/en/city/${c.id}/`}">${esc(lang === 'zh' ? c.nameZh : c.nameEn)}</a><span class="meta">${esc(lang === 'zh' ? c.countryZh : (COUNTRY_BY_CODE.get(c.countryCode)?.nameEn ?? c.countryZh))}${c.monthlyCostUSD != null ? ` · $${Math.round(c.monthlyCostUSD)}/mo` : ''}</span></li>`).join('\n')}</ul>`).join('\n')}
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [breadcrumbJsonLd(lang === 'zh' ? [{ name: '首页', item: page('/') }, { name: '城市索引', item: page(pathZh) }] : [{ name: 'Home', item: page('/en/') }, { name: 'Cities', item: page(pathEn) }])], body });
}

function renderCountriesIndex(lang) {
  const pathZh = '/countries/', pathEn = '/en/countries/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const title = lang === 'zh' ? `65 国定居参考（签证/安全/网速/税负）| 栖居罗盘` : `65 Country Guides: Visa, Safety, Internet & Tax | Siju Compass`;
  const desc = lang === 'zh' ? '按大洲浏览 65 个国家的定居参考数据：护照入境口径、远程工作签证、和平指数、网速与长期居留注意。' : 'Browse 65 country guides: entry rules for Chinese passports, remote-work visas, peace index, internet and long-stay notes.';
  const body = `
<h1>${lang === 'zh' ? '国家资料库' : 'Country guides'}<span class="badge">${COUNTRIES.length} ${lang === 'zh' ? '国' : 'countries'}</span></h1>
<p class="sub">${lang === 'zh' ? 'World Bank/UNDP/IEP/Numbeo/Ookla 快照 + 中国护照入境口径 + 长期居留与税务注意，逐字段来源标注。' : 'World Bank/UNDP/IEP/Numbeo/Ookla snapshots + CN-passport entry rules + long-stay notes, sources per field.'}</p>
${CONTINENTS.map((r) => { const cs = COUNTRIES.filter((c) => COUNTRY_REGION.get(c.code) === r); if (!cs.length) return ''; return `<h2>${esc(REGION_LABEL[lang][r] ?? r)}（${cs.length}）</h2><ul class="list">${cs.map((c) => `<li><a href="${lang === 'zh' ? `/country/${c.code.toLowerCase()}/` : `/en/country/${c.code.toLowerCase()}/`}">${esc(lang === 'zh' ? c.nameZh : c.nameEn)}</a><span class="meta">${c.internetMbpsFixed != null ? `${c.internetMbpsFixed} Mbps` : ''}${c.gpi ? ` · 和平 #${c.gpi.rank}` : ''} · ${c.cityCount ?? 0} 城</span></li>`).join('\n')}</ul>`; }).join('\n')}
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [breadcrumbJsonLd(lang === 'zh' ? [{ name: '首页', item: page('/') }, { name: '国家索引', item: page(pathZh) }] : [{ name: 'Home', item: page('/en/') }, { name: 'Countries', item: page(pathEn) }])], body });
}

// ---------- 方法论页 ----------
function renderMethodology(lang) {
  const pathZh = '/methodology/', pathEn = '/en/methodology/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const title = lang === 'zh' ? '匹配方法论：三层权重、数据来源与许可 | 栖居罗盘' : 'Methodology: Tiered weights, data sources & licences | Siju Compass';
  const desc = lang === 'zh' ? '完整公开匹配引擎的三层权重结构（硬约束过滤 → 核心匹配 → 加分项）、11 维偏好权重、数据来源与许可署名、更新频率与免责声明。' : 'Fully public scoring: tiered weights (hard constraints → core matching → boosters), 11 preference dimensions, data sources & licences, update cadence.';
  const body = `
<h1>${lang === 'zh' ? '匹配方法论与数据口径' : 'Scoring methodology & data'}</h1>
<p class="sub">${lang === 'zh' ? '公开透明，便于核对与引用。更新于 ' + BUILD_DATE : 'Public by design. Updated ' + BUILD_DATE}</p>
<div class="answer"><p>${lang === 'zh'
    ? '栖居罗盘的匹配分（0–99）由三层结构计算：第 1 层硬性条件过滤（预算/签证/安全，一票否决，不参与加权）；第 2 层核心匹配（生活偏好 42% + 人格 30% + 兴趣 18%，缺失维度降权不惩罚）；第 3 层加分项（RIASEC 兴趣强化 5% + 风险联动 3% + 空气质量 2%，合计 ≤10%）。原始分校准为 52 + raw × 0.46 后取整。'
    : 'The matching score (0–99) is computed in three tiers: T1 hard constraints (budget/visa/safety, veto-only, never weighted); T2 core matching (preferences 42% + personality 30% + interests 18%, missing dimensions dropped without penalty); T3 boosters (RIASEC 5% + risk-link 3% + air quality 2%, ≤10% total). Raw score calibrated as 52 + raw × 0.46.'}</p></div>
<h2>${lang === 'zh' ? '第 2 层：11 维偏好权重' : 'Tier 2: 11 preference dimensions'}</h2>
<ul class="list">
<li>预算 budget<span class="meta">0.18（占偏好 0.42 内）</span></li>
<li>气候 climate<span class="meta">0.12</span></li>
<li>节奏 pace / 社交 social<span class="meta">0.10 / 0.10</span></li>
<li>规模 size / 语言 language / 签证 visa / 远程 remote<span class="meta">0.09 × 4</span></li>
<li>气候舒适度 climateComfort<span class="meta">客观 0.05 · Open-Meteo 派生</span></li>
<li>安全 safety<span class="meta">客观 0.05 · Numbeo</span></li>
<li>英语深度 englishDepth<span class="meta">客观 0.04 · EF EPI</span></li>
</ul>
<p class="note">${lang === 'zh' ? '偏好类内部：用户主观 8 维合计 0.86，客观数据 3 维合计 0.14。任何维度缺失时从分子与分母同时剔除（降权不惩罚）。' : 'Within preferences: user-reported 8 dims sum to 0.86, objective 3 dims sum to 0.14. Missing dims are dropped from numerator and denominator (down-weight, never penalised).'}</p>
<h2>${lang === 'zh' ? '第 3 层：加分项（≤10%）' : 'Tier 3: boosters (≤10%)'}</h2>
<ul class="list">
<li>RIASEC 兴趣强化<span class="meta">0.05 · O*NET Interest Profiler（Public Domain）</span></li>
<li>风险画像联动<span class="meta">0.03 · IPIP Risk-Taking（Public Domain）× 城市冒险友好度</span></li>
<li>空气质量 airFit<span class="meta">0.02 · WHO 2021 分档（优 90/良 72/一般 48/差 25）</span></li>
</ul>
<h2>${lang === 'zh' ? '数据来源与许可' : 'Data sources & licences'}</h2>
<ul class="list">
<li>GeoNames cities15000<span class="meta">城市底座 · CC BY 4.0</span></li>
<li>Open-Meteo Historical / Air Quality<span class="meta">气候十年均值 + PM2.5 · CC BY 4.0 · CAMS 再分析</span></li>
<li>Numbeo<span class="meta">成本/安全/医疗/QoL 公开指数（NYC=100）· 遵循其引用政策</span></li>
<li>EF EPI<span class="meta">英语水平国家分档 · EF Education First</span></li>
<li>World Bank / UNDP / Transparency International / IEP<span class="meta">国家级参考 · CC BY 4.0 / 手工快照</span></li>
<li>Ookla Speedtest Intelligence<span class="meta">固定宽带中位下行 · 手工快照</span></li>
<li>IPIP-NEO-120 / IPIP Risk-Taking<span class="meta">人格与风险题库 · Public Domain（ipip.ori.org）</span></li>
<li>OEJTS 1.2<span class="meta">简易版 MBTI 型题库 · CC BY-NC-SA 4.0</span></li>
<li>O*NET Interest Profiler Short Form<span class="meta">RIASEC 题库 · Public Domain（U.S. DOL）</span></li>
<li>WHO Global Air Quality Guidelines 2021<span class="meta">PM2.5 年均分档口径（优 ≤10 / 良 ≤15 / 一般 ≤25 / 差 >25）</span></li>
</ul>
<h2>${lang === 'zh' ? '更新频率与免责声明' : 'Update cadence & disclaimer'}</h2>
<p class="note">${lang === 'zh'
    ? '城市/国家页由构建管道从快照数据生成（本页构建于 ' + BUILD_DATE + '）；Numbeo 类公开指数按季度复核，气候与空气为 2022–2024 多年均值；签证与税务快照日期逐页标注，政策多变请以官方渠道为准。本站为决策辅助工具，不构成投资、法律或移民建议；测评结果为算法输出，不构成专业心理评估。'
    : 'City/country pages are generated from snapshot data at build time (built ' + BUILD_DATE + '); Numbeo-derived indices are reviewed quarterly; climate & air are 2022–2024 multi-year means; visa/tax snapshots carry per-page dates. This site is decision support, not investment, legal or immigration advice, and quiz results are algorithmic outputs, not clinical assessments.'}</p>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [breadcrumbJsonLd(lang === 'zh' ? [{ name: '首页', item: page('/') }, { name: '方法论', item: page(pathZh) }] : [{ name: 'Home', item: page('/en/') }, { name: 'Methodology', item: page(pathEn) }])], body });
}

// ---------- main ----------
function write(rel, content) {
  const abs = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

const sitemapUrls = [];
const addUrl = (p, lastmod) => sitemapUrls.push({ p, lastmod });

export { write, addUrl, sitemapUrls, renderCityPage, renderCountryPage, renderCitiesIndex, renderCountriesIndex, renderMethodology, page };

function main() {
  fs.mkdirSync(DIST, { recursive: true });
  let count = 0;
  for (const city of CITIES) {
    write(`city/${city.id}/index.html`, renderCityPage(city, 'zh')); count++;
    write(`en/city/${city.id}/index.html`, renderCityPage(city, 'en')); count++;
    addUrl(`/city/${city.id}/`, BUILD_DATE); addUrl(`/en/city/${city.id}/`, BUILD_DATE);
  }
  for (const co of COUNTRIES) {
    write(`country/${co.code.toLowerCase()}/index.html`, renderCountryPage(co, 'zh')); count++;
    write(`en/country/${co.code.toLowerCase()}/index.html`, renderCountryPage(co, 'en')); count++;
    addUrl(`/country/${co.code.toLowerCase()}/`, co.updatedAt ?? BUILD_DATE); addUrl(`/en/country/${co.code.toLowerCase()}/`, co.updatedAt ?? BUILD_DATE);
  }
  write('cities/index.html', renderCitiesIndex('zh')); write('en/cities/index.html', renderCitiesIndex('en')); count += 2;
  addUrl('/cities/', BUILD_DATE); addUrl('/en/cities/', BUILD_DATE);
  write('countries/index.html', renderCountriesIndex('zh')); write('en/countries/index.html', renderCountriesIndex('en')); count += 2;
  addUrl('/countries/', BUILD_DATE); addUrl('/en/countries/', BUILD_DATE);
  write('methodology/index.html', renderMethodology('zh')); write('en/methodology/index.html', renderMethodology('en')); count += 2;
  addUrl('/methodology/', BUILD_DATE); addUrl('/en/methodology/', BUILD_DATE);
  addUrl('/', BUILD_DATE); addUrl('/en/', BUILD_DATE);

  // robots.txt
  const robots = ['User-agent: *', 'Allow: /',
    'User-agent: OAI-SearchBot', 'Allow: /',
    'User-agent: GPTBot', 'Allow: /',
    'User-agent: ClaudeBot', 'Allow: /',
    'User-agent: Claude-Web', 'Allow: /',
    'User-agent: PerplexityBot', 'Allow: /',
    'User-agent: Google-Extended', 'Allow: /',
    'User-agent: Bingbot', 'Allow: /',
    'User-agent: Googlebot', 'Allow: /',
    'User-agent: Applebot-Extended', 'Allow: /',
    'User-agent: cohere-ai', 'Allow: /',
    '', `Sitemap: ${page('/sitemap.xml')}`, `# llms.txt: ${page('/llms.txt')}`, ''].join('\n');
  write('robots.txt', robots);

  // llms.txt
  const llms = `# 栖居罗盘 · Siju Compass

> 面向数字游民、自由职业者与远程工作者的海外城市定居决策工具。200 座城市（六洲）+ 65 国参考数据；双版本测评（32 题简易免费 / IPIP-NEO 120 题标准版）；三层匹配引擎：硬约束过滤（预算/签证/安全）→ 核心匹配（偏好 42% + 人格 30% + 兴趣 18%，11 维）→ 加分项（RIASEC/风险联动/空气质量 ≤10%）。评分 0–99，缺失维度降权不惩罚，数据逐项标注来源。

## 主要页面
- [首页 / 测评](${page('/')})
- [匹配方法论](${page('/methodology/')})
- [城市索引（200）](${page('/cities/')})
- [国家索引（65）](${page('/countries/')})

## 城市页示例
- [成都](${page('/city/chengdu/')}) · [里斯本](${page('/city/lisbon/')}) · [清迈](${page('/city/chiang-mai/')}) · [Chengdu (EN)](${page('/en/city/chengdu/')})

## 国家页示例
- [葡萄牙](${page('/country/pt/')}) · [泰国](${page('/country/th/')}) · [Portugal (EN)](${page('/en/country/pt/')})

## 使用条款
- 数据快照逐页标注来源与日期；签证政策多变，以官方渠道为准；不构成投资/法律/移民建议。
- 联系方式与品牌 sameAs 预留位待部署后补充。
`;
  write('llms.txt', llms);

  // sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 中文区（zh-Hans） -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls.map(({ p, lastmod }) => `  <url><loc>${page(p)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${p === '/' ? '1.0' : p.startsWith('/city') || p.startsWith('/country') ? '0.7' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
  write('sitemap.xml', sitemap);

  console.log(`\n落地页生成完成：${count} 页 + robots.txt + llms.txt + sitemap.xml（${sitemapUrls.length} URL）→ dist/`);
  console.log(`域名：${DOMAIN}`);
}

main();

