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
body{font-family:'Noto Sans SC',-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:var(--paper);color:var(--ink);line-height:1.7;font-size:16px;overflow-wrap:break-word}
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
.legal-list{margin:6px 0 14px 20px}
.legal-list li{list-style:disc;margin:6px 0;font-size:15px;color:var(--ink)}
.legal p code{background:var(--paper-deep);border-radius:6px;padding:1px 7px;font-size:13.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.erase{margin:8px 0 26px;border-left:4px solid var(--clay)}
.erase h2{margin-top:0}
.btn-danger{display:inline-block;background:var(--clay);color:#fff;border:none;font-weight:800;font-size:15px;padding:12px 22px;border-radius:12px;cursor:pointer;font-family:inherit}
.btn-danger:hover{background:var(--clay-deep)}
.erase-done{margin-top:12px;color:var(--moss);font-weight:700}
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
<meta property="og:site_name" content="栖居罗盘 · NomadMatch">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<style>${CSS}</style>
${jsonLd.map((j) => `<script type="application/ld+json">\n${JSON.stringify(j, null, 1)}\n</script>`).join('\n')}
</head>
<body>
<header><div class="wrap hd">
<a class="brand" href="${lang === 'zh' ? '/' : '/en/'}"><span class="dot">栖</span>栖居罗盘 · NomadMatch</a>
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
<p style="margin-top:6px">${lang === 'zh' ? '匹配口径与数据许可详见' : 'Scoring methodology & data licences:'} <a href="${lang === 'zh' ? '/methodology/' : '/en/methodology/'}" style="color:var(--pine)">${lang === 'zh' ? '方法论页' : 'Methodology'}</a> · <a href="${lang === 'zh' ? '/privacy/' : '/en/privacy/'}" style="color:var(--pine)">${lang === 'zh' ? '隐私政策' : 'Privacy'}</a> · <a href="${lang === 'zh' ? '/terms/' : '/en/terms/'}" style="color:var(--pine)">${lang === 'zh' ? '用户协议' : 'Terms'}</a> · <a href="${lang === 'zh' ? '/disclaimer/' : '/en/disclaimer/'}" style="color:var(--pine)">${lang === 'zh' ? '免责声明' : 'Disclaimer'}</a> · © 栖居罗盘 NomadMatch</p>
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
    : `${city.nameEn} for Digital Nomads · Cost, Safety, Climate, Internet & Visa | NomadMatch`;
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
    : `${co.nameEn} for Digital Nomads · Visa, Safety, Internet & Tax | NomadMatch`;
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
// 英文本地化首页（sitemap 一直声明 /en/，此前缺文件 → 404；现补齐精简英文版）
function renderEnHome() {
  const title = 'NomadMatch — Where should you live next? 200 city guides for remote workers';
  const desc = 'Free personality & lifestyle quiz that scores 200 cities across cost, safety, climate, internet and visa friendliness — with per-item sources and dates.';
  const body = `
<h1>NomadMatch</h1>
<p class="sub">A decision-support tool for remote workers, freelancers and digital nomads. Take a free personality &amp; lifestyle quiz, get a weighted score for every city in the library, and compare your shortlist.</p>
<div class="grid">
  <div class="card"><div class="k">City library</div><div class="v">200 cities</div><div class="meta"><a href="/en/cities/">Browse city guides</a> · cost, safety, climate, internet, air quality &amp; visa overview with sources</div></div>
  <div class="card"><div class="k">Country library</div><div class="v">65 countries</div><div class="meta"><a href="/en/countries/">Browse country pages</a> · GPI, HDI, connectivity &amp; long-stay notes</div></div>
  <div class="card"><div class="k">How scoring works</div><div class="v">3 tiers, 11 dimensions</div><div class="meta"><a href="/en/methodology/">Methodology</a> · weights, data licences &amp; update cadence</div></div>
  <div class="card"><div class="k">Get started</div><div class="v">Free quiz</div><div class="meta"><a href="/">Start the matching quiz (Chinese UI)</a> · no account needed</div></div>
</div>
<h2>Legal</h2>
<ul class="list">
  <li><a href="/en/terms/">Terms of Service</a></li>
  <li><a href="/en/privacy/">Privacy Policy</a> <span class="meta">no tracking cookies · data stays in your browser (localStorage)</span></li>
  <li><a href="/en/disclaimer/">Disclaimer</a> <span class="meta">information only — not professional advice</span></li>
</ul>
<p class="meta">The full interactive app is available in Chinese at <a href="/">the homepage</a>.</p>`;
  return shell({
    lang: 'en', title, desc,
    canonical: page('/en/'),
    hreflang: { zh: page('/'), en: page('/en/') },
    jsonLd: [breadcrumbJsonLd([{ name: 'Home', item: page('/en/') }])],
    body,
  });
}

function renderCitiesIndex(lang) {  const pathZh = '/cities/', pathEn = '/en/cities/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const byRegion = CONTINENTS.map((r) => ({ r, cities: CITIES.filter((c) => c.continent === r) }));
  const title = lang === 'zh' ? `200 座城市定居资料库（六洲覆盖）| 栖居罗盘` : `200 City Guides for Digital Nomads (6 continents) | NomadMatch`;
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
  const title = lang === 'zh' ? `65 国定居参考（签证/安全/网速/税负）| 栖居罗盘` : `65 Country Guides: Visa, Safety, Internet & Tax | NomadMatch`;
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
  const title = lang === 'zh' ? '匹配方法论：三层权重、数据来源与许可 | 栖居罗盘' : 'Methodology: Tiered weights, data sources & licences | NomadMatch';
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
<li>RIASEC 兴趣强化<span class="meta">0.05 · O*NET Interest Profiler（CC BY 4.0）</span></li>
<li>风险画像联动<span class="meta">0.03 · IPIP Risk-Taking（Public Domain）× 城市冒险友好度</span></li>
<li>空气质量 airFit<span class="meta">0.02 · WHO 2021 分档（优 90/良 72/一般 48/差 25）</span></li>
</ul>
<h2>${lang === 'zh' ? '数据来源与许可' : 'Data sources & licences'}</h2>
<ul class="list">
<li>GeoNames cities15000<span class="meta">城市底座 · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> · <a href="https://www.geonames.org/" target="_blank" rel="noopener">geonames.org</a></span></li>
<li>Open-Meteo Historical / Air Quality<span class="meta">气候十年均值 + PM2.5 · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> · <a href="https://open-meteo.com/" target="_blank" rel="noopener">open-meteo.com</a> · CAMS 再分析</span></li>
<li>Numbeo<span class="meta">成本/安全/医疗/QoL 公开指数（NYC=100）· 遵循其引用政策 · <a href="https://www.numbeo.com/" target="_blank" rel="noopener">numbeo.com</a></span></li>
<li>EF EPI<span class="meta">英语水平国家分档 · <a href="https://www.ef.com/epi/" target="_blank" rel="noopener">ef.com/epi</a> · EF Education First</span></li>
<li>World Bank / UNDP / Transparency International / IEP<span class="meta">国家级参考 · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> / 手工快照</span></li>
<li>Ookla Speedtest Intelligence<span class="meta">固定宽带中位下行 · 手工快照</span></li>
<li>IPIP-NEO-120 / IPIP Risk-Taking<span class="meta">人格与风险题库 · Public Domain（<a href="https://ipip.ori.org/" target="_blank" rel="noopener">ipip.ori.org</a>）</span></li>
<li>OEJTS 1.2<span class="meta">简易版 16 型人格题库（Jungian 双极结构）· <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="license noopener">CC BY-NC-SA 4.0</a> · Open Psychometrics</span></li>
<li>O*NET Interest Profiler Short Form<span class="meta">RIASEC 题库 · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> · <a href="https://www.onetonline.org/" target="_blank" rel="noopener">O*NET OnLine</a>（U.S. DOL 赞助）</span></li>
<li>WHO Global Air Quality Guidelines 2021<span class="meta">PM2.5 年均分档口径（优 ≤10 / 良 ≤15 / 一般 ≤25 / 差 >25）</span></li>
<li>字体 Noto Sans SC / IBM Plex Mono / Source Serif 4<span class="meta">SIL Open Font License 1.1 · 经 @fontsource 自托管打包，无外部 CDN</span></li>
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

/** 法律页双写：dist/（生产 express.static 命中）+ public/（dev 模式 vite 伺服，直达无 404；build 时 public→dist 复制被上方同内容覆盖，无冲突） */
function writeLegal(rel, content) {
  write(rel, content);
  const abs = path.join(ROOT, 'public', rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

const sitemapUrls = [];
const addUrl = (p, lastmod) => sitemapUrls.push({ p, lastmod });

// ---------- 第十三轮：法律页（隐私政策 / 用户协议，zh/en） ----------
// ABOUTME: 内容如实披露 storage.ts 实际键清单（nomadmatch.v1 前缀）；占位项：联系邮箱 / 适用法域
const LEGAL_PRIVACY = {
  zh: {
    title: '隐私政策 | 栖居罗盘',
    desc: '本站不使用追踪 Cookie、无第三方分析、无广告；你的全部数据仅存于浏览器本地存储（nomadmatch.v1），可随时一键清除。隐私政策全文。',
    updated: `最后更新：${BUILD_DATE}`,
    sections: [
      { h: '一、概要与数据控制者', ps: [
        '栖居罗盘（NomadMatch，下称"本站"）是一个运行于浏览器的海外城市定居决策辅助工具。<strong>本站没有账号体系，没有服务器端用户数据库</strong>——所有与"你"有关的信息只存在于你自己的设备中。',
        '数据控制者：NomadMatch 运营者（主体信息待正式部署后补充）。联系邮箱：<code>privacy@nomadmatch.app</code>（占位邮箱，正式部署前将替换为实际邮箱）。',
      ] },
      { h: '二、我们处理哪些数据', ps: [
        '本站<strong>不收集、不上传任何个人数据</strong>。你在使用中产生的全部数据仅保存在<strong>你自己设备浏览器的 localStorage</strong>（键名前缀 <code>nomadmatch.v1</code>），具体包括：',
      ], list: [
        '测评草稿与作答记录（draft / proDraft）——目的地偏好、预算、问卷答案',
        '测评结果与最近一次历史（history / proHistory）——匹配得分与报告数据',
        '收藏城市（favorites）与对比现场、对比存档（compare / archives）',
        '硬性条件与护照选择（hardConstraints / passport）——预算上限、签证底线、安全阈值',
        '界面语言设置（lang）、匿名漏斗计数（funnel）——仅阶段计数，无任何身份信息',
        '标准版解锁状态与本地订单留痕（proUnlocked / orders）——演示性付费记录，详见用户协议',
      ], after: [
        '以上数据均由你主动输入或由你的输入直接计算产生；不含姓名、邮箱、电话、精确位置等直接身份信息。',
      ] },
      { h: '三、我们不做什么（重点声明）', ps: [
        '<strong>无追踪 Cookie</strong>——本站不设置任何 Cookie，也不读取第三方 Cookie。',
        '<strong>无第三方分析与广告</strong>——不加载 Google Analytics 或任何分析/广告脚本，不向任何第三方发送你的数据。',
        '<strong>无 AI 模型处理</strong>——匹配计算完全在你的浏览器内完成，你的作答不会发送给任何 AI 模型或服务器。',
      ] },
      { h: '四、处理目的与法律基础', ps: [
        '处理目的：仅为你正在请求的服务本身——保存测评进度、生成报告、记忆界面设置（GDPR 第 6(1)(b) 条：为履行合同所必需的处理）。',
        '本站不设置 Cookie、不访问终端设备信息用于追踪，上述本地存储属于提供你明确请求的服务所<strong>严格必需（strictly necessary）</strong>的范围（参见 ePrivacy 指令第 5(3) 条的豁免逻辑）。因此本站<strong>不设 Cookie 同意横幅</strong>。',
      ] },
      { h: '五、存储位置与国际传输', ps: [
        '全部数据仅存在于你的设备本地。<strong>没有任何数据上传到服务器，因此不存在国际数据传输</strong>，也不存在服务器端泄露面。',
      ] },
      { h: '六、保存期限', ps: [
        '本地数据会一直保留，<strong>直到你自行清除</strong>——通过浏览器"清除站点数据"，或使用下方"清除我的所有数据"按钮。',
      ] },
      { h: '七、你的权利（GDPR 第 15–22 条）', ps: [
        '依 GDPR，你享有：访问权（第 15 条）、更正权（第 16 条）、删除权 / 被遗忘权（第 17 条）、处理限制权（第 18 条）、数据可携带权（第 20 条）、反对权（第 21 条），以及向监管机构申诉的权利（第 77 条）。',
        '<strong>本站的数据全部在你的设备本地，你可以即时、完全地行使上述全部权利</strong>：',
      ], list: [
        '访问 / 可携带：浏览器开发者工具（Application → Local Storage）可直接查看并导出全部数据',
        '更正 / 删除 / 限制 / 反对：清除对应存储键即告完成——最简单的方式是下方按钮或浏览器"清除站点数据"',
        '如需协助，可发邮件至 privacy@nomadmatch.app，我们在 <strong>30 天内</strong>回复',
      ] },
      { h: '八、未成年人（第 8 条）', ps: [
        '本服务不面向 <strong>16 周岁以下</strong>用户；如你未满 16 周岁，请勿使用本站。',
      ] },
      { h: '九、数据泄露（第 33 / 34 条）', ps: [
        '本站无服务器端存储，常规情况下不存在服务器泄露风险。尽管如此，若发生影响你数据的安全事件，我们将<strong>在知悉后 72 小时内</strong>通过本页显著公告，并在可能时逐一通知受影响用户。',
      ] },
      { h: '十、EEA / 英国补充与加州（CCPA / CPRA）说明', ps: [
        'EEA / 英国：本政策即 GDPR 第 13 条信息义务的完整披露；处理行为均在你设备本地完成，无代表处理者、无自动化决策。',
        '加州：本站不出售也不共享（sell / share）任何个人信息——数据从未离开你的设备，"Do Not Sell My Personal Information" 的要求在本站天然得到满足；加州居民同样享有知情权、删除权与不受歧视的权利。',
      ] },
      { h: '十一、政策变更', ps: [
        '本政策如有实质变更，将在本页更新并标注日期；重大变更时在首页显著位置提示。',
      ] },
      { h: '十二、联系我们', ps: [
        'privacy@nomadmatch.app（占位邮箱，正式部署前替换为实际联系渠道）。',
      ] },
    ],
  },
  en: {
    title: 'Privacy Policy | NomadMatch',
    desc: 'No tracking cookies, no third-party analytics, no ads. All your data stays in your browser local storage (nomadmatch.v1) and can be erased anytime with one click.',
    updated: `Last updated: ${BUILD_DATE}`,
    sections: [
      { h: '1. Overview & controller', ps: [
        'NomadMatch ("the site") is a browser-based decision-support tool for settling abroad. <strong>There are no user accounts and no server-side user database</strong> — everything that relates to you lives only on your own device.',
        'Data controller: the NomadMatch operator (entity details to be added before official launch). Contact: <code>privacy@nomadmatch.app</code> (placeholder, to be replaced with the real mailbox).',
      ] },
      { h: '2. What data we process', ps: [
        'The site <strong>collects and uploads no personal data</strong>. Everything you produce while using it is stored only in <strong>your browser\'s localStorage</strong> (key prefix <code>nomadmatch.v1</code>):',
      ], list: [
        'Quiz drafts & answers (draft / proDraft) — destination preferences, budget, questionnaire answers',
        'Results & latest history (history / proHistory) — match scores and report data',
        'Favorite cities (favorites), compare session and archives (compare / archives)',
        'Hard constraints & passport choice (hardConstraints / passport) — budget cap, visa floor, safety threshold',
        'Interface language (lang), anonymous funnel counters (funnel) — stage counts only, no identity data',
        'Pro unlock state and local order log (proUnlocked / orders) — demo-purchase records, see Terms',
      ], after: [
        'All of it is entered by you or derived from your input. It contains no name, e-mail, phone number or precise location.',
      ] },
      { h: '3. What we do NOT do', ps: [
        '<strong>No tracking cookies</strong> — the site sets no cookies and reads no third-party cookies.',
        '<strong>No third-party analytics or ads</strong> — no Google Analytics, no ad networks, no social plugins; nothing is sent to anyone.',
        '<strong>No AI processing</strong> — matching runs entirely in your browser; your answers never reach any AI model or server.',
      ] },
      { h: '4. Purpose & legal basis', ps: [
        'Purpose: only the service you request — keeping quiz progress, generating reports, remembering your language setting (Art. 6(1)(b) GDPR: processing necessary for the performance of the service).',
        'The site sets no cookies and does not access terminal equipment for tracking. The local storage described above is <strong>strictly necessary</strong> to provide the service you explicitly requested (cf. the exemption logic of Art. 5(3) ePrivacy Directive). The site therefore <strong>shows no consent banner</strong>.',
      ] },
      { h: '5. Storage location & international transfers', ps: [
        'All data stays on your device. <strong>Nothing is uploaded to any server, so there is no international data transfer</strong> and no server-side breach surface.',
      ] },
      { h: '6. Retention', ps: [
        'Local data is kept <strong>until you erase it</strong> — via your browser\'s "clear site data", or the "Erase all my data" button below.',
      ] },
      { h: '7. Your rights (GDPR Art. 15–22)', ps: [
        'Under the GDPR you have: the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20), the right to object (Art. 21), and the right to lodge a complaint with a supervisory authority (Art. 77).',
        '<strong>All data lives on your device, so you can exercise every right instantly and completely</strong>:',
      ], list: [
        'Access / portability: browser dev tools (Application → Local Storage) let you view and export everything',
        'Rectification / erasure / restriction / objection: removing the storage keys is the whole act — the button below or "clear site data" does it',
        'Need help? E-mail privacy@nomadmatch.app — we reply within <strong>30 days</strong>',
      ] },
      { h: '8. Children (Art. 8)', ps: [
        'The service is not offered to anyone <strong>under 16</strong>. If you are under 16, please do not use the site.',
      ] },
      { h: '9. Data breach (Art. 33/34)', ps: [
        'With no server-side storage there is ordinarily no server breach risk. Should a security incident ever affect your data, we will publish a prominent notice on this page <strong>within 72 hours</strong> of becoming aware, and notify affected users individually where possible.',
      ] },
      { h: '10. EEA/UK supplement & California (CCPA/CPRA)', ps: [
        'EEA/UK: this policy constitutes the full Art. 13 GDPR information disclosure; processing happens locally on your device, with no processors and no automated decision-making.',
        'California: the site does not sell or share any personal information — data never leaves your device, so "Do Not Sell My Personal Information" is satisfied by design; California residents also enjoy the rights to know, to delete and to non-discrimination.',
      ] },
      { h: '11. Changes to this policy', ps: [
        'Material changes will be published on this page with an updated date; major changes are announced on the home page.',
      ] },
      { h: '12. Contact', ps: [
        'privacy@nomadmatch.app (placeholder, to be replaced with the actual contact channel).',
      ] },
    ],
  },
};

const LEGAL_TERMS = {
  zh: {
    title: '用户协议 | 栖居罗盘',
    desc: '服务描述、可接受使用、知识产权与开源数据署名、免责声明、演示性计费说明、责任限制与争议解决。用户协议全文。',
    updated: `最后更新：${BUILD_DATE}`,
    sections: [
      { h: '一、服务描述', ps: [
        '栖居罗盘（NomadMatch）为数字游民、自由职业者与远程工作者提供海外城市定居的<strong>决策辅助</strong>：基于你的偏好作答与公开数据快照，对库内 200 座城市加权打分并生成报告。',
        '本站免费提供 32 题简易测评与城市对比；另有一次性 ¥29.9 的标准版（计费说明见第六节）。使用本站无需注册账号。',
      ] },
      { h: '二、可接受使用', ps: [
        '你可以自由浏览与使用本站。你同意不：',
      ], list: [
        '以自动化脚本对本站发起高频请求或以其他方式干扰服务可用性',
        '将本站内容整体转售，或作为你自己产品的核心数据源再分发',
        '对标准版内容进行破解、绕过解锁或再分发',
      ] },
      { h: '三、知识产权与开源数据署名', ps: [
        '本站的界面设计、文案与代码版权归 NomadMatch 运营者所有。',
        '本站引用的公开数据与题库按其许可要求署名（完整清单见方法论页）：',
      ], list: [
        'Numbeo 公开指数（成本 / 安全 / 医疗 / 生活质量，NYC=100 口径）',
        'GeoNames（CC BY 4.0）、Open-Meteo Historical 与 Air Quality（CC BY 4.0）',
        'EF EPI 英语熟练度评级；World Bank / UNDP / Transparency International 国家指标',
        'Ookla Speedtest Intelligence 固定宽带网速中位数',
        'IPIP-NEO 120 题（公有领域，ipip.ori.org）；O*NET Interest Profiler（CC BY 4.0，O*NET OnLine · 美国教育部赞助）；IPIP Risk-Taking（公有领域）；OEJTS 1.2（CC BY-NC-SA 4.0）',
      ] },
      { h: '四、免责声明', ps: [
        '本站按"现状"（as-is）提供，不提供任何明示或默示的保证。',
        '本站内容<strong>不构成移民、法律、税务、财务或医疗建议</strong>；匹配分数仅是基于你自述偏好与第三方公开数据快照的参考值，不构成对任何城市或国家的担保。',
        '数据（成本、安全、网速、签证概览等）为第三方来源的<strong>时点快照，可能过时或存在误差</strong>；签证与入境政策多变，出行与定居前务必通过官方渠道核实。',
      ] },
      { h: '五、责任限制', ps: [
        '在适用法律允许的最大范围内，运营者不对你因使用或无法使用本站而产生的任何间接、附带、特殊或后果性损失承担责任，也不对你的定居、出行或职业决策结果负责。',
      ] },
      { h: '六、计费说明（重要）', ps: [
        '标准版定价 ¥29.9，标注为<strong>一次性虚拟买断（演示性付费）</strong>：支付弹窗是<strong>模拟流程，不会产生任何真实扣款</strong>，本站亦无真实收款与退款流程；购买结果仅记录在你的浏览器本地（proUnlocked / orders），用于解锁标准版测评功能。',
        '退款政策：<strong>所有数字商品（含标准版 Pro 解锁等付费内容）一经购买成功即完成交付，概不退款（All sales are final; no refunds）</strong>。',
        '欧盟消费者合规说明：数字内容即时交付场景下，购买流程包含明确的确认步骤——你需勾选确认<strong>同意立即交付数字内容，并知悉因此丧失欧盟指令 2011/83/EU 第 16(m) 条项下的 14 天撤回权（right of withdrawal）</strong>，确认后方能完成购买；该机制与上述"概不退款"条款一并生效。',
        '清除本地数据（含隐私政策中的"清除我的所有数据"按钮）会一并清除解锁状态，之后可重新走演示性购买流程。',
      ] },
      { h: '七、服务变更与终止', ps: [
        '我们可能随时修改、暂停或终止本站的全部或部分功能。你可以随时停止使用，并通过隐私政策中的按钮清除你的全部本地数据。',
      ] },
      { h: '八、适用法律与争议解决', ps: [
        '本协议适用运营者注册地法律（<strong>占位：待正式部署后补充法域与管辖条款</strong>）。因本协议产生的争议，双方应先友好协商解决。',
      ] },
      { h: '九、联系渠道', ps: [
        'privacy@nomadmatch.app（占位邮箱，正式部署前替换为实际联系渠道）。',
      ] },
    ],
  },
  en: {
    title: 'Terms of Service | NomadMatch',
    desc: 'Service description, acceptable use, IP & open-data attribution, disclaimers, demo billing, limitation of liability and dispute resolution.',
    updated: `Last updated: ${BUILD_DATE}`,
    sections: [
      { h: '1. Service description', ps: [
        'NomadMatch provides <strong>decision support</strong> for digital nomads, freelancers and remote workers settling abroad: it scores the 200 cities in its library against your stated preferences and public data snapshots, and generates a report.',
        'The 32-question lite assessment and city comparison are free; a one-time ¥29.9 Pro version exists (billing, section 6). No account is required.',
      ] },
      { h: '2. Acceptable use', ps: [
        'You may browse and use the site freely. You agree not to:',
      ], list: [
        'send high-frequency automated requests or otherwise disrupt availability',
        'resell the site\'s content as a whole or redistribute it as the core data source of your own product',
        'crack, bypass the unlock of, or redistribute Pro content',
      ] },
      { h: '3. IP & open-data attribution', ps: [
        'The interface design, copy and code are © the NomadMatch operator. Public data and questionnaires are credited per their licences (full list on the Methodology page):',
      ], list: [
        'Numbeo public indices (cost / safety / healthcare / quality of life, NYC=100)',
        'GeoNames (CC BY 4.0), Open-Meteo Historical & Air Quality (CC BY 4.0)',
        'EF EPI English proficiency; World Bank / UNDP / Transparency International country indicators',
        'Ookla Speedtest Intelligence fixed-broadband median speeds',
        'IPIP-NEO 120 (public domain, ipip.ori.org); O*NET Interest Profiler (CC BY 4.0, O*NET OnLine, sponsored by the U.S. Department of Labor); IPIP Risk-Taking (public domain); OEJTS 1.2 (CC BY-NC-SA 4.0)',
      ] },
      { h: '4. Disclaimers', ps: [
        'The site is provided "as is", without warranty of any kind, express or implied.',
        'Its content <strong>is not immigration, legal, tax, financial or medical advice</strong>; match scores are reference values derived from your self-reported preferences and third-party public snapshots, and are no guarantee of any city or country.',
        'Data (cost, safety, speeds, visa overviews) are <strong>point-in-time third-party snapshots and may be outdated or imprecise</strong>. Visa and entry rules change frequently — always verify with official channels before travelling or relocating.',
      ] },
      { h: '5. Limitation of liability', ps: [
        'To the maximum extent permitted by applicable law, the operator is not liable for any indirect, incidental, special or consequential loss arising from your use of (or inability to use) the site, nor for the outcomes of your relocation, travel or career decisions.',
      ] },
      { h: '6. Billing (important)', ps: [
        'The Pro version is priced ¥29.9 as a <strong>one-time virtual purchase (demo billing)</strong>: the payment dialog is a <strong>simulation — no real charge is ever made</strong>, and there is no real collection or refund process. The purchase result is recorded only in your browser (proUnlocked / orders) and merely unlocks the Pro assessment features.',
        'Refund policy: <strong>all digital goods (including the Pro unlock) are deemed delivered upon successful purchase — all sales are final; no refunds.</strong>',
        'EU consumer compliance: where digital content is delivered immediately, the purchase flow includes an explicit confirmation step — you must tick a box confirming that <strong>you consent to the immediate delivery of the digital content and acknowledge that you thereby lose your 14-day right of withdrawal (Art. 16(m) of Directive 2011/83/EU)</strong>; the purchase can only be completed after this confirmation, which gives effect to the no-refund policy above.',
        'Erasing local data (including the "Erase all my data" button in the Privacy Policy) also clears the unlock state, after which the demo purchase flow can be repeated.',
      ] },
      { h: '7. Changes & termination', ps: [
        'We may modify, suspend or discontinue all or part of the site at any time. You may stop using it at any moment and erase all your local data via the button in the Privacy Policy.',
      ] },
      { h: '8. Governing law & dispute resolution', ps: [
        'These terms are governed by the law of the operator\'s place of registration (<strong>placeholder: jurisdiction and venue to be added before official launch</strong>). Disputes shall first be resolved amicably.',
      ] },
      { h: '9. Contact', ps: [
        'privacy@nomadmatch.app (placeholder, to be replaced with the actual contact channel).',
      ] },
    ],
  },
};

const LEGAL_DISCLAIMER = {
  zh: {
    title: '免责声明 | 栖居罗盘',
    desc: '城市评分与推荐仅为信息参考，不构成移民、签证、法律、税务、医疗、保险、财务或投资建议；数据为第三方快照，可能过时或有误差。',
    updated: `最后更新：${BUILD_DATE}`,
    sections: [
      { h: '一、信息性质：仅供参考，不构成专业建议', ps: [
        '本站提供的城市评分、排名与推荐<strong>仅为信息参考</strong>，不构成<strong>移民、签证、法律、税务、医疗、保险、财务或投资建议</strong>。',
        '搬家、签证申请、置业、远程工作安排等重大决策，请咨询当地专业机构，并以政府与官方渠道发布的信息为准。<strong>你基于本站内容做出的任何决定及由此产生的后果，由你自行承担风险</strong>。',
        '人格测评为自我探索工具，其算法输出不构成心理评估、诊断或临床建议。',
      ] },
      { h: '二、数据准确性：第三方快照，可能过时', ps: [
        '本站的成本、安全、气候、网速、空气质量等数据依赖第三方公开来源（Numbeo、Open-Meteo、GeoNames、Ookla、EF EPI、World Bank 等），均为<strong>时点快照</strong>并在相应页面标注快照日期。',
        '第三方数据可能过时、不完整或存在口径误差，本站<strong>不对任何数据的准确性、完整性或时效性作出保证</strong>；快照日期之后的变化本站不承担更新义务（但会按方法论页披露的频率复核）。',
      ] },
      { h: '三、无担保（as-is / as-available）', ps: [
        '本服务按"现状"（as-is）与"可用"（as-available）提供，不作任何明示或默示的担保，包括但不限于对适销性、特定用途适用性与不侵权的担保；本站不保证服务不间断、无错误或安全。',
      ] },
      { h: '四、与其他法律文件的关系', ps: [
        '本声明与<a href="/terms/">《用户协议》</a>（尤其其免责声明与责任限制章节）一并适用；数据处理见<a href="/privacy/">《隐私政策》</a>。三者冲突时，以更具体约定优先。',
      ] },
    ],
  },
  en: {
    title: 'Disclaimer | NomadMatch',
    desc: 'City scores and recommendations are for information only — not immigration, visa, legal, tax, medical, insurance, financial or investment advice. Data are third-party snapshots and may be outdated.',
    updated: `Last updated: ${BUILD_DATE}`,
    sections: [
      { h: '1. Nature of information: reference only, not professional advice', ps: [
        'City scores, rankings and recommendations on this site are <strong>for information only</strong> and do not constitute <strong>immigration, visa, legal, tax, medical, insurance, financial or investment advice</strong>.',
        'For major decisions — relocating, visa applications, property, remote-work arrangements — consult local professionals and rely on official government sources. <strong>Any decision you make based on this site, and its consequences, are at your own risk.</strong>',
        'The personality assessment is a self-exploration tool; its algorithmic output is not a psychological evaluation, diagnosis or clinical advice.',
      ] },
      { h: '2. Data accuracy: third-party snapshots that may be outdated', ps: [
        'Cost, safety, climate, internet-speed and air-quality data rely on third-party public sources (Numbeo, Open-Meteo, GeoNames, Ookla, EF EPI, World Bank, etc.) and are <strong>point-in-time snapshots</strong> with the snapshot date shown on each page.',
        'Third-party data can be outdated, incomplete or inconsistent in methodology. The site <strong>makes no warranty as to accuracy, completeness or timeliness</strong> of any data, and is not obliged to update beyond the review cadence published on the Methodology page.',
      ] },
      { h: '3. No warranty (as-is / as-available)', ps: [
        'The service is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement; the site does not warrant uninterrupted, error-free or secure operation.',
      ] },
      { h: '4. Relation to other legal documents', ps: [
        'This disclaimer applies together with the <a href="/en/terms/">Terms of Service</a> (in particular its disclaimer and limitation-of-liability sections); data handling is described in the <a href="/en/privacy/">Privacy Policy</a>. Where these documents conflict, the more specific provision prevails.',
      ] },
    ],
  },
};

/** 法律页：自包含 HTML，隐私页含"清除我的所有数据"最小 JS（删除 nomadmatch.v1:* 全部键） */
function renderLegalPage(kind, lang) {
  const zh = lang === 'zh';
  const LEGAL_BY_KIND = { privacy: LEGAL_PRIVACY, terms: LEGAL_TERMS, disclaimer: LEGAL_DISCLAIMER };
  const LEGAL_NAME = {
    zh: { privacy: '隐私政策', terms: '用户协议', disclaimer: '免责声明' },
    en: { privacy: 'Privacy Policy', terms: 'Terms of Service', disclaimer: 'Disclaimer' },
  };
  const d = LEGAL_BY_KIND[kind][lang];
  const name = LEGAL_NAME[lang][kind];
  const canonical = page(zh ? `/${kind}/` : `/en/${kind}/`);
  const crossLinks = ['privacy', 'terms', 'disclaimer']
    .filter((k) => k !== kind)
    .map((k) => `<li><a href="${zh ? `/${k}/` : `/en/${k}/`}">${LEGAL_NAME[lang][k]}</a><span class="meta">${zh ? '相关法律文件' : 'Related legal document'}</span></li>`)
    .join('');
  const sections = d.sections
    .map((s, i) => {
      let html = `<h2 id="s${i}">${esc(s.h)}</h2>` + s.ps.map((p) => `<p>${p}</p>`).join('');
      if (s.list) html += `<ul class="legal-list">${s.list.map((li) => `<li>${li}</li>`).join('')}</ul>`;
      if (s.after) html += s.after.map((p) => `<p>${p}</p>`).join('');
      return html;
    })
    .join('');
  const eraseBlock = kind === 'privacy'
    ? `<section class="card erase" id="erase">
<h2>${zh ? '清除我的所有数据' : 'Erase all my data'}</h2>
<p>${zh
        ? '以下按钮立即删除本浏览器中本站存储的全部数据（<code>nomadmatch.v1</code> 前缀所有键：测评草稿、历史、收藏、对比存档、硬性条件、语言设置、漏斗计数与演示性购买记录）。删除不可恢复。'
        : 'The button below immediately deletes everything this site has stored in this browser (every key prefixed <code>nomadmatch.v1</code>: quiz drafts, history, favorites, compare archives, constraints, language, funnel counters and demo purchase records). Deletion is irreversible.'}</p>
<button class="btn-danger" onclick="eraseAll()">${zh ? '清除我的所有数据' : 'Erase all my data'}</button>
<p id="erase-done" class="erase-done" hidden></p>
<noscript><p>${zh ? '（需要启用 JavaScript 才能使用此按钮；你也可以直接在浏览器设置中清除本站数据。）' : '(JavaScript is required for this button; you can also clear this site\'s data in your browser settings.)'}</p></noscript>
</section>
<script>
function eraseAll() {
  if (!window.confirm('${zh ? '确认删除本站保存在本浏览器的全部数据（测评草稿/历史/收藏/对比存档/购买状态等）？此操作不可恢复。' : 'Delete all data this site has stored in this browser (drafts, history, favorites, compare archives, purchase state)? This cannot be undone.'}')) return;
  var ks = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf('nomadmatch.v1:') === 0) ks.push(k);
  }
  ks.forEach(function (k) { localStorage.removeItem(k); });
  var d = document.getElementById('erase-done');
  d.hidden = false;
  d.textContent = '${zh ? '✓ 已删除 ' : '✓ Erased '}' + ks.length + '${zh ? ' 项本地数据（nomadmatch.v1 全部键）。' : ' local item(s) — every nomadmatch.v1 key.'}';
}
</script>`
    : '';
  const crossLink = `<div class="list">${crossLinks}</div>`;
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'WebPage', name: d.title, description: d.desc,
      url: canonical, inLanguage: zh ? 'zh-Hans' : 'en', isPartOf: { '@id': `${DOMAIN}/#organization` },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: zh ? '首页' : 'Home', item: page(zh ? '/' : '/en/') },
        { '@type': 'ListItem', position: 2, name, item: canonical },
      ],
    },
  ];
  const body = `<p class="crumbs"><a href="${zh ? '/' : '/en/'}">${zh ? '首页' : 'Home'}</a> / ${zh ? '法律' : 'Legal'}</p>
<h1>${name}</h1>
<p class="sub">${d.updated}</p>
${sections}
${eraseBlock}
${crossLink}`;
  return shell({ lang, title: d.title, desc: d.desc, canonical, hreflang: { zh: page(`/${kind}/`), en: page(`/en/${kind}/`) }, jsonLd, body });
}

export { write, addUrl, sitemapUrls, renderCityPage, renderCountryPage, renderCitiesIndex, renderCountriesIndex, renderMethodology, renderLegalPage, page };

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
  // 第十三轮：法律页（隐私政策 / 用户协议 / 免责声明，zh/en；双写 public/ 供 dev 直达）
  writeLegal('privacy/index.html', renderLegalPage('privacy', 'zh')); writeLegal('en/privacy/index.html', renderLegalPage('privacy', 'en')); count += 2;
  addUrl('/privacy/', BUILD_DATE); addUrl('/en/privacy/', BUILD_DATE);
  writeLegal('terms/index.html', renderLegalPage('terms', 'zh')); writeLegal('en/terms/index.html', renderLegalPage('terms', 'en')); count += 2;
  addUrl('/terms/', BUILD_DATE); addUrl('/en/terms/', BUILD_DATE);
  writeLegal('disclaimer/index.html', renderLegalPage('disclaimer', 'zh')); writeLegal('en/disclaimer/index.html', renderLegalPage('disclaimer', 'en')); count += 2;
  addUrl('/disclaimer/', BUILD_DATE); addUrl('/en/disclaimer/', BUILD_DATE);
  addUrl('/', BUILD_DATE); addUrl('/en/', BUILD_DATE);
  write('en/index.html', renderEnHome()); count++;

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
  const llms = `# 栖居罗盘 · NomadMatch

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

