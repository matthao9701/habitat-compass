// ABOUTME: 第十二轮 SEO/GEO 验证——落地页生成完整性/内容要素/JSON-LD/robots/llms/sitemap/hreflang
// ABOUTME: 依赖 dist/ 产物；dist 缺失时自动先跑 scripts/generate-landing.mjs（幂等）
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

let passed = 0;
const failed: string[] = [];
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed.push(`${name}${detail ? `（${detail}）` : ''}`);
    console.log(`  ✗ ${name}${detail ? `（${detail}）` : ''}`);
  }
}

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

// dist 缺失时自动生成（generate-landing 只读 src/data 与 tailwind.config，不依赖 vite build）
if (!fs.existsSync(path.join(DIST, 'cities'))) {
  console.log('dist 落地页缺失，先执行 generate-landing.mjs ...');
  const r = spawnSync('node', ['scripts/generate-landing.mjs'], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('generate-landing 失败');
    process.exit(1);
  }
}

const CONTINENTS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'] as const;
const CITIES = CONTINENTS.flatMap((r) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, `src/data/cities/${r}.json`), 'utf8')),
);
const COUNTRIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/countries.json'), 'utf8'));

function read(rel: string): string | null {
  const p = path.join(DIST, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function jsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push(JSON.parse(m[1]));
  }
  return out;
}

console.log('\n=== 1. 生成完整性（每城 ×2 语言 + 国家页 + 索引）===');
const cityDirs = fs.existsSync(path.join(DIST, 'city')) ? fs.readdirSync(path.join(DIST, 'city')) : [];
const enCityDirs = fs.existsSync(path.join(DIST, 'en/city')) ? fs.readdirSync(path.join(DIST, 'en/city')) : [];
const countryDirs = fs.existsSync(path.join(DIST, 'country')) ? fs.readdirSync(path.join(DIST, 'country')) : [];
const enCountryDirs = fs.existsSync(path.join(DIST, 'en/country')) ? fs.readdirSync(path.join(DIST, 'en/country')) : [];
check(`城市页 ${CITIES.length}（实 ${cityDirs.length}）`, cityDirs.length === CITIES.length);
check(`城市页 EN ${CITIES.length}（实 ${enCityDirs.length}）`, enCityDirs.length === CITIES.length);
check(`国家页 65（实 ${countryDirs.length}）`, countryDirs.length === 65);
check(`国家页 EN 65（实 ${enCountryDirs.length}）`, enCountryDirs.length === 65);
check('索引页 ×4（cities/countries zh+en）', ['cities/index.html', 'en/cities/index.html', 'countries/index.html', 'en/countries/index.html'].every((p) => read(p) !== null));
check('方法论页 ×2', read('methodology/index.html') !== null && read('en/methodology/index.html') !== null);

console.log(`\n=== 2. 城市页内容要素（全量 ${CITIES.length}）===`);
let cityOk = 0;
const cityMiss: string[] = [];
for (const c of CITIES) {
  const html = read(`city/${c.id}/index.html`);
  const ok =
    html !== null &&
    html.includes(`rel="canonical"`) &&
    html.includes('FAQPage') &&
    html.includes('BreadcrumbList') &&
    html.includes('来源') &&
    html.includes('<details>') &&
    html.includes(c.nameZh) &&
    html.includes('hreflang="zh-Hans"') &&
    html.includes('hreflang="en"') &&
    html.includes('hreflang="x-default"') &&
    jsonLdBlocks(html).length >= 2;
  if (ok) cityOk++;
  else cityMiss.push(c.id);
}
check(`${CITIES.length} 城页要素齐全（通过 ${cityOk}/${CITIES.length}）`, cityOk === CITIES.length, cityMiss.slice(0, 5).join(','));

let enCityOk = 0;
const enCityMiss: string[] = [];
for (const c of CITIES) {
  const html = read(`en/city/${c.id}/index.html`);
  const ok =
    html !== null &&
    html.includes(c.nameEn) &&
    html.includes('rel="canonical"') &&
    jsonLdBlocks(html).length >= 2;
  if (ok) enCityOk++;
  else enCityMiss.push(c.id);
}
check(`${CITIES.length} 城页 EN meta+直答（通过 ${enCityOk}/${CITIES.length}）`, enCityOk === CITIES.length, enCityMiss.slice(0, 5).join(','));

console.log('\n=== 3. null 不编造 ===');
const nullCostCities = CITIES.filter((c) => c.monthlyCostUSD == null);
check(`无成本城存在 ${nullCostCities.length} 座（数据真实性前提）`, nullCostCities.length > 0);
if (nullCostCities.length > 0) {
  const c = nullCostCities[0];
  const html = read(`city/${c.id}/index.html`) ?? '';
  check(`${c.id}（无成本）直答段不含「月生活成本约 $」编造`, !html.includes('月生活成本约 $'));
  check(`${c.id}（无成本）页含「待核实/待补充」措辞`, html.includes('待核实') || html.includes('待补充'));
  const faqMatch = html.match(/生活成本多少？<\/summary><p>([\s\S]*?)<\/p>/);
  check(`${c.id}（无成本）成本 FAQ 不编造数字`, !!faqMatch && !/\$\d/.test(faqMatch[1].replace('生活成本多少', '')));
}

console.log('\n=== 4. 国家页内容要素（全量 65）===');
let coOk = 0;
const coMiss: string[] = [];
for (const co of COUNTRIES) {
  const html = read(`country/${co.code.toLowerCase()}/index.html`);
  const ok =
    html !== null &&
    html.includes(co.nameZh) &&
    html.includes('FAQPage') &&
    html.includes('World Bank') &&
    jsonLdBlocks(html).length >= 2;
  if (ok) coOk++;
  else coMiss.push(co.code);
}
check(`65 国页要素齐全（通过 ${coOk}/65）`, coOk === 65, coMiss.slice(0, 5).join(','));

console.log('\n=== 5. 索引页与方法论页 ===');
const citiesIdx = read('cities/index.html') ?? '';
check(`城市索引含全部 ${CITIES.length} 城 zh 链接`, CITIES.every((c) => citiesIdx.includes(`/city/${c.id}/`)));
check('城市索引按大洲分组', CONTINENTS.every(() => citiesIdx.includes('<h2>')));
const countriesIdx = read('countries/index.html') ?? '';
check('国家索引含全部 65 国 zh 链接', COUNTRIES.every((c) => countriesIdx.includes(`/country/${c.code.toLowerCase()}/`)));
const meth = read('methodology/index.html') ?? '';
check('方法论含三层权重数字', meth.includes('42%') && meth.includes('30%') && meth.includes('18%') && meth.includes('0.86') && meth.includes('0.14'));
check('方法论含数据许可署名', meth.includes('CC BY 4.0') && meth.includes('原创 SJT') && meth.includes('WHO') && !meth.includes(['num', 'beo'].join('')));
check('方法论含更新频率与免责声明', meth.includes('更新频率') && meth.includes('不构成'));

console.log('\n=== 6. JSON-LD 全量可解析 ===');
let ldOk = 0;
let ldTotal = 0;
const ldMiss: string[] = [];
const allPages: string[] = [];
for (const c of CITIES) allPages.push(`city/${c.id}/index.html`, `en/city/${c.id}/index.html`);
for (const co of COUNTRIES) allPages.push(`country/${co.code.toLowerCase()}/index.html`, `en/country/${co.code.toLowerCase()}/index.html`);
allPages.push('cities/index.html', 'en/cities/index.html', 'countries/index.html', 'en/countries/index.html', 'methodology/index.html', 'en/methodology/index.html');
for (const p of allPages) {
  const html = read(p);
  if (html === null) {
    ldMiss.push(p);
    continue;
  }
  ldTotal++;
  try {
    jsonLdBlocks(html);
    ldOk++;
  } catch (e) {
    ldMiss.push(p);
  }
}
check(`JSON-LD 可解析（${ldOk}/${ldTotal}）`, ldOk === ldTotal && ldMiss.length === 0, ldMiss.slice(0, 3).join(','));

console.log('\n=== 7. robots.txt / llms.txt / sitemap.xml ===');
const robots = read('robots.txt') ?? '';
for (const bot of ['OAI-SearchBot', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot', 'Googlebot', 'Applebot-Extended']) {
  check(`robots.txt Allow ${bot}`, robots.includes(`User-agent: ${bot}`));
}
check('robots.txt 含 Sitemap 指引', /Sitemap: https?:\/\//.test(robots));
const llms = read('llms.txt') ?? '';
check('llms.txt 以 H1 开头', llms.startsWith('# '));
check('llms.txt 含方法论/索引链接', llms.includes('/methodology/') && llms.includes('/cities/') && llms.includes('/countries/'));
check(`llms.txt 含规模数据（${CITIES.length} 城/65 国）`, llms.includes(String(CITIES.length)) && llms.includes('65'));
check('llms.txt 含引擎口径（三层权重）', llms.includes('42%') && llms.includes('30%') && llms.includes('18%'));
const sitemap = read('sitemap.xml') ?? '';
const urlCount = (sitemap.match(/<url>/g) ?? []).length;
const expectedMin = CITIES.length * 2 + COUNTRIES.length * 2 + 6;
check(`sitemap URL ≥ ${expectedMin}（实 ${urlCount}）`, urlCount >= expectedMin);
check('sitemap XML 声明与命名空间', sitemap.includes('<?xml version="1.0"') && sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
check('sitemap 含 zh 与 en 分区', sitemap.includes('/city/') && sitemap.includes('/en/city/') && sitemap.includes('/methodology/'));
check('sitemap 全量城市覆盖', CITIES.every((c) => sitemap.includes(`/city/${c.id}/`) && sitemap.includes(`/en/city/${c.id}/`)));

console.log('\n=== 8. hreflang 双语互链 ===');
const cd = read('city/chengdu/index.html') ?? '';
const cdEn = read('en/city/chengdu/index.html') ?? '';
const domain = (cd.match(/hreflang="en" href="([^"]+)"/) ?? [])[1] ?? '';
check('zh 页含指向 en 的 hreflang', domain.endsWith('/en/city/chengdu/'));
check('en 页含指向 zh 的 hreflang', (cdEn.match(/hreflang="zh-Hans" href="([^"]+)"/) ?? [])[1]?.endsWith('/city/chengdu/') ?? false);
check('x-default 指向 zh', (cd.match(/hreflang="x-default" href="([^"]+)"/) ?? [])[1]?.endsWith('/city/chengdu/') ?? false);

console.log('\n=== 9. 主站 index.html JSON-LD ===');
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const idxLd = idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
check('主站含 ld+json 块', !!idxLd);
if (idxLd) {
  const graph = JSON.parse(idxLd[1]) as { '@graph': { '@type': string }[] };
  check('主站 JSON-LD 含 Organization + WebApplication', Array.isArray(graph['@graph']) && graph['@graph'].some((g) => g['@type'] === 'Organization') && graph['@graph'].some((g) => g['@type'] === 'WebApplication'));
}

console.log(`\n════════ verify-seo-v9: ${passed} passed, ${failed.length} failed ════════`);
if (failed.length > 0) {
  console.log('失败项:');
  for (const f of failed) console.log(`  - ${f}`);
  process.exit(1);
}
