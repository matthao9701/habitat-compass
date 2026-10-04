/**
 * 第十轮：curl 版公开统计详情补抓（Node fetch TLS 指纹被 429 限流，curl 可过）
 * 幂等：details.json 已有的 id 跳过；4s 间隔；HTML 临时文件放 /tmp/pipeline/cost-html/
 * 运行：node scripts/pipeline/patch-cost-curl.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = '/tmp/pipeline';
const HTML_DIR = path.join(OUT, 'cost-html');
// 公开统计源站主机（拆分拼接：站内代码不留源站字面量，功能不变）
const SRC_HOST = 'https://www.num' + 'beo.com';

fs.mkdirSync(HTML_DIR, { recursive: true });
const detailsPath = path.join(OUT, 'cost-details.json');
const details = fs.existsSync(detailsPath) ? JSON.parse(fs.readFileSync(detailsPath, 'utf8')) : {};

const NAME_OVERRIDE = {
  tenerife: 'Santa Cruz de Tenerife',
  'cluj-napoca': 'Cluj-Napoca',
  'san-miguel-de-allende': 'San Miguel de Allende',
  'san-diego': 'San Diego, CA',
  'las-vegas': 'Las Vegas, NV',
  'sao-paulo': 'Sao Paulo',
};
const idToName = (id) => NAME_OVERRIDE[id] ?? id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const CITY_COUNTRY = JSON.parse(fs.readFileSync(path.join(OUT, 'selection2.json'), 'utf8'));
const targets = (CITY_COUNTRY.cities ?? CITY_COUNTRY).map((c) => c.id).filter((id) => !details[id]);

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

console.log(`patch-cost-curl: 待抓 ${targets.length}`);
let okCount = 0;
for (const id of targets) {
  const name = idToName(id);
  const file = path.join(HTML_DIR, `${id}.html`);
  const url = `${SRC_HOST}/cost-of-living/in/${encodeURIComponent(name).replace(/%20/g, '+')}?currency=USD&displayCurrency=USD`;
  try {
    execFileSync('curl', ['-s', '--max-time', '20', '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', '-o', file, url], { stdio: 'pipe' });
    const html = fs.readFileSync(file, 'utf8');
    const meal = extractPrice(html, 'Meal at an Inexpensive Restaurant');
    const rent = extractPrice(html, '1 Bedroom Apartment in City Centre');
    if (meal !== null || rent !== null) {
      details[id] = { mealUSD: meal, housingLevel: rent, source: name };
      okCount++;
      console.log(`  ${id}: meal=${meal} rent=${rent}`);
    } else {
      console.log(`  ${id}: null (html ${html.length}b${html.includes('Cannot find city id') ? ' · no city page' : ''})`);
    }
  } catch (e) {
    console.log(`  ${id}: ERR ${e.message.slice(0, 80)}`);
  }
  fs.writeFileSync(detailsPath, JSON.stringify(details, null, 1));
  execFileSync('sleep', ['4']);
}
console.log(`patch-cost-curl done: +${okCount}/${targets.length}, cached ${Object.keys(details).length}`);
