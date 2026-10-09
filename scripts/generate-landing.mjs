// ABOUTME: 第十二轮 SEO/GEO 基建——构建后静态落地页生成器
// ABOUTME: 270 城 + 65 国 + 索引页 + 方法论页（zh/en）+ robots.txt + llms.txt + sitemap.xml + 404
// 运行时机：vite build 之后（产物写入 dist/）。用 tsx 运行以便直接复用 src/i18n 的英译表。
// 数据来源：src/data/cities/*.json 与 src/data/countries.json（null 不编造）
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
// 复用主应用同一份英译表（TS 文件，经 tsx 运行时可加载），保证 EN 落地页与前端 EN 口径一致。
// 注意：tsx 对静态 import 的 .ts 说明符不做命名导出链接，须用动态 import。
const { ENTRY_NOTE_EN } = await import('../src/i18n/entryNotes.ts');
const { VISA_OVERVIEW_EN, VISA_LABEL_EN, RENTAL_EN, CURRENCY_EN, LANGUAGE_EN } = await import('../src/i18n/countryGlossary.ts');
// 税负规则字典（V1）：与前端同一事实源，静态页税率/税制与运行时展示口径一致。
const { TAX_RULES, TAX_BASELINE_EFF_RATE } = await import('../src/data/taxRules.ts');
// 分级税率数据集（V2 多国累进沙盒）：静态页的「分级引擎」区块与运行时 TaxPlanner 口径一致。
const { TAX_BRACKETS, taxProfileForCountry, thresholdLocal, TAX_FX_ASOF } = await import('../src/data/taxBrackets.ts');

// 数据层英译查表：命中输出英文，未命中回落原文（与 countryGlossary 的 pick 同策略）。
const pick = (table, zh) => (zh == null ? '—' : table[zh] ?? zh);
const visaOverviewLabel = (zh, lang) => (lang === 'en' ? pick(VISA_OVERVIEW_EN, zh) : zh ?? '—');
const visaLabelText = (zh, lang) => (lang === 'en' ? pick(VISA_LABEL_EN, zh) : zh ?? '—');
const rentalLabel = (zh, lang) => (lang === 'en' ? pick(RENTAL_EN, zh) : zh ?? '—');
const currencyLabel = (zh, lang) => (lang === 'en' ? pick(CURRENCY_EN, zh) : zh ?? '—');
const languageLabel = (zh, lang) => (lang === 'en' ? pick(LANGUAGE_EN, zh) : zh ?? '—');
// 护照入境枚举（visaPassport.entry 为数据层英文枚举）与数字游民友好度枚举 → 英文措辞。
const VISA_ENTRY_EN = {
  visaFree: 'visa-free for China',
  visaRequired: 'required to obtain a visa',
  eVisa: 'eligible for an e-Visa',
  visaOnArrival: 'eligible for a visa on arrival',
};
const DN_FRIENDLINESS_EN = { friendly: 'friendly', unknown: 'not documented' };

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const DOMAIN = (() => {
  // 生产域名来源优先级：SITE_URL（Cloudflare 环境变量）> CF_PAGES_URL（自动注入）> 兜底线上域名。
  // 绝不能再回退到任何 demo/占位域名，否则 canonical/sitemap/robots 会指向错误站点导致真实域名被判定重复。
  const raw = process.env.SITE_URL || process.env.CF_PAGES_URL || 'https://gethabitatcompass.com';
  const withProto = raw.startsWith('http') ? raw : `https://${raw}`;
  return withProto.replace(/\/+$/, '');
})();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ---------- lastmod 来源：数据文件的最后提交日期 ----------
// 此前所有 URL 一律用 BUILD_DATE，导致每次部署都声称「全站刚更新」——搜索引擎会因此
// 降低对 lastmod 的信任甚至忽略。改为取该页数据文件的 git 最后提交日期（YYYY-MM-DD）。
// CI/浅克隆或非 git 环境（无 .git / 未安装 git）取不到，则回落到 BUILD_DATE，保证不崩、不编造。
const gitDateCache = new Map();
function fileLastModified(relPath) {
  if (gitDateCache.has(relPath)) return gitDateCache.get(relPath);
  let date = BUILD_DATE;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', relPath], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) date = out;
  } catch {
    // 非 git 环境：回落 BUILD_DATE
  }
  gitDateCache.set(relPath, date);
  return date;
}
/** 取一组数据文件中最新的一次提交日期（代表该页面所依据数据的刷新时间） */
function dataLastModified(relPaths) {
  return relPaths
    .map(fileLastModified)
    .reduce((a, b) => (a > b ? a : b), '0000-00-00');
}
const CITY_DATA_FILES = fs.readdirSync(path.join(ROOT, 'src/data/cities')).map((f) => `src/data/cities/${f}`);
const CITY_DATA_DATE = dataLastModified(CITY_DATA_FILES);
const COUNTRY_DATA_DATE = dataLastModified(['src/data/countries.json']);
// 代码驱动页（首页/方法论/法律页）的内容随生成脚本走，取其最后提交日期。
const SCRIPT_DATE = fileLastModified('scripts/generate-landing.mjs');

// ---------- token 色值：从 tailwind.config.js 提取（与主站唯一事实源同步） ----------
function readToken(name) {
  const src = fs.readFileSync(path.join(ROOT, 'tailwind.config.js'), 'utf8');
  const patterns = {
    pine: /pine:\s*'(#[0-9A-Fa-f]{6})'/,
    pineDeep: /pine-deep:\s*'(#[0-9A-Fa-f]{6})'/,
    teal: /teal:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    paper: /paper:\s*'(#[0-9A-Fa-f]{6})'/,
    paperDeep: /'paper-deep':\s*'(#[0-9A-Fa-f]{6})'/,
    ink: /ink:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    'ink-soft': /soft:\s*'(#[0-9A-Fa-f]{6})'/,
    clay: /clay:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    clayDeep: /clay:\s*\{[^}]*deep:\s*'(#[0-9A-Fa-f]{6})'/,
    ochre: /ochre:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    moss: /moss:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
    sea: /sea:\s*\{[^}]*DEFAULT:\s*'(#[0-9A-Fa-f]{6})'/,
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
// 城市实景图集（public/city-images/<id>.webp）；构建时先由 vite build 从 public/ 复制到 dist/。
// 用文件名集合判断是否有对应 OG 图，缺失时回落品牌封面，避免生成死链。
const IMAGE_IDS = new Set(
  fs.existsSync(path.join(ROOT, 'public/city-images'))
    ? fs.readdirSync(path.join(ROOT, 'public/city-images')).map((f) => f.replace(/\.webp$/, ''))
    : [],
);
// WebP 实际像素尺寸（依赖无关的最小解析器）：用于 og:image:width/height 与真实图一致，
// 否则分享卡/结构化数据声明错尺寸会导致预览裁切异常。支持 VP8（有损）/VP8L（无损）/VP8X（扩展）。
function webpSize(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8 ') {
    // 帧标签 3B + 起始码 0x9d012a(3B)，其后 2B 宽、2B 高（各取低 14 位）
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    // 签名 0x2f(1B)，随后 14 位宽-1、14 位高-1（小端位流）
    const bits = buf.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X') {
    // flags(1B) + reserved(3B)，随后 24 位画布宽-1、24 位高-1
    const w = (buf.readUInt8(24) | (buf.readUInt8(25) << 8) | (buf.readUInt8(26) << 16)) + 1;
    const h = (buf.readUInt8(27) | (buf.readUInt8(28) << 8) | (buf.readUInt8(29) << 16)) + 1;
    return { w, h };
  }
  return null;
}
const IMAGE_SIZE = new Map();
for (const id of IMAGE_IDS) {
  try {
    const s = webpSize(fs.readFileSync(path.join(ROOT, 'public/city-images', `${id}.webp`)));
    if (s) IMAGE_SIZE.set(id, s);
  } catch {
    // 读取失败则回落品牌封面尺寸，不阻断构建
  }
}

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
body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.7;font-size:16px;overflow-wrap:break-word}
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
.fresh{font-size:12px;color:var(--ink-soft);margin-top:8px}
.support-link{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--clay-deep);text-decoration:none;border:1px solid var(--paper-deep);background:var(--card);border-radius:999px;padding:6px 14px;transition:all .25s ease}
.support-link:hover{background:var(--clay);color:#fff;border-color:var(--clay)}
.badge{display:inline-block;background:var(--paper-deep);color:var(--pine-deep);font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;margin-left:8px;vertical-align:middle}
.note{font-size:13px;color:var(--ink-soft);margin:8px 0 18px}
.lang{font-size:13px}
.lang a{color:var(--teal);text-decoration:none;font-weight:600}
.legal-list{margin:6px 0 14px 20px}
.legal-list li{list-style:disc;margin:6px 0;font-size:15px;color:var(--ink)}
.notice{background:var(--paper-deep);border-left:4px solid var(--clay);border-radius:10px;padding:12px 14px;margin:14px 0 18px;font-size:15px;color:var(--ink);line-height:1.7}
.toc{background:var(--card);border:1px solid var(--paper-deep);border-radius:14px;padding:16px 20px;margin:0 0 22px}
.toc-h{font-size:13px;font-weight:700;letter-spacing:.4px;color:var(--ink-soft);margin-bottom:8px}
.toc ol{margin:0;padding-left:20px;columns:2;column-gap:26px}
.toc li{font-size:13.5px;margin:4px 0;break-inside:avoid}
.toc a{color:var(--pine);text-decoration:none}
.toc a:hover{text-decoration:underline}
.attr{font-size:12.5px;color:var(--ink-soft);line-height:1.7;margin:0 0 18px;padding-top:14px;border-top:1px dashed var(--paper-deep)}
.attr a{color:var(--pine);text-decoration:none}
.attr a:hover{text-decoration:underline}
h2[id]{scroll-margin-top:16px}
@media(max-width:560px){
  .toc ol{columns:1}
  h1{font-size:25px}
  .grid{grid-template-columns:1fr}
  .wrap{padding:0 16px}
}
.legal p code{background:var(--paper-deep);border-radius:6px;padding:1px 7px;font-size:13.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
table.tbl{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--paper-deep);border-radius:12px;overflow:hidden;margin:0 0 20px;font-size:14px}
table.tbl th,table.tbl td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--paper-deep);vertical-align:top}
table.tbl th{font-size:12px;color:var(--ink-soft);font-weight:700;letter-spacing:.3px;background:var(--paper-deep);white-space:nowrap}
table.tbl tr:last-child td{border-bottom:none}
table.tbl a{color:var(--pine);text-decoration:none}
table.tbl a:hover{text-decoration:underline}
/* 表格宽于容器时横向滚动，避免窄屏把标签挤成「一字一行」 */
.tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 20px;border-radius:12px}
.tblwrap table.tbl{margin-bottom:0}
.tagpill{display:inline-block;border-radius:999px;padding:1px 9px;font-size:12px;font-weight:700;border:1px solid;white-space:nowrap}
.tagpill.t-exempt{border-color:#5F7A5A;background:rgba(95,122,90,.12);color:#51694B}
.tagpill.t-territorial{border-color:#7FA8B8;background:rgba(127,168,184,.14);color:#2F6A7D}
.tagpill.t-concession{border-color:#B98A2F;background:rgba(185,138,47,.12);color:#8A5F0A}
.tagpill.t-standard{border-color:#1F2421;background:rgba(31,36,33,.05);color:#6B6F6C}
.erase{margin:8px 0 26px;border-left:4px solid var(--clay)}
.erase h2{margin-top:0}
.btn-danger{display:inline-block;background:var(--clay);color:#fff;border:none;font-weight:800;font-size:15px;padding:12px 22px;border-radius:12px;cursor:pointer;font-family:inherit}
.btn-danger:hover{background:var(--clay-deep)}
.erase-done{margin-top:12px;color:var(--moss);font-weight:700}
@media(max-width:560px){h1{font-size:24px}.card .v{font-size:19px}}
`;

function shell({ lang, title, desc, canonical, hreflang, jsonLd = [], body, image, imageAlt, imageW, imageH, robots }) {
  const alt = hreflang ? (lang === 'zh' ? hreflang.en : hreflang.zh) : null;
  const ogImage = image || page('/og-cover.jpg');
  const ogAlt = imageAlt || (lang === 'zh' ? '栖居罗盘 · Habitat Compass' : 'Habitat Compass');
  const ogW = imageW || (image ? 800 : 1200);
  const ogH = imageH || (image ? 512 : 630);
  const langSwitch = alt
    ? (lang === 'zh'
      ? `<span class="lang"><a href="${esc(alt)}" hreflang="en" rel="alternate">English</a></span>`
      : `<span class="lang"><a href="${esc(alt)}" hreflang="zh-Hans" rel="alternate">中文</a></span>`)
    : '';
  const seoHead = canonical
    ? `<link rel="canonical" href="${esc(canonical)}">
${Object.entries(hreflang).map(([k, v]) => `<link rel="alternate" hreflang="${k === 'zh' ? 'zh-Hans' : 'en'}" href="${esc(v)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(hreflang.zh)}">
<meta property="og:url" content="${esc(canonical)}">`
    : '';
  const robotsHead = robots ? `<meta name="robots" content="${esc(robots)}">` : '';
  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-Hans' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="${T.pine}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="栖居罗盘">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${robotsHead}
${seoHead}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="栖居罗盘 · Habitat Compass">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="${ogW}">
<meta property="og:image:height" content="${ogH}">
<meta property="og:image:alt" content="${esc(ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<meta name="twitter:image:alt" content="${esc(ogAlt)}">
<style>${CSS}</style>
${jsonLd.map((j) => `<script type="application/ld+json">\n${JSON.stringify(j, null, 1)}\n</script>`).join('\n')}
</head>
<body>
<header><div class="wrap hd">
<a class="brand" href="${lang === 'zh' ? '/' : '/en/'}"><span class="dot">栖</span>栖居罗盘 · Habitat Compass</a>
<nav>
<a href="${lang === 'zh' ? '/cities/' : '/en/cities/'}">${lang === 'zh' ? '城市索引' : 'Cities'}</a>
<a href="${lang === 'zh' ? '/countries/' : '/en/countries/'}">${lang === 'zh' ? '国家索引' : 'Countries'}</a>
<a href="${lang === 'zh' ? '/tax-calculator/' : '/en/tax-calculator/'}">${lang === 'zh' ? '税负测算' : 'Tax planner'}</a>
<a href="${lang === 'zh' ? '/methodology/' : '/en/methodology/'}">${lang === 'zh' ? '方法论' : 'Methodology'}</a>
${langSwitch}
</nav>
</div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">
<p>${lang === 'zh'
    ? '数据来源：官方开放数据（Open Data）与公开统计测算 · Open-Meteo（CC BY 4.0）· GeoNames（CC BY 4.0）· WHO 2021 空气质量指导值分档 · 快照日期见各数据卡。签证与政策多变，出行前务必核实官方渠道；本站为决策辅助工具，不构成任何投资、法律或移民建议。'
    : 'Data sources: official open data & public statistical estimates · Open-Meteo (CC BY 4.0) · GeoNames (CC BY 4.0) · WHO 2021 air quality guideline bands · snapshot dates on each card. Visa policies change frequently — always verify with official channels before travelling. This site is a decision-support tool and is not immigration, visa, legal, tax, medical, or financial advice.'}</p>
<p style="margin-top:6px">${lang === 'zh' ? '匹配口径与数据许可详见' : 'Scoring methodology & data licences:'} <a href="${lang === 'zh' ? '/methodology/' : '/en/methodology/'}" style="color:var(--pine)">${lang === 'zh' ? '方法论页' : 'Methodology'}</a> · <a href="${lang === 'zh' ? '/privacy/' : '/en/privacy/'}" style="color:var(--pine)">${lang === 'zh' ? '隐私政策' : 'Privacy'}</a> · <a href="${lang === 'zh' ? '/terms/' : '/en/terms/'}" style="color:var(--pine)">${lang === 'zh' ? '用户协议' : 'Terms'}</a> · <a href="${lang === 'zh' ? '/disclaimer/' : '/en/disclaimer/'}" style="color:var(--pine)">${lang === 'zh' ? '免责声明' : 'Disclaimer'}</a> · © 栖居罗盘 Habitat Compass</p>
<p class="fresh">${lang === 'zh' ? '数据更新至 2026 年 Q4' : 'Data updated for Q4 2026'} · ${lang === 'zh' ? '发现租金或网速数据有误？写信给' : 'Spotted inaccurate rent or internet speed? Drop a note to'} <a href="mailto:hi@habitatcompass.com" style="color:var(--pine)">hi@habitatcompass.com</a> ${lang === 'zh' ? '，帮助更多同路人。' : 'and help fellow nomads.'}</p>
<p style="margin-top:10px"><a class="support-link" href="https://ko-fi.com/matthao9701" target="_blank" rel="noopener noreferrer" aria-label="${lang === 'zh' ? '通过 Ko-fi 支持栖居罗盘（在新窗口打开）' : 'Support Habitat Compass on Ko-fi (opens in a new tab)'}">☕ ${lang === 'zh' ? '请我喝杯咖啡' : 'Buy me a coffee'}</a></p>
</div></footer>
</body>
</html>`;
}

// ---------- 城市：数据卡 ----------
function cityCards(city, lang) {
  const S = lang === 'zh' ? '来源：' : 'Source: ';
  const money = (v) => `$${Math.round(v)}`;
  const no = (zh, en) => lang === 'zh' ? zh : en;
  const cards = [];
  const cost = city.monthlyCostUSD;
  cards.push(cost != null
    ? { h: no('月生活成本', 'Monthly cost'), v: money(cost), small: no('含房租 · 估算区间', 'incl. rent · est. range'), detail: `${city.cost?.[0] != null ? money(city.cost[0]) : '?'} – ${city.cost?.[1] != null ? money(city.cost[1]) : '?'}`, src: `${S}${no(`公开统计测算（NYC=100 口径）线性拟合 + 页面快照，更新于 ${BUILD_DATE}`, `public statistical estimate (NYC=100 basis) linear fit + page snapshot, updated ${BUILD_DATE}`)}` }
    : { h: no('月生活成本', 'Monthly cost'), none: no('数据待核实', 'Data pending'), src: `${S}${no('暂无该城公开测算明细（不编造数据）', 'no city-level public estimate available (we do not fabricate data)')}` });
  const safety = city.safety;
  cards.push(safety != null
    ? { h: no('安全指数', 'Safety index'), v: `${safety}<small>/100</small>`, src: `${S}${no('公开统计测算 · 安全指数', 'public statistical estimate · safety index')}` }
    : { h: no('安全指数', 'Safety index'), none: no('数据待核实（国家级参考见下）', 'Data pending (see country-level)'), src: `${S}${no('暂无该城安全测算数据', 'no city-level safety estimate')}` });
  const cl = city.climateDetail;
  cards.push(cl
    ? { h: no('气候（十年均值）', 'Climate (10-yr avg)'), v: `${cl.avgTempC}<small>${no('°C 年均', '°C avg/yr')}</small>`, detail: `${cl.annualPrecipMm}mm · ${cl.sunshineHours}${no('h 日照/年', 'h sunshine/yr')}`, src: `${S}Open-Meteo Historical（CC BY 4.0）2015–2024` }
    : { h: no('气候', 'Climate'), none: no('数据待核实', 'Data pending'), src: `${S}Open-Meteo` });
  const mbps = city.internetMbps ?? COUNTRY_BY_CODE.get(city.countryCode)?.internetMbpsFixed ?? null;
  cards.push(mbps != null
    ? { h: no('固定宽带', 'Fixed broadband'), v: `${mbps}<small>${no('Mbps 下行中位', 'Mbps median down')}</small>`, src: `${S}${no('公开统计测算（固定宽带）', 'public statistical estimate (fixed broadband)')}${city.internetMbps == null ? no('（国家级口径）', ' (country-level)') : ''}` }
    : { h: no('固定宽带', 'Fixed broadband'), none: no('数据待核实', 'Data pending'), src: `${S}${no('暂无公开网速测算', 'no public speed estimate')}` });
  const aq = city.airQuality;
  cards.push(aq
    ? { h: no('空气质量', 'Air quality'), v: `${aq.pm25}<small>µg/m³ PM2.5 · ${AIR_BAND[lang][aq.band]}</small>`, src: `${S}${no(`Open-Meteo CAMS · WHO 2021 分档（${aq.period}）`, `Open-Meteo CAMS · WHO 2021 band (${aq.period})`)}` }
    : { h: no('空气质量', 'Air quality'), none: no('数据待核实', 'Data pending'), src: `${S}Open-Meteo Air Quality` });
  const co = COUNTRY_BY_CODE.get(city.countryCode);
  const visaCity = city.visaStatus ? (VISA_STATUS[lang][city.visaStatus] ?? city.visaStatus) : null;
  const visaFallback = co?.visaOverview ? visaOverviewLabel(co.visaOverview, lang) : no('以国家级信息为准 · 政策多变请核实官方渠道', 'See country-level info · verify with officials');
  cards.push({ h: no('签证概览', 'Visa overview'), none: visaCity ?? visaFallback, src: `${S}${co ? no(`${co.nameZh} 快照（${co.updatedAt}）`, `${co.nameEn} snapshot (${co.updatedAt})`) : no('手工快照', 'hand snapshot')} · ${no('免责：签证政策多变，务必核实官方渠道', 'Disclaimer: visa policies change — always verify with official channels')}` });
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
        ? `${city.nameZh}估算月生活成本约 $${Math.round(city.monthlyCostUSD)}（含一居室房租；区间 $${city.cost?.[0] != null ? Math.round(city.cost[0]) : '?'}–$${city.cost?.[1] != null ? Math.round(city.cost[1]) : '?'}），一居室月租约 $${city.housingLevel != null ? Math.round(city.housingLevel) : '?'}。口径为公开统计测算（open-data estimates）线性拟合与页面快照，随汇率与城市更新浮动。`
        : `${city.nameZh}暂无可靠的公开生活成本明细（暂无该城公开测算），本站不编造数据；可参考其所在${city.countryZh}的国家级成本水位与后续数据更新。`,
    });
    faqs.push({
      q: `${city.nameZh}安全吗？`,
      a: city.safety != null
        ? `${city.nameZh}的公开统计测算安全指数为 ${city.safety}/100（越高越安全）。总体而言${city.safety >= 60 ? '治安处于较好水平，常规旅行防范即可' : city.safety >= 40 ? '治安中等，建议夜间避免偏僻区域并留意财物' : '治安压力较大，需提高防范意识并选择安全社区居住'}。`
        : `${city.nameZh}暂无城市级安全指数，其所在${city.countryZh}的公开统计测算国家安全参考为 ${co?.safetyScore ?? '待补充'}/100${co?.gpi ? `，全球和平指数排名 #${co.gpi.rank}` : ''}。建议出行前查看最新领事与当地安全通报。`,
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
        ? `${city.nameZh}${city.internetMbps != null ? '' : '（国家级口径）'}固定宽带下行中位约 ${mbps} Mbps（公开统计测算），${mbps >= 100 ? '足以支撑高清视频会议与大文件传输等网络密集型工作' : mbps >= 50 ? '可满足日常视频会议与远程协作' : '建议将网络密集型任务安排在网络低峰，或备移动热点'}。`
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
        ? `${city.nameEn} has an estimated monthly cost of ~$${Math.round(city.monthlyCostUSD)} including rent (range $${city.cost?.[0] != null ? Math.round(city.cost[0]) : '?'}–$${city.cost?.[1] != null ? Math.round(city.cost[1]) : '?'}), based on open-data statistical estimates and page snapshots.`
        : `Reliable public cost details for ${city.nameEn} are not yet available (no city-level public estimate); we do not fabricate data — see country-level figures instead.`,
    });
    faqs.push({
      q: `Is ${city.nameEn} safe?`,
      a: city.safety != null
        ? `${city.nameEn} scores ${city.safety}/100 on the public statistical safety estimate (higher is safer).`
        : `City-level safety index is pending; country-level reference for ${cN} is ${co?.safetyScore ?? 'n/a'}/100${co?.gpi ? ` (Global Peace Index rank #${co.gpi.rank})` : ''}. Always check the latest official travel advisories.`,
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
        ? `Median fixed broadband download is about ${mbps} Mbps (public statistical estimate)${city.internetMbps == null ? ' at country level' : ''}.`
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
    : `${city.nameEn} for Digital Nomads · Cost, Safety, Climate, Internet & Visa | Habitat Compass`;
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
    ? `${esc(city.countryZh)}：人均 GDP 约 $${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')}（World Bank），人类发展指数 ${co.hdi ?? '—'}${co.gpi ? `，和平指数排名 #${co.gpi.rank}（IEP 2024）` : ''}。`
    : `${cN}: GDP per capita ~$${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')} (World Bank), HDI ${co.hdi ?? '—'}${co.gpi ? `, Global Peace Index rank #${co.gpi.rank} (IEP 2024)` : ''}.`) : ''} <a href="${esc(countryLink)}">${lang === 'zh' ? `查看${esc(city.countryZh)}国家页 →` : `Open ${esc(cN)} country page →`}</a></p>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>
<p class="cta-sub">${lang === 'zh' ? '核心测评免费 · 无需注册 · 测评后按 11 维权重输出 Top 5 城市' : 'Free core quiz · no signup · Top 5 cities scored on 11 dimensions'}</p>`;
  // 城市页 OG 图：优先用该城实景图（city-images 文件名 = 城市 id），否则回落品牌封面（1200×630）。
  const cityImg = IMAGE_IDS.has(id) ? page(`/city-images/${id}.webp`) : undefined;
  const cityImgSize = cityImg ? IMAGE_SIZE.get(id) : undefined;
  return shell({
    lang, title, desc, canonical, hreflang,
    jsonLd: [faqJsonLd(faqs), breadcrumbJsonLd(crumbs)],
    body,
    image: cityImg,
    imageAlt: lang === 'zh' ? `${city.nameZh} · 数字游民定居指南` : `${city.nameEn} for digital nomads`,
    imageW: cityImgSize?.w,
    imageH: cityImgSize?.h,
  });
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
    : `${co.nameEn} for Digital Nomads · Visa, Safety, Internet & Tax | Habitat Compass`;
  const desc = lang === 'zh'
    ? `${co.nameZh}定居要点：${co.visaOverview ?? '签证概览见正文'}；固定宽带中位 ${co.internetMbpsFixed ?? '—'} Mbps，公开统计测算安全参考 ${co.safetyScore ?? '—'}/100，库内 ${co.cityCount} 座城市数据。来源与日期逐项标注。`
    : `${co.nameEn} essentials: ${co.internetMbpsFixed ?? '—'} Mbps median broadband, public-estimate safety ${co.safetyScore ?? '—'}/100, ${co.cityCount} covered cities. Per-item sources & dates.`;
  const cities = CITIES.filter((c) => c.countryCode === co.code);
  const vp = co.visaPassport;
  const ls = co.longStay;
  const faqs = [];
  if (lang === 'zh') {
    faqs.push({ q: `持中国护照进入${co.nameZh}需要签证吗？`, a: vp ? `据 ${co.updatedAt} 快照，中国大陆护照为「${vp.entry}」${vp.entryNote ? `（${vp.entryNote}）` : ''}。` : '暂无结构化快照，请查询官方渠道。' + ' 签证政策多变，务必核实官方移民渠道。' });
    faqs.push({ q: `${co.nameZh}远程办公/数字游民签证情况？`, a: `${co.visaOverview ?? '暂无结构化信息'}${vp ? `；数字游民友好度：${vp.digitalNomad}` : ''}。政策更新频繁，以官方渠道为准。` });
    faqs.push({ q: `${co.nameZh}网速怎么样？`, a: co.internetMbpsFixed != null ? `固定宽带下行中位约 ${co.internetMbpsFixed} Mbps（公开统计测算），${co.internetMbpsFixed >= 100 ? '适合网络密集型远程工作' : '满足日常远程协作，网络密集型任务建议核实当地 ISP'}。` : '暂无数据，请查询当地 ISP。' });
    faqs.push({ q: `${co.nameZh}安全吗？`, a: `${co.safetyScore != null ? `公开统计测算国家安全参考 ${co.safetyScore}/100。` : ''}${co.gpi ? `全球和平指数（IEP 2024）排名 #${co.gpi.rank}（得分 ${co.gpi.score}）。` : ''}出行前请查看最新领事安全通报。` });
    faqs.push({ q: `${co.nameZh}长期居留与税务要注意什么？`, a: ls ? `税居门槛：${ls.taxResidencyDays ?? '—'} 天/年${ls.socialSecurityCn ? `；社保协定：${ls.socialSecurityCn === 'treaty' ? '与中国有社保协定' : ls.socialSecurityCn === 'negotiating' ? '协定协商中' : '暂无协定'}` : ''}${ls.rentalCustom ? `；租房惯例：${ls.rentalCustom}` : ''}。以上为快照参考，请以官方与专业税务意见为准。` : '暂无结构化快照。' });
  } else {
    faqs.push({ q: `Do Chinese passport holders need a visa for ${co.nameEn}?`, a: vp ? `Snapshot as of ${co.updatedAt}: mainland Chinese passport holders are ${VISA_ENTRY_EN[vp.entry] ?? vp.entry}${vp.entryNote ? ` (${ENTRY_NOTE_EN[vp.entryNote] ?? vp.entryNote})` : ''}. Verify with official channels.` : 'No structured snapshot — check official channels.' });
    faqs.push({ q: `Does ${co.nameEn} offer a digital nomad visa?`, a: `${co.visaOverview ? visaOverviewLabel(co.visaOverview, 'en') : 'No structured info'}${vp ? `; digital-nomad friendliness: ${DN_FRIENDLINESS_EN[vp.digitalNomad] ?? vp.digitalNomad}` : ''}.` });
    faqs.push({ q: `How fast is the internet in ${co.nameEn}?`, a: co.internetMbpsFixed != null ? `Median fixed broadband is ~${co.internetMbpsFixed} Mbps (public statistical estimate).` : 'No data yet.' });
    faqs.push({ q: `Is ${co.nameEn} safe?`, a: `${co.safetyScore != null ? `public-estimate safety ${co.safetyScore}/100. ` : ''}${co.gpi ? `Global Peace Index rank #${co.gpi.rank} (IEP 2024).` : ''}` });
  }
  const crumbs = lang === 'zh'
    ? [{ name: '首页', item: page('/') }, { name: '国家索引', item: page('/countries/') }, { name: co.nameZh, item: page(pathZh) }]
    : [{ name: 'Home', item: page('/en/') }, { name: 'Countries', item: page('/en/countries/') }, { name: co.nameEn, item: page(pathEn) }];
  const cityList = cities.map((c) => `<li><a href="${lang === 'zh' ? `/city/${c.id}/` : `/en/city/${c.id}/`}">${esc(lang === 'zh' ? c.nameZh : c.nameEn)}</a><span class="meta">${c.monthlyCostUSD != null ? `$${Math.round(c.monthlyCostUSD)}/mo` : '—'}${c.safety != null ? ` · ${lang === 'zh' ? '安全' : 'safety'} ${c.safety}` : ''}</span></li>`).join('\n');
  const body = `
<p class="crumbs">${crumbs.map((c, i) => i === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.item)}">${esc(c.name)}</a> ›`).join(' ')}</p>
<h1>${esc(n)}<span class="badge">${esc(co.capital ?? '')} · ${esc((co.languages ?? []).map((l) => (lang === 'zh' ? l : languageLabel(l, 'en'))).join(lang === 'zh' ? '、' : ' / '))}</span></h1>
<p class="sub">${lang === 'zh' ? `人口 ${co.population ? co.population.toLocaleString('en-US') : '—'} · 货币 ${esc(co.currency ?? '—')} · 人均 GDP $${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')}` : `Population ${co.population ? co.population.toLocaleString('en-US') : '—'} · Currency ${esc(currencyLabel(co.currency, 'en'))} · GDP/cap $${Math.round(co.gdpPerCapitaUSD ?? 0).toLocaleString('en-US')}`}</p>
<div class="answer"><p>${lang === 'zh'
    ? `${esc(co.nameZh)}是${co.cityCount ?? CITIES.length ? `本站收录 ${co.cityCount ?? cities.length} 座城市的` : ''}定居目的地。${co.internetMbpsFixed != null ? `固定宽带下行中位 ${co.internetMbpsFixed} Mbps，` : ''}${co.safetyScore != null ? `公开统计测算国家安全参考 ${co.safetyScore}/100，` : ''}${co.qolScore != null ? `公开统计测算生活质量指数 ${co.qolScore}。` : ''}${co.visaOverview ? `远程工作签证方面：${esc(co.visaOverview)}。` : ''}国家级数据逐项标注来源（World Bank/UNDP/官方开放数据与公开统计测算），更新于 ${esc(co.updatedAt)}。`
    : `${esc(co.nameEn)} hosts ${co.cityCount ?? cities.length} covered cities. ${co.internetMbpsFixed != null ? `Median broadband ${co.internetMbpsFixed} Mbps; ` : ''}${co.qolScore != null ? `public-estimate QoL ${co.qolScore}; ` : ''}${co.visaOverview ? `remote-work visa: ${esc(visaOverviewLabel(co.visaOverview, 'en'))}.` : ''} Sources per item (World Bank/UNDP/open data & public estimates), updated ${esc(co.updatedAt)}.`}</p></div>
<div class="grid">
  <div class="card"><h3>${lang === 'zh' ? '和平指数' : 'Peace index'}</h3><div class="v">${co.gpi ? `#${co.gpi.rank}<small>IEP 2024 · ${co.gpi.score}</small>` : '—'}</div><div class="src">${lang === 'zh' ? '来源：IEP Global Peace Index（手工快照）' : 'Source: IEP Global Peace Index (hand snapshot)'}</div></div>
  <div class="card"><h3>${lang === 'zh' ? '人类发展指数' : 'HDI'}</h3><div class="v">${co.hdi ?? '—'}</div><div class="src">${lang === 'zh' ? '来源：UNDP HDR（手工快照）' : 'Source: UNDP HDR (hand snapshot)'}</div></div>
  <div class="card"><h3>${lang === 'zh' ? '腐败感知指数' : 'CPI'}</h3><div class="v">${co.cpi ?? '—'}<small>/100</small></div><div class="src">${lang === 'zh' ? '来源：Transparency International（手工快照）' : 'Source: Transparency International (hand snapshot)'}</div></div>
  <div class="card"><h3>${lang === 'zh' ? '生活质量' : 'Quality of life'}</h3><div class="v">${co.qolScore ?? '—'}</div><div class="src">${lang === 'zh' ? '来源：公开统计测算 · 生活质量指数' : 'Source: public statistical estimate · QoL index'}</div></div>
  <div class="card"><h3>${lang === 'zh' ? '税负参考' : 'Top tax rate'}</h3><div class="v">${co.taxTopRatePct != null ? `${co.taxTopRatePct}<small>${lang === 'zh' ? '% 最高档' : '% top rate'}</small>` : '—'}</div><div class="src">${lang === 'zh' ? '来源：手工快照 · 请以专业税务意见为准' : 'Source: hand snapshot · consult a tax professional'}</div></div>
  <div class="card"><h3>${lang === 'zh' ? '税制类型' : 'Tax regime'}</h3><div class="v" style="font-size:16px">${(TAX_RULES[co.code] ? `<span class="tagpill t-${TAX_RULES[co.code].type}">${TAX_REGIME_LABEL[lang][TAX_RULES[co.code].type]}</span>` : '—')}</div><div class="src">${lang === 'zh' ? `详见 <a href="/tax-calculator/" style="color:var(--pine)">税负测算</a> · 方向性分类` : `See <a href="/en/tax-calculator/" style="color:var(--pine)">tax planner</a> · directional classification`}</div></div>
  <div class="card"><h3>${lang === 'zh' ? '数据快照日期' : 'Snapshot date'}</h3><div class="v" style="font-size:16px">${esc(co.updatedAt)}</div><div class="src">${lang === 'zh' ? '逐字段来源标注见方法论页' : 'Per-field sources on the methodology page'}</div></div>
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
  const title = `Habitat Compass — Where should you live next? ${CITIES.length} city guides for remote workers`;
  const desc = `Free personality & lifestyle quiz that scores ${CITIES.length} cities across cost, safety, climate, internet and visa friendliness — with per-item sources and dates.`;
  const body = `
<h1>Habitat Compass</h1>
<p class="sub">A decision-support tool for remote workers, freelancers and digital nomads. Take a free personality &amp; lifestyle quiz, get a weighted score for every city in the library, and compare your shortlist.</p>
<div class="grid">
  <div class="card"><div class="k">City library</div><div class="v">${CITIES.length} cities</div><div class="meta"><a href="/en/cities/">Browse city guides</a> · cost, safety, climate, internet, air quality &amp; visa overview with sources</div></div>
  <div class="card"><div class="k">Country library</div><div class="v">65 countries</div><div class="meta"><a href="/en/countries/">Browse country pages</a> · GPI, HDI, connectivity &amp; long-stay notes</div></div>
  <div class="card"><div class="k">How scoring works</div><div class="v">3 tiers, 11 dimensions</div><div class="meta"><a href="/en/methodology/">Methodology</a> · weights, data licences &amp; update cadence</div></div>
  <div class="card"><div class="k">Tax planner</div><div class="v">65 regimes · 29 brackets</div><div class="meta"><a href="/en/tax-calculator/">Tax calculator</a> · progressive bracket engine for 29 countries, 65-country regime classification, net income vs a high-tax baseline</div></div>
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
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'Organization', '@id': page('/#organization'), name: '栖居罗盘 · Habitat Compass', url: page('/'), logo: page('/og-cover.jpg'), description: 'Decision-support tool for remote workers and digital nomads choosing where to settle abroad.' },
      { '@context': 'https://schema.org', '@type': 'WebSite', '@id': page('/#website'), name: '栖居罗盘 · Habitat Compass', url: page('/'), inLanguage: ['zh-Hans', 'en'], publisher: { '@id': page('/#organization') } },
      breadcrumbJsonLd([{ name: 'Home', item: page('/en/') }]),
    ],
    body,
  });
}

function renderCitiesIndex(lang) {  const pathZh = '/cities/', pathEn = '/en/cities/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const byRegion = CONTINENTS.map((r) => ({ r, cities: CITIES.filter((c) => c.continent === r) }));
  const title = lang === 'zh' ? `${CITIES.length} 座城市定居资料库（六洲覆盖）| 栖居罗盘` : `${CITIES.length} City Guides for Digital Nomads (6 continents) | Habitat Compass`;
  const desc = lang === 'zh' ? `按大洲浏览 ${CITIES.length} 座城市的数字游民定居数据：生活成本、安全、气候、网速、空气质量与签证概览，逐项标注来源。` : `Browse ${CITIES.length} city guides across 6 continents: cost, safety, climate, internet, air quality and visa overview with per-item sources.`;
  const body = `
<h1>${lang === 'zh' ? '城市资料库' : 'City guides'}<span class="badge">${CITIES.length} ${lang === 'zh' ? '座城市' : 'cities'} · 6 ${lang === 'zh' ? '大洲' : 'continents'}</span></h1>
<p class="sub">${lang === 'zh' ? '每城一页：直答摘要 + 成本/安全/气候/网速/空气/签证数据卡（来源与日期逐项标注）+ FAQ。' : 'One page per city: answer-first summary + data cards (sources & dates) + FAQ.'}</p>
${byRegion.map(({ r, cities }) => `<h2>${esc(REGION_LABEL[lang][r] ?? r)}（${cities.length}）</h2><ul class="list">${cities.map((c) => `<li><a href="${lang === 'zh' ? `/city/${c.id}/` : `/en/city/${c.id}/`}">${esc(lang === 'zh' ? c.nameZh : c.nameEn)}</a><span class="meta">${esc(lang === 'zh' ? c.countryZh : (COUNTRY_BY_CODE.get(c.countryCode)?.nameEn ?? c.countryZh))}${c.monthlyCostUSD != null ? ` · $${Math.round(c.monthlyCostUSD)}/mo` : ''}</span></li>`).join('\n')}</ul>`).join('\n')}
<p style="font-size:12.5px;opacity:.72;margin-top:18px">Career interest framework: O*NET Interest Profiler Short Form — <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a>, O*NET OnLine (sponsored by the U.S. Department of Labor).</p>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [breadcrumbJsonLd(lang === 'zh' ? [{ name: '首页', item: page('/') }, { name: '城市索引', item: page(pathZh) }] : [{ name: 'Home', item: page('/en/') }, { name: 'Cities', item: page(pathEn) }])], body });
}

function renderCountriesIndex(lang) {
  const pathZh = '/countries/', pathEn = '/en/countries/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const title = lang === 'zh' ? `65 国定居参考（签证/安全/网速/税负）| 栖居罗盘` : `65 Country Guides: Visa, Safety, Internet & Tax | Habitat Compass`;
  const desc = lang === 'zh' ? '按大洲浏览 65 个国家的定居参考数据：护照入境口径、远程工作签证、和平指数、网速与长期居留注意。' : 'Browse 65 country guides: entry rules for Chinese passports, remote-work visas, peace index, internet and long-stay notes.';
  const body = `
<h1>${lang === 'zh' ? '国家资料库' : 'Country guides'}<span class="badge">${COUNTRIES.length} ${lang === 'zh' ? '国' : 'countries'}</span></h1>
<p class="sub">${lang === 'zh' ? 'World Bank/UNDP 等官方开放数据与公开统计测算快照 + 中国护照入境口径 + 长期居留与税务注意，逐字段来源标注。' : 'World Bank/UNDP open data & public statistical estimate snapshots + CN-passport entry rules + long-stay notes, sources per field.'}</p>
${CONTINENTS.map((r) => { const cs = COUNTRIES.filter((c) => COUNTRY_REGION.get(c.code) === r); if (!cs.length) return ''; return `<h2>${esc(REGION_LABEL[lang][r] ?? r)}（${cs.length}）</h2><ul class="list">${cs.map((c) => `<li><a href="${lang === 'zh' ? `/country/${c.code.toLowerCase()}/` : `/en/country/${c.code.toLowerCase()}/`}">${esc(lang === 'zh' ? c.nameZh : c.nameEn)}</a><span class="meta">${c.internetMbpsFixed != null ? `${c.internetMbpsFixed} Mbps` : ''}${c.gpi ? ` · ${lang === 'zh' ? '和平' : 'peace'} #${c.gpi.rank}` : ''} · ${c.cityCount ?? 0} ${lang === 'zh' ? '城' : 'cities'}</span></li>`).join('\n')}</ul>`; }).join('\n')}
<p style="font-size:12.5px;opacity:.72;margin-top:18px">Career interest framework: O*NET Interest Profiler Short Form — <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a>, O*NET OnLine (sponsored by the U.S. Department of Labor).</p>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [breadcrumbJsonLd(lang === 'zh' ? [{ name: '首页', item: page('/') }, { name: '国家索引', item: page(pathZh) }] : [{ name: 'Home', item: page('/en/') }, { name: 'Countries', item: page(pathEn) }])], body });
}

// ---------- 方法论页 ----------
function renderMethodology(lang) {
  const pathZh = '/methodology/', pathEn = '/en/methodology/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const title = lang === 'zh' ? '匹配方法论：三层权重、数据来源与许可 | 栖居罗盘' : 'Methodology: Tiered weights, data sources & licences | Habitat Compass';
  const desc = lang === 'zh' ? '完整公开匹配引擎的三层权重结构（硬约束过滤 → 核心匹配 → 加分项）、11 维偏好权重、数据来源与许可署名、更新频率与免责声明。' : 'Fully public scoring: tiered weights (hard constraints → core matching → boosters), 11 preference dimensions, data sources & licences, update cadence.';
  const body = `
<h1>${lang === 'zh' ? '匹配方法论与数据口径' : 'Scoring methodology & data'}</h1>
<p class="sub">${lang === 'zh' ? '公开透明，便于核对与引用。更新于 ' + BUILD_DATE : 'Public by design. Updated ' + BUILD_DATE}</p>
<div class="answer"><p>${lang === 'zh'
    ? '栖居罗盘的匹配分（0–99）由三层结构计算：第 1 层硬性条件过滤（预算/签证/安全，一票否决，不参与加权）；第 2 层核心匹配（生活偏好 42% + 人格 30% + 兴趣 18%，缺失维度降权不惩罚）；第 3 层加分项（RIASEC 兴趣强化 5% + 风险联动 3% + 空气质量 2%，合计 ≤10%）。原始分校准为 52 + raw × 0.46 后取整。'
    : 'The matching score (0–99) is computed in three tiers: T1 hard constraints (budget/visa/safety, veto-only, never weighted); T2 core matching (preferences 42% + personality 30% + interests 18%, missing dimensions dropped without penalty); T3 boosters (RIASEC 5% + risk-link 3% + air quality 2%, ≤10% total). Raw score calibrated as 52 + raw × 0.46.'}</p></div>
<h2>${lang === 'zh' ? '第 2 层：11 维偏好权重' : 'Tier 2: 11 preference dimensions'}</h2>
<ul class="list">
<li>${lang === 'zh' ? '预算 budget' : 'Budget'}<span class="meta">0.18${lang === 'zh' ? '（占偏好 0.42 内）' : ' (within 0.42 preferences)'}</span></li>
<li>${lang === 'zh' ? '气候 climate' : 'Climate'}<span class="meta">0.12</span></li>
<li>${lang === 'zh' ? '节奏 pace / 社交 social' : 'Pace / Social'}<span class="meta">0.10 / 0.10</span></li>
<li>${lang === 'zh' ? '规模 size / 语言 language / 签证 visa / 远程 remote' : 'Size / Language / Visa / Remote'}<span class="meta">0.09 × 4</span></li>
<li>${lang === 'zh' ? '气候舒适度 climateComfort' : 'Climate comfort'}<span class="meta">${lang === 'zh' ? '客观 0.05 · Open-Meteo 派生' : 'objective 0.05 · derived from Open-Meteo'}</span></li>
<li>${lang === 'zh' ? '安全 safety' : 'Safety'}<span class="meta">${lang === 'zh' ? '客观 0.05 · 公开统计测算' : 'objective 0.05 · public statistical estimate'}</span></li>
<li>${lang === 'zh' ? '英语深度 englishDepth' : 'English depth'}<span class="meta">${lang === 'zh' ? '客观 0.04 · 公开英语排名分档' : 'objective 0.04 · public English-proficiency band'}</span></li>
</ul>
<p class="note">${lang === 'zh' ? '偏好类内部：用户主观 8 维合计 0.86，客观数据 3 维合计 0.14。任何维度缺失时从分子与分母同时剔除（降权不惩罚）。' : 'Within preferences: user-reported 8 dims sum to 0.86, objective 3 dims sum to 0.14. Missing dims are dropped from numerator and denominator (down-weight, never penalised).'}</p>
<h2>${lang === 'zh' ? '第 3 层：加分项（≤10%）' : 'Tier 3: boosters (≤10%)'}</h2>
<ul class="list">
<li>${lang === 'zh' ? 'RIASEC 兴趣强化' : 'RIASEC interest boost'}<span class="meta">0.05 · ${lang === 'zh' ? '公开职业兴趣框架' : 'public career-interest framework'}</span></li>
<li>${lang === 'zh' ? '风险画像联动' : 'Risk-profile link'}<span class="meta">0.03 · ${lang === 'zh' ? '风险偏好画像 × 城市冒险友好度' : 'risk-tolerance profile × city adventure-friendliness'}</span></li>
<li>${lang === 'zh' ? '空气质量 airFit' : 'Air quality'}<span class="meta">0.02 · WHO 2021 ${lang === 'zh' ? '分档（优 90/良 72/一般 48/差 25）' : 'bands (good 90 / fair 72 / moderate 48 / poor 25)'}</span></li>
</ul>
<h2>${lang === 'zh' ? '数据来源与许可' : 'Data sources & licences'}</h2>
<ul class="list">
<li>GeoNames cities15000<span class="meta">${lang === 'zh' ? '城市底座' : 'city base'} · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> · <a href="https://www.geonames.org/" target="_blank" rel="noopener">geonames.org</a></span></li>
<li>Open-Meteo Historical / Air Quality<span class="meta">${lang === 'zh' ? '气候十年均值 + PM2.5' : '10-yr climate means + PM2.5'} · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> · <a href="https://open-meteo.com/" target="_blank" rel="noopener">open-meteo.com</a> · CAMS ${lang === 'zh' ? '再分析' : 'reanalysis'}</span></li>
<li>${lang === 'zh' ? '公开英语熟练度排名 / World Bank / UNDP / Transparency International / IEP' : 'Public English-proficiency ranking / World Bank / UNDP / Transparency International / IEP'}<span class="meta">${lang === 'zh' ? '国家级参考 · 官方开放数据与公开统计' : 'country-level reference · official open data & public statistics'} · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a> / ${lang === 'zh' ? '手工快照' : 'hand snapshot'}</span></li>
<li>OEJTS 1.2<span class="meta">${lang === 'zh' ? '核心测评 16 型人格题库（Jungian 双极结构）' : 'core 16-type personality test (Jungian bipolar structure)'} · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="license noopener">CC BY-NC-SA 4.0</a> · Open Psychometrics</span></li>
<li>WHO Global Air Quality Guidelines 2021<span class="meta">${lang === 'zh' ? 'PM2.5 年均分档口径（优 ≤10 / 良 ≤15 / 一般 ≤25 / 差 >25）' : 'annual PM2.5 bands (good ≤10 / fair ≤15 / moderate ≤25 / poor >25)'}</span></li>
<li>${lang === 'zh' ? '字体 Fraunces / Newsreader / Manrope / 系统中文黑体' : 'Typefaces Fraunces / Newsreader / Manrope / system CJK'}<span class="meta">SIL Open Font License 1.1 · ${lang === 'zh' ? '经 @fontsource 自托管打包，无外部 CDN' : 'self-hosted via @fontsource, no external CDN'}</span></li>
</ul>
<h2>${lang === 'zh' ? '更新频率与免责声明' : 'Update cadence & disclaimer'}</h2>
<p class="note">${lang === 'zh'
    ? '城市/国家页由构建管道从快照数据生成（本页构建于 ' + BUILD_DATE + '）；公开统计测算按季度复核，气候与空气为 2022–2024 多年均值；签证与税务快照日期逐页标注，政策多变请以官方渠道为准。本站为决策辅助工具，不构成投资、法律或移民建议；测评结果为算法输出，不构成专业心理评估。'
    : 'City/country pages are generated from snapshot data at build time (built ' + BUILD_DATE + '); public statistical estimates are reviewed quarterly; climate & air are 2022–2024 multi-year means; visa/tax snapshots carry per-page dates. This site is decision support and is not immigration, visa, legal, tax, medical, or financial advice; quiz results are algorithmic outputs, not clinical assessments.'}</p>
<p style="font-size:12.5px;opacity:.72;margin-top:18px">Career interest framework: O*NET Interest Profiler Short Form — <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener">CC BY 4.0</a>, O*NET OnLine (sponsored by the U.S. Department of Labor).</p>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>`;
  return shell({ lang, title, desc, canonical, hreflang, jsonLd: [breadcrumbJsonLd(lang === 'zh' ? [{ name: '首页', item: page('/') }, { name: '方法论', item: page(pathZh) }] : [{ name: 'Home', item: page('/en/') }, { name: 'Methodology', item: page(pathEn) }])], body });
}

// ---------- 税负测算子页面（静态 SEO/AEO 入口，与运行时 /?city= 打通） ----------
// 唯一事实源：src/data/taxRules.ts（import 得到，口径与前端一致）。
const TAX_REGIME_LABEL = {
  zh: { exempt: '免税型', territorial: '属地征税型', concession: '专项优惠型', standard: '常规税制型' },
  en: { exempt: 'Tax-free', territorial: 'Territorial', concession: 'Special concession', standard: 'Progressive standard' },
};
const TAX_REGIME_NOTE = {
  zh: {
    exempt: '对个人所得基本不征个税，境内外收入通常均免税。',
    territorial: '只对本地来源所得征税，境外来源收入通常不课税。',
    concession: '有面向新居民与数字游民的专项优惠，实际税率低于名义累进税率。',
    standard: '按全球所得累进征税，税负取决于居住身份与抵扣。',
  },
  en: {
    exempt: 'Personal income is essentially untaxed — domestic and foreign alike.',
    territorial: 'Only locally sourced income is taxed; foreign-source income is generally exempt.',
    concession: 'A dedicated concession for new residents and nomads yields a rate below the nominal scale.',
    standard: 'Worldwide income is taxed progressively; liability depends on residency and deductions.',
  },
};
/** V1 粗颗粒有效税率（与 src/data/taxRules.ts 的 effectiveRatePct 同口径，示例收入口径） */
function taxEffRateFor(rule, topRatePct) {
  if (rule.type === 'exempt' || rule.type === 'territorial') return 0;
  if (rule.type === 'concession') return rule.effRatePct ?? 15;
  const base = topRatePct != null ? topRatePct * 0.5 : 22;
  return Math.max(5, Math.min(38, Math.round(base)));
}
const TAX_EXAMPLE_INCOME = 50000;

// ---------- 分级税率引擎（V2）静态镜像：与 src/lib/tax.ts 纯函数同口径 ----------
function bracketProgressiveTax(taxable, brackets) {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (taxable <= lower) break;
    const upper = b.upTo ?? Infinity;
    const slice = Math.min(taxable, upper) - lower;
    if (slice > 0) tax += (slice * b.ratePct) / 100;
    lower = upper;
  }
  return tax;
}
function applicableRegimeOf(profile, nature) {
  return profile.regimes.find((r) => !r.natures || r.natures.includes(nature)) ?? null;
}
function bracketSpecialTax(special, taxable, brackets) {
  if (special.kind === 'exempt' || taxable <= 0) return 0;
  if (special.kind === 'relief') return bracketProgressiveTax(taxable, brackets) * (1 - (special.ratePct ?? 0) / 100);
  const flat = (special.ratePct ?? 0) / 100;
  const cap = special.capLocal ?? taxable;
  const within = Math.min(taxable, cap);
  const excess = Math.max(0, taxable - cap);
  const top = (brackets[brackets.length - 1]?.ratePct ?? 0) / 100;
  return within * flat + excess * top;
}
/** 给定年收入（USD）在该国分级引擎下的有效税率（%，含特惠税制） */
function bracketEffRateFor(profile, grossUSD) {
  const rate = profile.usdRate || 1;
  const taxable = Math.max(0, grossUSD / rate - thresholdLocal(profile));
  const special = applicableRegimeOf(profile, 'employee');
  const tax = special ? bracketSpecialTax(special, taxable, profile.brackets) : bracketProgressiveTax(taxable, profile.brackets);
  return grossUSD > 0 ? Math.round((tax * rate * 1000) / grossUSD) / 10 : 0;
}
function bracketRows() {
  const rows = [];
  for (const [code, profile] of Object.entries(TAX_BRACKETS)) {
    const co = COUNTRIES.find((c) => c.code === code);
    if (!co) continue;
    const cityCount = CITIES.filter((x) => x.countryCode === code).length;
    if (!cityCount) continue;
    const special = applicableRegimeOf(profile, 'employee');
    const eff = bracketEffRateFor(profile, TAX_EXAMPLE_INCOME);
    const net = Math.round(TAX_EXAMPLE_INCOME * (1 - eff / 100));
    const baselineNet = Math.round(TAX_EXAMPLE_INCOME * (1 - TAX_BASELINE_EFF_RATE / 100));
    rows.push({ co, profile, special, eff, net, saved: net - baselineNet, cityCount });
  }
  return rows.sort((a, b) => a.eff - b.eff || (a.co.nameZh || '').localeCompare(b.co.nameZh || '', 'zh'));
}

function taxRows(lang) {
  // 按国家聚合：每国一行（税制是国家层级），附库内城市数与排名。
  const byCountry = new Map();
  for (const c of COUNTRIES) {
    const rule = TAX_RULES[c.code];
    if (!rule) continue;
    const cities = CITIES.filter((x) => x.countryCode === c.code);
    if (!cities.length) continue;
    byCountry.set(c.code, { co: c, rule, cityCount: cities.length });
  }
  return [...byCountry.values()]
    .map(({ co, rule, cityCount }) => {
      const eff = taxEffRateFor(rule, co.taxTopRatePct);
      const net = Math.round(TAX_EXAMPLE_INCOME * (1 - eff / 100));
      const baselineNet = Math.round(TAX_EXAMPLE_INCOME * (1 - TAX_BASELINE_EFF_RATE / 100));
      return { co, rule, cityCount, eff, net, saved: net - baselineNet };
    })
    .sort((a, b) => b.rule.score - a.rule.score || a.co.nameZh.localeCompare(b.co.nameZh, 'zh'));
}

function renderTaxPage(lang) {
  const pathZh = '/tax-calculator/';
  const pathEn = '/en/tax-calculator/';
  const hreflang = { zh: page(pathZh), en: page(pathEn) };
  const canonical = lang === 'zh' ? hreflang.zh : hreflang.en;
  const rows = taxRows(lang);
  const bRows = bracketRows();
  const money = (v) => `$${Math.round(v).toLocaleString('en-US')}`;
  const specialCell = (r) => {
    if (!r.special) return lang === 'zh' ? '—' : '—';
    const label = lang === 'zh' ? r.special.label : r.special.labelEn;
    const val = r.special.kind === 'exempt' ? (lang === 'zh' ? '免税' : 'exempt') : `${r.special.ratePct}%`;
    return `<span class="tagpill t-concession">${esc(label)} · ${val}</span>`;
  };
  const bracketRowHtml = bRows
    .map((r) => {
      const n = lang === 'zh' ? r.co.nameZh : r.co.nameEn;
      const countryLink = lang === 'zh' ? `/country/${r.co.code.toLowerCase()}/` : `/en/country/${r.co.code.toLowerCase()}/`;
      const th = Math.round(thresholdLocal(r.profile)).toLocaleString('en-US');
      const effTxt = `${r.eff}%`;
      const savedTxt = `${r.saved >= 0 ? '+' : '−'}${money(Math.abs(r.saved))}`;
      const bands = r.profile.brackets
        .map((b) => (b.upTo == null ? `${b.ratePct}%${lang === 'zh' ? '以上' : '+'}` : `${b.ratePct}%`))
        .join(' / ');
      return `<tr><td><a href="${esc(countryLink)}">${esc(n)}</a></td><td>${esc(r.profile.currency)}</td><td>${esc(bands)}</td><td>${th}</td><td>${specialCell(r)}</td><td>${effTxt}</td><td>${money(r.net)}</td><td>${esc(savedTxt)}</td></tr>`;
    })
    .join('\n');
  const title = lang === 'zh'
    ? `数字游民税负测算 · 免签地/属地征税/专项优惠城市对比 | 栖居罗盘`
    : `Digital Nomad Tax Calculator · Tax-free, territorial & concession cities | Habitat Compass`;
  const desc = lang === 'zh'
    ? `按累进税率引擎测算：给定年收入在迪拜、清迈、第比利斯、里斯本等城市的税后净收入、累进级距明细、税制类型与相较欧美高税区多留存的金额。已录入 ${bRows.length} 国分级税率与特惠税制，含 65 国税制分类与免责声明。`
    : `A progressive-bracket estimate of after-tax income, band-by-band breakdown, tax regime and savings vs a high-tax EU/US region for Dubai, Chiang Mai, Tbilisi, Lisbon and more. Bracket data for ${bRows.length} countries with nomad concessions, plus 65-country classification and disclaimers.`;
  const rowHtml = rows.map((r) => {    const n = lang === 'zh' ? r.co.nameZh : r.co.nameEn;
    const countryLink = lang === 'zh' ? `/country/${r.co.code.toLowerCase()}/` : `/en/country/${r.co.code.toLowerCase()}/`;
    const effTxt = r.eff === 0 ? (lang === 'zh' ? '0%（境外来源）' : '0% (foreign-source)') : `${r.eff}%`;
    const savedTxt = `${r.saved >= 0 ? '+' : '−'}${money(Math.abs(r.saved))}`;
    return `<tr><td><a href="${esc(countryLink)}">${esc(n)}</a></td><td><span class="tagpill t-${esc(r.rule.type)}">${esc(TAX_REGIME_LABEL[lang][r.rule.type])}</span></td><td>${r.co.taxTopRatePct != null ? `${r.co.taxTopRatePct}%` : '—'}</td><td>${esc(effTxt)}</td><td>${money(r.net)}</td><td>${esc(savedTxt)}</td><td>${r.cityCount}</td></tr>`;
  }).join('\n');

  const topRows = rows.slice(0, 6).map((r) => {
    const n = lang === 'zh' ? r.co.nameZh : r.co.nameEn;
    return `${esc(n)}（${esc(TAX_REGIME_LABEL[lang][r.rule.type])}${r.eff === 0 ? (lang === 'zh' ? '、境外收入暂免' : ', foreign income exempt') : `、${r.eff}%`}）`;
  }).join(lang === 'zh' ? '、' : ', ');

  const faqs = lang === 'zh'
    ? [
        { q: '数字游民最省钱（税负最低）的国家和城市有哪些？', a: `按本站税负规则字典测算，税负最友好的目的地包括：${topRows}。其中「免税型」对个人所得基本不征税，「属地征税型」只对本地来源所得课税、境外来源收入通常免税。实际税负仍取决于你的居留身份与收入来源地。` },
        { q: '这个税负测算是怎么算的？准确吗？', a: `采用「分级税率引擎」：对已录入数据的 ${bRows.length} 国，按其本币年应纳税所得额逐档累加（含起征点/标准扣除与特惠税制），本地税额按快照汇率 ${TAX_FX_ASOF} 折美元后得有效税率；其余国家回落「规则字典查表法」的粗颗粒近似。它不建模专项抵扣、税收协定与汇入规则，仅用于方向性对比，不构成税务建议。` },
        { q: '什么是「属地征税型」税制？', a: '属地征税（territorial）指只对来源于本地的收入课税，境外来源收入通常不征税或可豁免，例如香港、新加坡、马来西亚、泰国（汇入制）、格鲁吉亚等。对以境外客户收入为主的远程工作者与自由职业者尤其友好。' },
        { q: '葡萄牙、西班牙、希腊这些欧洲国家的优惠税率是怎么回事？', a: '这些国家属于「专项优惠型」：为符合条件的新税务居民、数字游民或科技人才提供统一低税率或减免，例如西班牙「贝克汉姆法案」24%、葡萄牙 IFICI 20%、希腊新居民 50% 减免。能否适用取决于签证类型、居留时长与收入来源，需逐一核实官方条件。' },
        { q: '换城市能比在欧美高税区多留存多少钱？', a: `本页以参考有效税率 ${TAX_BASELINE_EFF_RATE}%（欧美高税区方向性口径）为基线对比。以年收入 ${money(TAX_EXAMPLE_INCOME)} 为例，免税型目的地每年可比该基线多留存约 ${money(Math.round(TAX_EXAMPLE_INCOME * TAX_BASELINE_EFF_RATE / 100))}。这是粗颗粒上限参考，非承诺。` },
        { q: '税负测算结果可以直接用来做决策吗？', a: '不可以作为唯一依据。本工具是方向性估算，不构成税务建议；实际税负受居留身份、税收协定、社保与申报义务影响。重大决策前请咨询专业税务顾问并核实目标国官方口径。' },
      ]
    : [
        { q: 'Which countries and cities are cheapest tax-wise for digital nomads?', a: `By our rule-dictionary estimate, the friendliest destinations include: ${topRows}. "Tax-free" regimes levy essentially no personal income tax; "territorial" regimes tax only locally sourced income while foreign-source income is generally exempt. Your actual liability still depends on residency status and source of income.` },
        { q: 'How is this tax estimate calculated — is it accurate?', a: `It uses a progressive bracket engine: for ${bRows.length} countries with structured data, tax is accumulated band by band on annual taxable income in local currency (including thresholds/standard deductions and any concession), converted to USD at a snapshot FX rate (${TAX_FX_ASOF}) to derive an effective rate; other countries fall back to a coarse rule-dictionary approximation. It models no deductions, tax treaties or remittance rules. It is for directional comparison only, not tax advice.` },
        { q: 'What is a “territorial” tax regime?', a: 'A territorial regime taxes only locally sourced income; foreign-source income is usually untaxed or exempt — as in Hong Kong, Singapore, Malaysia, Thailand (remittance basis) and Georgia. It suits remote workers and freelancers earning from overseas clients.' },
        { q: 'What are the special concession rates in Portugal, Spain and Greece?', a: 'These are “concession” regimes: flat or reduced rates for qualifying new tax residents, nomads or tech talent — e.g. Spain’s “Beckham law” 24%, Portugal’s IFICI 20%, Greece’s 50% relief for new residents. Eligibility depends on visa type, length of stay and income source; always verify the official conditions.' },
        { q: 'How much more can I keep by moving from a high-tax EU/US region?', a: `This page uses a reference effective rate of ${TAX_BASELINE_EFF_RATE}% (a directional high-tax EU/US figure) as the baseline. At ${money(TAX_EXAMPLE_INCOME)} gross income, a tax-free destination would keep roughly ${money(Math.round(TAX_EXAMPLE_INCOME * TAX_BASELINE_EFF_RATE / 100))} more per year. This is a coarse upper-bound reference, not a promise.` },
        { q: 'Can I use this result directly for decisions?', a: 'No — do not rely on it alone. This tool is a directional estimate and not tax advice; actual liability depends on residency, tax treaties, social security and filing duties. Consult a tax professional and verify official rules before major decisions.' },
      ];

  const crumbs = lang === 'zh'
    ? [{ name: '首页', item: page('/') }, { name: '税负测算', item: page(pathZh) }]
    : [{ name: 'Home', item: page('/en/') }, { name: 'Tax planner', item: page(pathEn) }];

  const body = `
<p class="crumbs">${crumbs.map((c, i) => i === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.item)}">${esc(c.name)}</a> ›`).join(' ')}</p>
<h1>${lang === 'zh' ? '数字游民税负测算' : 'Digital nomad tax calculator'}<span class="badge">${rows.length} ${lang === 'zh' ? '国税制' : 'countries'} · ${CITIES.length} ${lang === 'zh' ? '城' : 'cities'}</span></h1>
<p class="sub">${lang === 'zh' ? `分级税率引擎（V2）：${bRows.length} 国按本币累进级距逐档计算，其余国家按规则字典粗颗粒估算，仅作方向性对比，不构成税务建议。` : `Progressive bracket engine (V2): ${bRows.length} countries computed band by band in local currency, others via a coarse rule-dictionary approximation — directional comparison only, not tax advice.`}</p>
<div class="answer"><p>${lang === 'zh'
    ? `税负是数字游民、远程工作者与跨境定居者的核心成本之一，但不同场景差异巨大：同样的年收入，在免税型目的地与高税负辖区之间的税后净收入可能相差数万美元。本页用「分级税率引擎」处理已录入数据的 ${bRows.length} 国：按其本币年应纳税所得额逐档累加，叠加面向数字游民/新居民的特惠税制（如泰国 LTR 17%、西班牙贝克汉姆法案 24%、格鲁吉亚小企业 1%、葡萄牙 IFICI 20%、克罗地亚游民免税等），其余 65 国中的其他国家按四类税制（免税型 / 属地征税型 / 专项优惠型 / 常规税制型）粗颗粒近似。所有税率数字均为公开事实，不依赖任何第三方付费聚合 API。`
    : `Tax is a core cost for nomads, remote workers and cross-border settlers, yet it varies enormously: the same gross income can mean tens of thousands of dollars difference in net income between a tax-free destination and a high-tax jurisdiction. This page runs a progressive bracket engine for ${bRows.length} countries with structured data — accumulating tax band by band on annual taxable income in local currency and layering nomad/new-resident concessions (Thailand LTR 17%, Spain's Beckham law 24%, Georgia's 1% small-business status, Portugal IFICI 20%, Croatia's nomad exemption and more) — while the remaining of the 65 countries are approximated via four regime types (tax-free / territorial / concession / standard). All rate figures are public facts, with no reliance on any paid aggregation API.`}</p></div>

<h2>${lang === 'zh' ? '交互式税负测算' : 'Interactive tax planner'}</h2>
<a class="cta" href="${esc(page('/?city=chiang-mai'))}">${lang === 'zh' ? '打开交互式税负测算工具 →' : 'Open the interactive tax planner →'}</a>
<p class="cta-sub">${lang === 'zh' ? '填年收入、选收入性质与目标城市，实时看净收入与多留存对比（可直达任意城市：在链接后加 ?city=城市id）' : 'Enter income, pick income type and target city, and see net income and savings live (jump to any city by appending ?city=<id>)'}</p>

<h2>${lang === 'zh' ? `65 国税制分类与税负对比（示例年收入 ${money(TAX_EXAMPLE_INCOME)}）` : `65-country tax regimes & comparison (example income ${money(TAX_EXAMPLE_INCOME)})`}</h2>
<p class="note">${lang === 'zh' ? `「参考有效税率」为规则字典推导的近似综合值；「净收入」= 年收入 ×（1 − 参考有效税率）；「较基线」为相较欧美高税区参考有效税率 ${TAX_BASELINE_EFF_RATE}% 的差额。均为方向性口径。` : `“Reference effective rate” is the rule-dictionary approximation; “net income” = gross × (1 − rate); “vs baseline” compares against the high-tax EU/US reference rate of ${TAX_BASELINE_EFF_RATE}%. All directional.`}</p>
<div class="tblwrap">
<table class="tbl">
<thead><tr>
<th>${lang === 'zh' ? '国家' : 'Country'}</th>
<th>${lang === 'zh' ? '税制类型' : 'Regime'}</th>
<th>${lang === 'zh' ? '最高边际税率' : 'Top marginal'}</th>
<th>${lang === 'zh' ? '参考有效税率' : 'Ref. effective'}</th>
<th>${lang === 'zh' ? `净收入（${money(TAX_EXAMPLE_INCOME)}）` : `Net (${money(TAX_EXAMPLE_INCOME)})`}</th>
<th>${lang === 'zh' ? '较基线' : 'vs baseline'}</th>
<th>${lang === 'zh' ? '库内城市' : 'Cities'}</th>
</tr></thead>
<tbody>
${rowHtml}
</tbody>
</table>
</div>

<h2>${lang === 'zh' ? `分级税率引擎：${bRows.length} 国累进/统一税率明细（示例年收入 ${money(TAX_EXAMPLE_INCOME)}）` : `Progressive bracket engine: ${bRows.length} countries (example income ${money(TAX_EXAMPLE_INCOME)})`}</h2>
<p class="note">${lang === 'zh' ? `以下国家已录入「分级税率」数据：按本币（币种列）年应纳税所得额逐档累加，含起征点/标准扣除（本币列）与该国面向数字游民/新居民的特惠税制。有效税率 = 本地税额按快照汇率（${TAX_FX_ASOF}）折美元 ÷ 年收入。数据提炼自各国税务机关与 PwC Worldwide Tax Summaries 等公开来源——税率为公开事实，非付费聚合数据。` : `These countries have structured bracket data: tax is accumulated band by band on the annual taxable income in local currency (Currency column), including the threshold/standard deduction (local column) and any nomad/new-resident concession. The effective rate = local tax converted at a snapshot FX rate (${TAX_FX_ASOF}) ÷ gross income. Data is distilled from national tax authorities and PwC Worldwide Tax Summaries — rates are public facts, not paid aggregation data.`}</p>
<div class="tblwrap">
<table class="tbl">
<thead><tr>
<th>${lang === 'zh' ? '国家' : 'Country'}</th>
<th>${lang === 'zh' ? '币种' : 'Currency'}</th>
<th>${lang === 'zh' ? '累进税率阶梯（%）' : 'Bracket ladder (%)'}</th>
<th>${lang === 'zh' ? '起征点（本币）' : 'Threshold (local)'}</th>
<th>${lang === 'zh' ? '特惠税制' : 'Special regime'}</th>
<th>${lang === 'zh' ? '有效税率' : 'Effective'}</th>
<th>${lang === 'zh' ? `净收入（${money(TAX_EXAMPLE_INCOME)}）` : `Net (${money(TAX_EXAMPLE_INCOME)})`}</th>
<th>${lang === 'zh' ? '较基线' : 'vs baseline'}</th>
</tr></thead>
<tbody>
${bracketRowHtml}
</tbody>
</table>
</div>

<h2>${lang === 'zh' ? '四类税制说明' : 'The four regime types'}</h2><ul class="list">
<li><span class="tagpill t-exempt">${esc(TAX_REGIME_LABEL[lang].exempt)}</span><span class="meta">${esc(TAX_REGIME_NOTE[lang].exempt)}</span></li>
<li><span class="tagpill t-territorial">${esc(TAX_REGIME_LABEL[lang].territorial)}</span><span class="meta">${esc(TAX_REGIME_NOTE[lang].territorial)}</span></li>
<li><span class="tagpill t-concession">${esc(TAX_REGIME_LABEL[lang].concession)}</span><span class="meta">${esc(TAX_REGIME_NOTE[lang].concession)}</span></li>
<li><span class="tagpill t-standard">${esc(TAX_REGIME_LABEL[lang].standard)}</span><span class="meta">${esc(TAX_REGIME_NOTE[lang].standard)}</span></li>
</ul>

<h2>${lang === 'zh' ? '常见问答' : 'FAQ'}</h2>
${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n')}

<h2>${lang === 'zh' ? '免责声明' : 'Disclaimer'}</h2>
<div class="notice">${lang === 'zh'
    ? '本页为规则字典粗颗粒估算，不建模累进级距、专项抵扣、税收协定与汇入规则，不构成税务建议。实际税负取决于你的居留身份、收入来源地与双边协定，重大决策前请咨询专业税务顾问并核实官方口径。'
    : 'This page is a coarse rule-dictionary estimate. It models no progressive brackets, deductions, tax treaties or remittance rules, and is not tax advice. Your actual liability depends on residency status, income source and bilateral treaties — consult a tax professional and verify official sources before major decisions.'}</div>
<a class="cta" href="${lang === 'zh' ? '/' : '/en/'}">${lang === 'zh' ? '免费开始我的定居匹配测评 →' : 'Start my free matching quiz →'}</a>
<p class="cta-sub">${lang === 'zh' ? '测评后按 11 维权重输出 Top 5 城市，并可逐城推演税负' : 'Top 5 cities scored on 11 dimensions, then a per-city tax estimate'}</p>`;

  const organization = { '@context': 'https://schema.org', '@type': 'Organization', '@id': page('/#organization'), name: '栖居罗盘 · Habitat Compass', url: page('/'), logo: page('/og-cover.jpg') };
  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: lang === 'zh' ? '栖居罗盘税负测算' : 'Habitat Compass Tax Planner',
    url: canonical,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: lang === 'zh' ? 'zh-Hans' : 'en',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: desc,
  };
  return shell({
    lang, title, desc, canonical, hreflang,
    jsonLd: [webApp, faqJsonLd(faqs), breadcrumbJsonLd(crumbs), organization],
    body,
  });
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

/**
 * XML 文本转义：sitemap 只允许 <loc>/<lastmod> 等节点承载纯文本。
 * 转义五个预定义实体，杜绝 & / < / > / " / ' 造成的非法节点或“标签外纯文本”。
 */
function xmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 自校验：确认生成的 sitemap 结构严格符合 sitemaps.org 0.9 规范。
 * 任一断言失败即抛错终止构建，避免把非法 XML 部署上线。
 */
function assertSitemapWellFormed(xml) {
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')) {
    throw new Error('sitemap 缺少标准 XML 文件头');
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error('sitemap 缺少带命名空间的 <urlset> 根节点');
  }
  if (!xml.endsWith('</urlset>\n')) {
    throw new Error('sitemap 根节点未正确闭合');
  }
  // 标签外不得残留任何纯文本：遍历 token 跟踪嵌套深度，
  // 深度为 0 处出现的非空白文本即为“标签外纯文本”（数组调试字符、拼接残留等）。
  let depth = 0;
  for (const tok of xml.match(/<[^>]*>|[^<]+/g) || []) {
    if (tok[0] === '<') {
      if (/^<\?/.test(tok) || /^<!/.test(tok)) continue; // 声明 / 注释
      if (/^<\//.test(tok)) depth = Math.max(0, depth - 1);
      else if (!/\/>$/.test(tok)) depth++;
      continue;
    }
    if (depth === 0 && tok.trim()) {
      throw new Error(`sitemap 标签外残留纯文本：${tok.trim().slice(0, 60)}`);
    }
  }
  if (depth !== 0) throw new Error(`sitemap 标签未闭合（深度 ${depth}）`);
  // 尖括号数量配平
  const open = (xml.match(/</g) || []).length;
  const close = (xml.match(/>/g) || []).length;
  if (open !== close) throw new Error(`sitemap 尖括号不配平：< ${open} 个，> ${close} 个`);
  // 每个 <url> 必须且只含 loc/lastmod/changefreq/priority
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  if (!blocks.length) throw new Error('sitemap 未输出任何 <url> 节点');
  for (const b of blocks) {
    for (const tag of ['loc', 'lastmod', 'changefreq', 'priority']) {
      if (!b.includes(`<${tag}>`)) throw new Error(`<url> 缺少 <${tag}>：${b.slice(0, 80)}`);
    }
    const extra = (b.match(/<([a-zA-Z:]+)[\s>]/g) || [])
      .map((m) => m.replace(/[<\s>]/g, ''))
      .filter((t) => !['url', 'loc', 'lastmod', 'changefreq', 'priority'].includes(t));
    if (extra.length) throw new Error(`<url> 含非标准节点：${[...new Set(extra)].join(', ')}`);
  }
}

// ---------- 第十三轮：法律页（隐私政策 / 用户协议，zh/en） ----------
// ABOUTME: 内容如实披露 storage.ts 实际键清单（nomadmatch.v1 前缀）；联系邮箱 hi@habitatcompass.com；适用法域=运营者主要经营地
const LEGAL_PRIVACY = {
  zh: {
    title: '隐私政策 | 栖居罗盘',
    desc: '本站不使用追踪 Cookie、无第三方分析、无广告、无账号体系；你的全部数据仅存于浏览器本地存储（nomadmatch.v1），可随时一键清除。隐私政策全文。',
    updated: `最后更新：${BUILD_DATE}`,
    notice: '一句话概括：<strong>你在本站的一切数据都只留在你自己的浏览器里。</strong>我们没有账号体系、没有服务器端数据库，也读不到你的任何信息。',
    attribution: '本政策的结构与措辞参考了 Automattic 以 <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="license noopener">CC BY-SA 4.0</a> 开放的法律文本（Legalmattic），并已按本站「无账号、无服务器、纯本地」的实际做法全面改写。',
    sections: [
      { h: '一、我们是谁，本政策覆盖什么', ps: [
        '栖居罗盘（Habitat Compass，下称"本站"）是一个<strong>完全运行于浏览器</strong>的海外城市定居决策辅助工具：没有账号、没有登录、没有后台用户库——把网页关掉，我们这边不会留下任何与你有关的记录。本政策说明我们<strong>不</strong>收集什么、你输入的数据存在哪里、你有权做什么，以及如何一次性清除全部数据。',
        '<strong>数据控制者</strong>：栖居罗盘（Habitat Compass）的运营者。本站为个人运营的免费工具，尚未设立公司实体；在适用法域正式确定前，本政策即我们对数据处理的完整说明。任何与隐私有关的问题，都请写信至 <code>hi@habitatcompass.com</code>（法域与管辖条款见<a href="/terms/#s10">《用户协议》</a>）。',
      ] },
      { h: '二、我们处理哪些数据', ps: [
        '本站<strong>不收集、不上传任何个人数据</strong>。你在使用中产生的全部数据，仅保存在<strong>你自己设备浏览器的 localStorage</strong> 中，键名统一以 <code>nomadmatch.v1</code> 为前缀，具体包括：',
      ], list: [
        '测评草稿与作答记录（draft / proDraft）——目的地偏好、预算、问卷答案',
        '测评结果与最近一次历史（history / proHistory）——匹配得分与报告数据',
        '收藏城市（favorites）、对比工作区与对比存档（compare / archives）',
        '硬性条件与护照选择（hardConstraints / passport）——预算上限、签证底线、安全阈值',
        '界面语言设置（lang）与本地匿名计数（funnel）——阶段事件的次数与时间戳，键名不含身份信息',
        'PWA 安装状态（pwaInstallDismissedAt / pwaInstalled）——是否已安装、安装提示的冷却时间',
      ], after: [
        '以上数据均由你主动输入，或由你的输入直接计算产生；<strong>不包含</strong>姓名、邮箱、电话、精确位置等直接身份信息，也不包含任何可用于追踪你跨站行为的标识符。为在下次打开时记住你的选择，这些数据带有本机时间戳（如历史保存时间、安装提示冷却与阶段事件时间），但它们从不离开你的设备。',
      ] },
      { h: '三、我们明确不做的四件事', ps: [
        '<strong>无追踪 Cookie</strong>——本站不设置任何 Cookie，也不读取第三方 Cookie。',
        '<strong>无第三方分析与广告</strong>——不加载 Google Analytics 或任何分析、广告、社交插件，不向任何第三方发送你的数据。',
        '<strong>无云端 AI 处理</strong>——测评与匹配全部在你的浏览器内完成，不上传到任何 AI 服务。需说明的是，本站为便于被回答引擎收录，允许 AI 爬虫读取公开页面（见下节及 <a href="/robots.txt">robots.txt</a>）；它们只能看到公开内容，<strong>触不到你设备中未上传的作答</strong>。',
        '<strong>无账号与云端同步</strong>——本站没有登录，也没有云端备份；换一台设备就不会看到此前的数据，这是我们刻意的设计。',
      ] },
      { h: '四、处理目的与法律基础', ps: [
        '处理目的：仅为你正在请求的服务本身——保存测评进度、生成报告、记忆界面设置（GDPR 第 6(1)(b) 条：为履行你所请求的服务所必需的处理）。',
        '本站不设置 Cookie、不访问终端设备信息用于追踪；上述本地存储属于提供你明确请求的服务所<strong>严格必需（strictly necessary）</strong>的范围（参见 ePrivacy 指令第 5(3) 条的豁免逻辑）。因此本站<strong>不设 Cookie 同意横幅</strong>，也不进行任何基于自动化决策的画像或广告定向。',
      ] },
      { h: '五、存储位置、保存期限与国际传输', ps: [
        '全部数据仅存在于你的设备本地。<strong>没有任何数据上传到服务器，因此不存在国际数据传输</strong>，也不存在服务器端的泄露面。本地数据会一直保留，<strong>直到你自行清除</strong>——通过浏览器"清除站点数据"，或使用下方"清除我的所有数据"按钮；我们无法、也不会在后台替你删除或备份。',
        '我们使用的字体等静态资源在构建时打包进站点，页面运行过程中不向第三方发起请求。需说明的是：本站的<strong>公开页面</strong>（城市、国家、方法论、税负测算等）为便于被搜索与回答引擎收录，允许 AI 爬虫（GPTBot / ClaudeBot / PerplexityBot 等，见 robots.txt）抓取。它们只能看到任何访客都能看到的公开内容，<strong>无法接触你设备中未上传的作答数据</strong>。',
      ] },
      { h: '六、数据共享与披露', ps: [
        '我们<strong>不向任何第三方出售、出租或共享</strong>你的数据——因为从技术上讲，我们根本没有这些数据可分享。',
        '关于政府或执法调取：由于本站不存在服务器端存储，我们无法响应任何要求提供用户数据的请求；我们能提供的只有空白。若收到此类要求，我们会在法律允许的范围内透明说明我们"无从提供"。',
      ] },
      { h: '七、你的权利（GDPR 第 15–22 条）', ps: [
        '依 GDPR，你享有：访问权（第 15 条）、更正权（第 16 条）、删除权 / 被遗忘权（第 17 条）、处理限制权（第 18 条）、数据可携带权（第 20 条）、反对权（第 21 条），以及向监管机构申诉的权利（第 77 条）。<strong>由于全部数据都在你的设备本地，上述权利你可以即时、完全地亲自行使</strong>：',
      ], list: [
        '访问 / 可携带：浏览器开发者工具（Application → Local Storage）可直接查看并导出全部数据',
        '更正 / 删除 / 限制 / 反对：删除对应存储键即告完成——最简单的方式是下方按钮或浏览器"清除站点数据"',
        '如需任何协助，可发邮件至 hi@habitatcompass.com，我们在 <strong>30 天内</strong>回复',
      ] },
      { h: '八、未成年人（第 8 条）', ps: [
        '本服务不面向 <strong>16 周岁以下</strong>用户；如你未满 16 周岁，请勿使用本站。',
      ] },
      { h: '九、数据泄露（第 33 / 34 条）', ps: [
        '本站无服务器端存储，常规情况下不存在服务器泄露风险。尽管如此，若发生影响你数据的安全事件，我们将<strong>在知悉后 72 小时内</strong>通过本页显著公告，并在可能时逐一通知受影响用户。',
      ] },
      { h: '十、EEA / 英国 / 瑞士补充与加州（CCPA / CPRA）说明', ps: [
        'EEA / 英国 / 瑞士：本政策即 GDPR 第 13 条信息义务的完整披露；处理行为均在你设备本地完成，无代表处理者、无自动化决策。',
        '加州：本站不出售也不共享（sell / share）任何个人信息——数据从未离开你的设备，"Do Not Sell My Personal Information" 的要求在本站天然得到满足；加州居民同样享有知情权、删除权与不受歧视的权利。',
      ] },
      { h: '十一、第三方链接', ps: [
        '本站可能包含指向外部网站（如数据来源、官方移民机构）的链接。这些站点由其各自的运营者负责，其隐私做法适用它们自己的政策，本政策不适用于本站之外的页面。',
      ] },
      { h: '十二、政策变更与联系', ps: [
        '本政策如有实质变更，将在本页更新并标注日期；重大变更时在首页显著位置提示。建议你在重要节点回看本页的"最后更新"日期。任何问题请联系 <code>hi@habitatcompass.com</code>。',
      ] },
    ],
  },
  en: {
    title: 'Privacy Policy | Habitat Compass',
    desc: 'No tracking cookies, no third-party analytics, no ads, no accounts. All your data stays in your browser local storage (nomadmatch.v1) and can be erased anytime with one click.',
    updated: `Last updated: ${BUILD_DATE}`,
    notice: 'In one sentence: <strong>everything you do on this site stays inside your own browser.</strong> There are no accounts, no server-side database, and we cannot read any of it.',
    attribution: 'The structure and wording of this policy draw on the openly licensed (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="license noopener">CC BY-SA 4.0</a>) legal documents published by Automattic (Legalmattic), fully rewritten to match how this site actually works: no accounts, no server, local-only.',
    sections: [
      { h: '1. Who we are and what this policy covers', ps: [
        'Habitat Compass ("the site") is a <strong>browser-only</strong> decision-support tool for settling abroad: no account, no login and no back-end user database — close the tab and nothing about you remains on our side. This policy explains what we do <strong>not</strong> collect, where the data you enter lives, what you may do with it, and how to erase it all in one click.',
        '<strong>Data controller</strong>: the operator of Habitat Compass. The site is a free, individually operated tool with no corporate entity as yet; until a jurisdiction is formally established, this policy is our complete account of how data is handled. For any privacy question, write to <code>hi@habitatcompass.com</code> (jurisdiction and venue are set out in the <a href="/en/terms/#s10">Terms of Service</a>).',
      ] },
      { h: '2. What data we process', ps: [
        'The site <strong>collects and uploads no personal data</strong>. Everything you produce while using it is stored only in <strong>your browser\'s localStorage</strong>, under keys prefixed <code>nomadmatch.v1</code>:',
      ], list: [
        'Quiz drafts & answers (draft / proDraft) — destination preferences, budget, questionnaire answers',
        'Results & latest history (history / proHistory) — match scores and report data',
        'Favourite cities (favorites), compare workspace and archives (compare / archives)',
        'Hard constraints & passport choice (hardConstraints / passport) — budget cap, visa floor, safety threshold',
        'Interface language (lang) and local anonymous counters (funnel) — event counts and timestamps; key names carry no identity',
        'PWA install state (pwaInstallDismissedAt / pwaInstalled) — whether installed and the install-prompt cooldown',
      ], after: [
        'All of it is entered by you or derived from your input. It contains <strong>no</strong> name, e-mail, phone number or precise location, and no identifier that could track you across other sites. To remember your choices for next time, this data carries local timestamps (history save time, install-prompt cooldown, stage-event times), but it never leaves your device.',
      ] },
      { h: '3. Four things we explicitly do NOT do', ps: [
        '<strong>No tracking cookies</strong> — the site sets no cookies and reads no third-party cookies.',
        '<strong>No third-party analytics or ads</strong> — no Google Analytics, no ad networks, no social plugins; nothing is sent to anyone.',
        '<strong>No cloud AI processing</strong> — matching runs entirely in your browser and is never sent to any AI service. Note that, to be discoverable by answer engines, the site allows AI crawlers (GPTBot / ClaudeBot / PerplexityBot, per robots.txt) to read its <strong>public</strong> pages; they only see public content and <strong>cannot reach the un-uploaded answers on your device</strong>.',
        '<strong>No accounts and no cloud sync</strong> — there is no login and no cloud backup; switching device means starting fresh. That is deliberate.',
      ] },
      { h: '4. Purpose & legal basis', ps: [
        'Purpose: only the service you request — keeping quiz progress, generating reports, remembering your language setting (Art. 6(1)(b) GDPR: processing necessary for the performance of the service).',
        'The site sets no cookies and does not access terminal equipment for tracking. The local storage described above is <strong>strictly necessary</strong> to provide the service you explicitly requested (cf. the exemption logic of Art. 5(3) ePrivacy Directive). The site therefore <strong>shows no consent banner</strong> and carries out no automated decision-making, profiling or ad targeting.',
      ] },
      { h: '5. Storage location, retention & international transfers', ps: [
        'All data stays on your device. <strong>Nothing is uploaded to any server, so there is no international data transfer</strong> and no server-side breach surface. Local data is kept <strong>until you erase it</strong> — via your browser\'s "clear site data", or the "Erase all my data" button below; we cannot, and will not, delete or back it up for you.',
        'Static assets such as fonts are bundled at build time; the running page makes no third-party requests. For clarity: this site\'s <strong>public pages</strong> (cities, countries, methodology, tax planner) are open to AI crawlers (GPTBot / ClaudeBot / PerplexityBot, per robots.txt) so they can be indexed and cited by answer engines. Such crawlers only ever see the public content any visitor sees, and <strong>cannot reach the un-uploaded answers held on your device</strong>.',
      ] },
      { h: '6. Sharing & disclosure', ps: [
        'We <strong>do not sell, rent or share</strong> your data with anyone — technically, we do not hold it in the first place.',
        'On government or law-enforcement requests: with no server-side storage we cannot comply with any request for user data; all we could hand over is blank. Should such a request arrive, we will be transparent, to the extent the law allows, that we have nothing to provide.',
      ] },
      { h: '7. Your rights (GDPR Art. 15–22)', ps: [
        'Under the GDPR you have: the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20), the right to object (Art. 21), and the right to lodge a complaint with a supervisory authority (Art. 77). <strong>Because all data lives on your device, you can exercise every one of these rights instantly and completely</strong>:',
      ], list: [
        'Access / portability: browser dev tools (Application → Local Storage) let you view and export everything',
        'Rectification / erasure / restriction / objection: removing the storage keys is the whole act — the button below or "clear site data" does it',
        'Need help? E-mail hi@habitatcompass.com — we reply within <strong>30 days</strong>',
      ] },
      { h: '8. Children (Art. 8)', ps: [
        'The service is not offered to anyone <strong>under 16</strong>. If you are under 16, please do not use the site.',
      ] },
      { h: '9. Data breach (Art. 33/34)', ps: [
        'With no server-side storage there is ordinarily no server breach risk. Should a security incident ever affect your data, we will publish a prominent notice on this page <strong>within 72 hours</strong> of becoming aware, and notify affected users individually where possible.',
      ] },
      { h: '10. EEA/UK/Switzerland supplement & California (CCPA/CPRA)', ps: [
        'EEA/UK/Switzerland: this policy constitutes the full Art. 13 GDPR information disclosure; processing happens locally on your device, with no processors and no automated decision-making.',
        'California: the site does not sell or share any personal information — data never leaves your device, so "Do Not Sell My Personal Information" is satisfied by design; California residents also enjoy the rights to know, to delete and to non-discrimination.',
      ] },
      { h: '11. Third-party links', ps: [
        'The site may link to external websites (data sources, official immigration authorities). Those sites are run by their own operators and governed by their own policies; this policy does not cover any page beyond this site.',
      ] },
      { h: '12. Changes & contact', ps: [
        'Material changes will be published on this page with an updated date; major changes are announced on the home page. Please revisit the "last updated" date at important moments. Any question: <code>hi@habitatcompass.com</code>.',
      ] },
    ],
  },
};

const LEGAL_TERMS = {
  zh: {
    title: '用户协议 | 栖居罗盘',
    desc: '服务描述、可接受使用、知识产权与开源数据署名、免责声明、责任限制、赔偿与争议解决。用户协议全文。',
    updated: `最后更新：${BUILD_DATE}`,
    notice: '一句话概括：<strong>本站免费、无需注册，是一个决策辅助工具，不是移民/法律/税务建议。</strong>请务必通过官方渠道核实签证与入境政策。',
    attribution: '本协议的结构参考了 Automattic 以 <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="license noopener">CC BY-SA 4.0</a> 开放的法律文本（Legalmattic），并已按本站「免费、无账号、纯本地」的实际做法全面改写。',
    sections: [
      { h: '一、协议双方与接受', ps: [
        '本用户协议（下称"本协议"）是你与栖居罗盘（Habitat Compass，下称"本站"）运营者之间，就你访问和使用本站所达成的约定。',
        '<strong>访问或使用本站的任何部分，即表示你已阅读、理解并同意受本协议约束。</strong>如果你不同意，请不要使用本站。',
        '"你"指任何使用本站的个人或主体；若你代表某一主体使用本站，你声明并保证已获授权代表其接受本协议。',
      ] },
      { h: '二、服务描述', ps: [
        `栖居罗盘为数字游民、自由职业者与远程工作者提供海外城市定居的<strong>决策辅助</strong>：基于你的偏好作答与公开数据快照，对库内 ${CITIES.length} 座城市加权打分并生成报告。`,
        '本站的核心测评（32 项人格量表 + 8 道情景题，另含 16 个兴趣标签）、可选的深度测评、城市对比与税负测算等功能，全部<strong>无需付费</strong>，也<strong>无需注册账号</strong>；不提供订阅、虚拟商品或任何形式的交易。',
        '本站无账号体系，因此不存在"账户安全"义务；你的全部数据仅存于你自己的浏览器（详见<a href="/privacy/">《隐私政策》</a>）。',
      ] },
      { h: '三、使用资格与你的内容', ps: [
        '你须年满 <strong>16 周岁</strong>方可使用本站，使用即表示你已达到该年龄要求。你须自备所需的设备与浏览器环境，并自行承担联网费用。',
        '你在本站输入的偏好、作答与备注是你自己的内容，仅保存于你的设备本地。本站不上传、不保存你的内容，我们无法访问、修改或删除它；你需自行负责设备上数据的保管与清除（见<a href="/privacy/">《隐私政策》</a>的清除按钮）。',
      ] },
      { h: '四、可接受使用', ps: [
        '你可以自由浏览与使用本站。你同意不：',
      ], list: [
        '以自动化脚本对本站发起高频请求，或以其他方式干扰服务的可用性与稳定性',
        '尝试绕过、破坏或探测本站及其托管环境的安全机制',
        '将本站内容整体转售，或作为你自己产品的核心数据源再分发',
        '以自动化手段批量提取题库或报告数据',
        '以任何违法方式使用本站，或将其用于侵犯他人权利的目的',
      ] },
      { h: '五、知识产权与开源数据署名', ps: [
        '本站的界面设计、文案与代码版权归栖居罗盘（Habitat Compass）运营者所有。除本协议明确许可外，未经书面同意不得复制、修改或再分发。',
        '本站引用的公开数据、题库与字库按其许可要求署名（完整清单见<a href="/methodology/">方法论页</a>）：',
      ], list: [
        '官方开放数据（Open Data）与公开统计测算：成本 / 安全 / 医疗 / 生活质量 / 英语排名 / 宽带网速等（NYC=100 口径，完整口径与更新频率见方法论页）',
        'GeoNames（CC BY 4.0）、Open-Meteo Historical 与 Air Quality（CC BY 4.0）',
        'World Bank / UNDP / Transparency International / IEP 国家指标（开放数据与公开引用排名）',
        'OEJTS 1.2 人格题库（CC BY-NC-SA 4.0，Open Psychometrics）',
        '字体 Fraunces / Newsreader / Manrope（SIL Open Font License 1.1）',
      ], after: [
        '本站法律文本自身的结构与措辞，部分参考了 Automattic 以 CC BY-SA 4.0 开放的法律文档（Legalmattic）。',
      ] },
      { h: '六、第三方服务', ps: [
        '本站运行时不加载任何第三方脚本、分析或广告服务，也不使用第三方登录。',
        '本站可能含有指向外部网站（数据来源、官方移民机构等）的链接。这些网站由其各自运营者负责，我们不对其内容、可用性或做法作任何担保，访问风险由你自担。',
      ] },
      { h: '七、免责声明', ps: [
        '本站按"现状"（as-is）与"可用"（as-available）提供，不提供任何明示或默示的保证，包括但不限于适销性、特定用途适用性与不侵权的担保。',
        '本站内容<strong>不构成移民、签证、居留、法律、税务、医疗、保险、财务或投资建议</strong>；匹配分数仅是基于你自述偏好与第三方公开数据快照的参考值，不构成对任何城市或国家的担保。',
        '数据（成本、安全、网速、签证概览等）为第三方来源的<strong>时点快照，可能过时或存在误差</strong>；签证与入境政策多变，出行与定居前务必通过官方渠道核实。',
        '人格测评为自我探索工具，其算法输出不构成心理评估、诊断或临床建议。',
      ] },
      { h: '八、责任限制', ps: [
        '在适用法律允许的最大范围内，运营者不对你因使用或无法使用本站而产生的任何间接、附带、特殊或后果性损失承担责任，也不对你的定居、出行或职业决策结果负责。',
        '由于本站免费提供且数据仅存于你的设备本地，在适用法律允许的范围内，运营者对本站的全部累计责任以零为限。',
      ] },
      { h: '九、赔偿', ps: [
        '若因你违反本协议、违法使用本站，或侵犯第三方权利，而导致任何第三方对运营者提出索赔、要求或损失（含合理的法律费用），你同意就此对运营者进行赔偿并使其免受损害。',
      ] },
      { h: '十、服务变更、协议修订与终止', ps: [
        '我们可能随时修改、暂停或终止本站的全部或部分功能，且无需事先通知。你可以随时停止使用，并通过<a href="/privacy/">《隐私政策》</a>中的按钮清除你的全部本地数据。',
        '本协议如有实质变更，将在本页更新并标注日期；变更后你继续使用本站，即视为接受修订后的协议。',
        '本协议中依其性质应继续有效的条款（如知识产权、免责声明、责任限制、赔偿、适用法律），在协议终止后继续有效。',
      ] },
      { h: '十一、适用法律与争议解决', ps: [
        '本协议适用运营者主要经营地所在法域的法律。本站为个人运营的免费工具，尚未设立特定公司实体；待运营主体正式确定后，我们将在此明确写明适用的法域与有管辖权的法院，并以更新本页的方式生效。',
        '居住于 EEA / 英国 / 瑞士的用户，本协议不排除或限制你依所在地强制性消费者保护法规享有的任何权利。',
        '因本协议或本站产生的争议，双方应先本着诚信原则友好协商解决；协商不成的，提交运营者主要经营地有管辖权的法院解决。',
      ] },
      { h: '十二、可分割性、完整协议与联系', ps: [
        '若本协议任何条款被认定为无效或不可执行，该条款将在最小必要范围内被限制或剔除，其余条款仍完全有效。',
        '本协议连同<a href="/privacy/">《隐私政策》</a>与<a href="/disclaimer/">《免责声明》</a>，构成你与运营者之间就本站达成的完整约定。',
        '联系方式：hi@habitatcompass.com。',
      ] },
    ],
  },
  en: {
    title: 'Terms of Service | Habitat Compass',
    desc: 'Service description, acceptable use, IP & open-data attribution, disclaimers, limitation of liability, indemnification and dispute resolution.',
    updated: `Last updated: ${BUILD_DATE}`,
    notice: 'In one sentence: <strong>this site is free, needs no account, and is a decision-support tool — not immigration, legal or tax advice.</strong> Always verify visa and entry rules with official channels.',
    attribution: 'The structure of these terms draws on the openly licensed (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="license noopener">CC BY-SA 4.0</a>) legal documents published by Automattic (Legalmattic), fully rewritten to match how this site actually works: free, accountless, local-only.',
    sections: [
      { h: '1. Parties and acceptance', ps: [
        'These Terms of Service ("Terms") set out the agreement between you and the operator of Habitat Compass ("the site") regarding your access to and use of the site.',
        '<strong>By accessing or using any part of the site you confirm that you have read, understood and agree to be bound by these Terms.</strong> If you do not agree, please do not use the site.',
        '"You" means any individual or entity using the site; if you use the site on behalf of an entity, you represent and warrant that you are authorised to accept these Terms on its behalf.',
      ] },
      { h: '2. Service description', ps: [
        `Habitat Compass provides <strong>decision support</strong> for digital nomads, freelancers and remote workers settling abroad: it scores the ${CITIES.length} cities in its library against your stated preferences and public data snapshots, and generates a report.`,
        'The core assessment (a 32-item personality scale plus 8 scenario questions, with 16 interest tags), the optional in-depth assessment, city comparison and the tax planner are entirely <strong>free of charge</strong> and require <strong>no account</strong>. There are no subscriptions, virtual goods or transactions of any kind.',
        'The site has no account system, so there is no "account security" duty; all your data stays in your own browser (see the <a href="/en/privacy/">Privacy Policy</a>).',
      ] },
      { h: '3. Eligibility and your content', ps: [
        'You must be at least <strong>16 years old</strong> to use the site; by using it you confirm you meet that age requirement. You are responsible for the device, browser and connectivity needed, and for any connection costs.',
        'The preferences, answers and notes you enter are your own content, kept only in your browser\'s local storage. The site neither uploads nor stores your content, so we cannot access, modify or delete it; you are solely responsible for keeping and clearing the data on your device (see the erase button in the <a href="/en/privacy/">Privacy Policy</a>).',
      ] },
      { h: '4. Acceptable use', ps: [
        'You may browse and use the site freely. You agree not to:',
      ], list: [
        'send high-frequency automated requests or otherwise disrupt the availability or stability of the service',
        'attempt to bypass, break or probe the security of the site or its hosting environment',
        'resell the site\'s content as a whole or redistribute it as the core data source of your own product',
        'systematically scrape or redistribute the question bank or report data',
        'use the site unlawfully or to infringe the rights of others',
      ] },
      { h: '5. IP & open-data attribution', ps: [
        'The interface design, copy and code are © the Habitat Compass operator. Except as expressly permitted here, you may not copy, modify or redistribute them without written consent.',
        'Public data, questionnaires and typefaces are credited per their licences (full list on the <a href="/en/methodology/">Methodology page</a>):',
      ], list: [
        'Official open data & public statistical estimates: cost / safety / healthcare / quality of life / English-proficiency rank / broadband speeds (NYC=100 basis; full methodology on the Methodology page)',
        'GeoNames (CC BY 4.0), Open-Meteo Historical & Air Quality (CC BY 4.0)',
        'World Bank / UNDP / Transparency International / IEP country indicators (open data & publicly cited rankings)',
        'OEJTS 1.2 personality questionnaire (CC BY-NC-SA 4.0, Open Psychometrics)',
        'Typefaces Fraunces / Newsreader / Manrope (SIL Open Font License 1.1)',
      ], after: [
        'The structure and wording of the site\'s own legal documents draw in part on Automattic\'s CC BY-SA 4.0 licensed legal texts (Legalmattic).',
      ] },
      { h: '6. Third-party services', ps: [
        'The site loads no third-party scripts, analytics or advertising at runtime, and uses no third-party login.',
        'The site may contain links to external websites (data sources, official immigration authorities). Those sites are run by their own operators; we make no warranty as to their content, availability or practices, and you visit them at your own risk.',
      ] },
      { h: '7. Disclaimers', ps: [
        'The site is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement.',
        'Its content <strong>is not immigration, visa, legal, tax, medical, insurance, financial or investment advice</strong>; match scores are reference values derived from your self-reported preferences and third-party public snapshots, and are no guarantee of any city or country.',
        'Data (cost, safety, speeds, visa overviews) are <strong>point-in-time third-party snapshots and may be outdated or imprecise</strong>. Visa and entry rules change frequently — always verify with official channels before travelling or relocating.',
        'The personality assessment is a self-exploration tool; its algorithmic output is not a psychological evaluation, diagnosis or clinical advice.',
      ] },
      { h: '8. Limitation of liability', ps: [
        'To the maximum extent permitted by applicable law, the operator is not liable for any indirect, incidental, special or consequential loss arising from your use of (or inability to use) the site, nor for the outcomes of your relocation, travel or career decisions.',
        'Because the site is free and all data stays on your device, the operator\'s total aggregate liability in respect of the site is limited to zero, to the extent permitted by applicable law.',
      ] },
      { h: '9. Indemnification', ps: [
        'If your breach of these Terms, unlawful use of the site, or infringement of a third party\'s rights gives rise to any claim, demand or loss against the operator (including reasonable legal fees), you agree to indemnify and hold the operator harmless.',
      ] },
      { h: '10. Changes, amendments & termination', ps: [
        'We may modify, suspend or discontinue all or part of the site at any time, without prior notice. You may stop using it at any moment and erase all your local data via the button in the <a href="/en/privacy/">Privacy Policy</a>.',
        'Material changes to these Terms will be published on this page with an updated date; your continued use of the site after a change constitutes acceptance of the revised Terms.',
        'Sections that by their nature should survive termination (such as IP, disclaimers, limitation of liability, indemnification and governing law) will continue to apply.',
      ] },
      { h: '11. Governing law & dispute resolution', ps: [
        'These Terms are governed by the law of the jurisdiction where the operator is principally established. The site is a free, individually operated tool with no specific corporate entity as yet; once the operating entity is formally established we will state the governing jurisdiction and the competent courts here, effective on the date this page is updated.',
        'If you are a consumer in the EEA, the UK or Switzerland, nothing in these Terms excludes or limits any rights you have under the mandatory consumer-protection law of your country of residence.',
        'Disputes arising from these Terms or the site shall first be resolved amicably and in good faith; failing that, they shall be submitted to the competent courts of the operator\'s principal place of business.',
      ] },
      { h: '12. Severability, entire agreement & contact', ps: [
        'If any provision of these Terms is held invalid or unenforceable, it will be limited or severed to the minimum extent necessary and the remaining provisions will stay in full force.',
        'These Terms, together with the <a href="/en/privacy/">Privacy Policy</a> and the <a href="/en/disclaimer/">Disclaimer</a>, constitute the entire agreement between you and the operator regarding the site.',
        'Contact: hi@habitatcompass.com.',
      ] },
    ],
  },
};

const LEGAL_DISCLAIMER = {
  zh: {
    title: '免责声明 | 栖居罗盘',
    desc: '城市评分与推荐仅为信息参考，不构成移民、签证、居留、法律、税务、医疗、保险、财务或投资建议；数据为第三方来源快照（页面标注快照日期），可能过时或有误差。',
    updated: `最后更新：${BUILD_DATE}`,
    sections: [
      { h: '一、信息性质：仅供参考，不构成专业建议', ps: [
        '本站提供的城市评分、排名与推荐<strong>仅为信息参考</strong>，不构成<strong>移民、签证、居留、法律、税务、医疗、保险、财务或投资建议</strong>。',
        '搬家、签证申请、置业、远程工作安排等重大决策，请咨询当地专业机构，并以政府与官方渠道发布的信息为准。<strong>你基于本站内容做出的任何决定及由此产生的后果，由你自行承担风险</strong>。',
        '人格测评为自我探索工具，其算法输出不构成心理评估、诊断或临床建议。',
      ] },
      { h: '二、数据准确性：第三方快照，可能过时', ps: [
        '本站的成本、安全、气候、网速、空气质量等数据依赖官方开放数据与公开统计来源（Open-Meteo、GeoNames、World Bank 等），均为<strong>时点快照</strong>并在相应页面标注快照日期。',
        '第三方数据可能过时、不完整或存在口径误差，本站<strong>不对任何数据的准确性、完整性或时效性作出保证</strong>；快照日期之后的变化本站不承担更新义务（但会按方法论页披露的频率复核）。',
      ] },
      { h: '三、无担保，及与其他法律文件的关系', ps: [
        '本服务按"现状"（as-is）与"可用"（as-available）提供，不作任何明示或默示的担保，包括但不限于对适销性、特定用途适用性与不侵权的担保；本站不保证服务不间断、无错误或安全。',
        '本声明与<a href="/terms/">《用户协议》</a>（尤其其免责声明与责任限制章节）一并适用；数据处理见<a href="/privacy/">《隐私政策》</a>。三者冲突时，以更具体约定优先。',
      ] },
    ],
  },
  en: {
    title: 'Disclaimer | Habitat Compass',
    desc: 'City scores and recommendations are for information only — not immigration, visa, legal, tax, medical, insurance, financial or investment advice. Data are third-party snapshots and may be outdated.',
    updated: `Last updated: ${BUILD_DATE}`,
    sections: [
      { h: '1. Nature of information: reference only, not professional advice', ps: [
        'City scores, rankings and recommendations on this site are <strong>for information only</strong> and do not constitute <strong>immigration, visa, legal, tax, medical, insurance, financial or investment advice</strong>.',
        'For major decisions — relocating, visa applications, property, remote-work arrangements — consult local professionals and rely on official government sources. <strong>Any decision you make based on this site, and its consequences, are at your own risk.</strong>',
        'The personality assessment is a self-exploration tool; its algorithmic output is not a psychological evaluation, diagnosis or clinical advice.',
      ] },
      { h: '2. Data accuracy: third-party snapshots that may be outdated', ps: [
        'Cost, safety, climate, internet-speed and air-quality data rely on official open data and public statistical sources (Open-Meteo, GeoNames, World Bank, etc.) and are <strong>point-in-time snapshots</strong> with the snapshot date shown on each page.',
        'Third-party data can be outdated, incomplete or inconsistent in methodology. The site <strong>makes no warranty as to accuracy, completeness or timeliness</strong> of any data, and is not obliged to update beyond the review cadence published on the Methodology page.',
      ] },
      { h: '3. No warranty, and relation to other legal documents', ps: [
        'The service is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement; the site does not warrant uninterrupted, error-free or secure operation.',
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
  // 摘要条：法律文本偏长，先给一句人话结论（隐私/协议各有 notice；免责页沿用固定警示）
  const leadNotice = kind === 'disclaimer'
    ? `<div class="notice">${zh ? '<strong>本站内容仅为信息参考，不构成移民、签证、居留、法律、税务、医疗、保险、财务或投资建议。</strong>' : '<strong>Informational reference only — not immigration, visa, legal, tax, medical, or financial advice.</strong>'}</div>`
    : d.notice
      ? `<div class="notice">${d.notice}</div>`
      : '';
  // 目录：长文导航（仅隐私/协议；免责页较短可省）
  const toc = kind !== 'disclaimer'
    ? `<nav class="toc" aria-label="${zh ? '目录' : 'Contents'}"><p class="toc-h">${zh ? '目录' : 'Contents'}</p><ol>${d.sections
        .map((s, i) => `<li><a href="#s${i}">${esc(s.h)}</a></li>`)
        .join('')}</ol></nav>`
    : '';
  // 署名：法律文本结构参考 CC BY-SA 4.0 开源模板（合规且诚实）
  const attr = d.attribution ? `<p class="attr">${d.attribution}</p>` : '';
  const eraseBlock = kind === 'privacy'
    ? `<section class="card erase" id="erase">
<h2>${zh ? '清除我的所有数据' : 'Erase all my data'}</h2>
<p>${zh
        ? '以下按钮立即删除本浏览器中本站存储的全部数据（<code>nomadmatch.v1</code> 前缀所有键：测评草稿与历史、收藏城市、对比工作区与存档、硬性条件、护照选择、语言设置、匿名漏斗计数与 PWA 安装状态）。删除不可恢复。'
        : 'The button below immediately deletes everything this site has stored in this browser (every key prefixed <code>nomadmatch.v1</code>: quiz drafts and history, favourite cities, compare workspace and archives, hard constraints, passport choice, language, anonymous funnel counters and PWA install state). Deletion is irreversible.'}</p>
<button class="btn-danger" onclick="eraseAll()">${zh ? '清除我的所有数据' : 'Erase all my data'}</button>
<p id="erase-done" class="erase-done" hidden></p>
<noscript><p>${zh ? '（需要启用 JavaScript 才能使用此按钮；你也可以直接在浏览器设置中清除本站数据。）' : '(JavaScript is required for this button; you can also clear this site\'s data in your browser settings.)'}</p></noscript>
</section>
<script>
function eraseAll() {
  if (!window.confirm('${zh ? '确认删除本站保存在本浏览器的全部数据（测评草稿/历史/收藏/对比存档等）？此操作不可恢复。' : 'Delete all data this site has stored in this browser (drafts, history, favorites, compare archives)? This cannot be undone.'}')) return;
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
<p class="sub">${d.updated}</p>${leadNotice}
${toc}
${sections}
${eraseBlock}
${attr}
${crossLink}`;
  return shell({ lang, title: d.title, desc: d.desc, canonical, hreflang: { zh: page(`/${kind}/`), en: page(`/en/${kind}/`) }, jsonLd, body });
}

// ---------- 404 页 ----------
// Cloudflare Workers 静态资源 not_found_handling 需为 "404-page"（见 wrangler.jsonc），
// 未匹配路由返回本页并带 HTTP 404 状态；避免 SPA fallback 把不存在路径当 200 → 软 404。
// 因主应用无 URL 路由（纯状态驱动），无需 SPA fallback。
function renderNotFound() {
  const title = '404 · 页面不存在 | 栖居罗盘';
  const desc = `你要找的页面不存在或已移动。返回首页重新开始，或浏览 ${CITIES.length} 座城市与 65 国定居指南。`;
  const body = `
<h1>404<span class="badge">页面不存在 / Page not found</span></h1>
<p class="sub">你要找的页面不存在或已移动。The page you requested does not exist or has moved.</p>
<div class="answer"><p>不妨从这些入口重新开始：<br>Start again from one of these:</p></div>
<div class="grid">
  <div class="card"><div class="v" style="font-size:18px"><a href="/" style="color:var(--pine);text-decoration:none">首页 / 测评 Home &amp; quiz →</a></div></div>
  <div class="card"><div class="v" style="font-size:18px"><a href="/cities/" style="color:var(--pine);text-decoration:none">城市索引 ${CITIES.length} Cities →</a></div></div>
  <div class="card"><div class="v" style="font-size:18px"><a href="/countries/" style="color:var(--pine);text-decoration:none">国家索引 65 Countries →</a></div></div>
  <div class="card"><div class="v" style="font-size:18px"><a href="/en/" style="color:var(--pine);text-decoration:none">English home →</a></div></div>
</div>`;
  return shell({ lang: 'zh', title, desc, canonical: null, hreflang: null, jsonLd: [], body, robots: 'noindex, follow' });
}

export { write, addUrl, sitemapUrls, renderCityPage, renderCountryPage, renderCitiesIndex, renderCountriesIndex, renderMethodology, renderLegalPage, renderNotFound, renderTaxPage, page };

function main() {
  fs.mkdirSync(DIST, { recursive: true });
  let count = 0;
  for (const city of CITIES) {
    write(`city/${city.id}/index.html`, renderCityPage(city, 'zh')); count++;
    write(`en/city/${city.id}/index.html`, renderCityPage(city, 'en')); count++;
    addUrl(`/city/${city.id}/`, CITY_DATA_DATE); addUrl(`/en/city/${city.id}/`, CITY_DATA_DATE);
  }
  for (const co of COUNTRIES) {
    write(`country/${co.code.toLowerCase()}/index.html`, renderCountryPage(co, 'zh')); count++;
    write(`en/country/${co.code.toLowerCase()}/index.html`, renderCountryPage(co, 'en')); count++;
    addUrl(`/country/${co.code.toLowerCase()}/`, co.updatedAt ?? COUNTRY_DATA_DATE); addUrl(`/en/country/${co.code.toLowerCase()}/`, co.updatedAt ?? COUNTRY_DATA_DATE);
  }
  write('cities/index.html', renderCitiesIndex('zh')); write('en/cities/index.html', renderCitiesIndex('en')); count += 2;
  addUrl('/cities/', CITY_DATA_DATE); addUrl('/en/cities/', CITY_DATA_DATE);
  write('countries/index.html', renderCountriesIndex('zh')); write('en/countries/index.html', renderCountriesIndex('en')); count += 2;
  addUrl('/countries/', COUNTRY_DATA_DATE); addUrl('/en/countries/', COUNTRY_DATA_DATE);
  write('methodology/index.html', renderMethodology('zh')); write('en/methodology/index.html', renderMethodology('en')); count += 2;
  addUrl('/methodology/', SCRIPT_DATE); addUrl('/en/methodology/', SCRIPT_DATE);
  // 税负测算子页面（V1）：长尾 SEO/AEO 入口，双写 public/ 供 dev 直达
  writeLegal('tax-calculator/index.html', renderTaxPage('zh')); writeLegal('en/tax-calculator/index.html', renderTaxPage('en')); count += 2;
  addUrl('/tax-calculator/', SCRIPT_DATE); addUrl('/en/tax-calculator/', SCRIPT_DATE);
  // 第十三轮：法律页（隐私政策 / 用户协议 / 免责声明，zh/en；双写 public/ 供 dev 直达）
  writeLegal('privacy/index.html', renderLegalPage('privacy', 'zh')); writeLegal('en/privacy/index.html', renderLegalPage('privacy', 'en')); count += 2;
  addUrl('/privacy/', SCRIPT_DATE); addUrl('/en/privacy/', SCRIPT_DATE);
  writeLegal('terms/index.html', renderLegalPage('terms', 'zh')); writeLegal('en/terms/index.html', renderLegalPage('terms', 'en')); count += 2;
  addUrl('/terms/', SCRIPT_DATE); addUrl('/en/terms/', SCRIPT_DATE);
  writeLegal('disclaimer/index.html', renderLegalPage('disclaimer', 'zh')); writeLegal('en/disclaimer/index.html', renderLegalPage('disclaimer', 'en')); count += 2;
  addUrl('/disclaimer/', SCRIPT_DATE); addUrl('/en/disclaimer/', SCRIPT_DATE);
  addUrl('/', SCRIPT_DATE); addUrl('/en/', SCRIPT_DATE);
  write('en/index.html', renderEnHome()); count++;
  // 404 页（Cloudflare 静态资源 not_found_handling: "404-page" 命中；不进 sitemap）
  write('404.html', renderNotFound()); count++;

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
  const llms = `# 栖居罗盘 · Habitat Compass

> 面向数字游民、自由职业者与远程工作者的海外城市定居决策工具。${CITIES.length} 座城市（六洲）+ 65 国参考数据；三层匹配引擎：硬约束过滤（预算/签证/安全）→ 核心匹配（偏好 42% + 人格 30% + 兴趣 18%，11 维）→ 加分项（RIASEC/风险联动/空气质量 ≤10%）。评分 0–99，缺失维度降权不惩罚，数据逐项标注来源。
> 核心测评（32 项人格量表 + 8 道情景题 + 16 个兴趣标签）免费、无需注册；可选的深度测评（IPIP-NEO 120 题 Big Five + RIASEC）与分级税负测算同样免费。
> 分级税负引擎（V2）：29 国按本币累进级距逐档测算，另含面向数字游民的特惠税制（泰国 LTR 17%、西班牙贝克汉姆法案 24%、格鲁吉亚 1%、葡萄牙 IFICI 20%、阿联酋/马来西亚/克罗地亚免税等），税率均为公开事实，不依赖任何付费聚合 API。

## 主要页面
- [首页 / 测评](${page('/')})
- [匹配方法论](${page('/methodology/')})
- [城市索引（${CITIES.length}）](${page('/cities/')})
- [国家索引（65）](${page('/countries/')})
- [税负测算 / Tax planner（65 国税制分类 + 29 国分级税率引擎）](${page('/tax-calculator/')})

## 城市页示例
- [成都](${page('/city/chengdu/')}) · [里斯本](${page('/city/lisbon/')}) · [清迈](${page('/city/chiang-mai/')}) · [Chengdu (EN)](${page('/en/city/chengdu/')})

## 国家页示例
- [葡萄牙](${page('/country/pt/')}) · [泰国](${page('/country/th/')}) · [Portugal (EN)](${page('/en/country/pt/')})

## 使用条款
- 数据快照逐页标注来源与日期；签证政策多变，以官方渠道为准；不构成投资/法律/移民建议。
- 联系方式与品牌 sameAs 预留位待部署后补充。
`;
  write('llms.txt', llms);

  // sitemap.xml —— 严格 sitemaps.org 0.9 最小格式：
  //   标准 XML 文件头 + 带命名空间的 <urlset> 根节点；
  //   每个 URL 只包裹 <loc>/<lastmod>/<changefreq>/<priority>，标签外无任何纯文本。
  //   语言互链由各页面 HTML 内的 <link rel="alternate" hreflang> 声明（zh/en 双向已在页面输出），
  //   故此处不再嵌入 xhtml:link，避免半侧声明导致 Google 判为无效。
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(({ p, lastmod }) => `  <url>
    <loc>${xmlEsc(page(p))}</loc>
    <lastmod>${xmlEsc(lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${p === '/' ? '1.0' : p.startsWith('/city') || p.startsWith('/country') ? '0.7' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`;
  assertSitemapWellFormed(sitemap);
  write('sitemap.xml', sitemap);

  console.log(`\n落地页生成完成：${count} 页 + robots.txt + llms.txt + sitemap.xml（${sitemapUrls.length} URL）→ dist/`);
  console.log(`域名：${DOMAIN}`);
}

main();

