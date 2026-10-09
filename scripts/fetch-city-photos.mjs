// ABOUTME: 为缺失实景图的城市补图（v2）：以该城市 Wikipedia 词条「导语主图」为准（唯一、无歧义），
// ABOUTME: 校验为可商用自由许可后裁切为 800px 宽 webp 写入 public/city-images/ 并登记署名。
// ABOUTME: 词条主图缺失/非横向/许可不合规时，使用下方 OVERRIDES 手工指定的 Commons 文件名（人工核验）。
// ABOUTME: 目标由 src/data/cities/*.json 自动推导（仅处理尚无图/署名的城市）；可选 argv[2] 传 {id,nameEn,wikiTitle} 覆盖。
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, 'public/city-images');
const CREDITS_PATH = path.join(IMG_DIR, 'credits.json');
const UA = 'HabitatCompass/1.0 (https://gethabitatcompass.com; contact hi@habitatcompass.com)';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

const credits = JSON.parse(fs.readFileSync(CREDITS_PATH, 'utf8'));

/** 无 argv 时由城市数据推导目标；仅有缺图或缺署名的城市才需要处理 */
function loadTargets() {
  if (process.argv[2]) return JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const dir = path.join(ROOT, 'src/data/cities');
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const cities = Array.isArray(parsed) ? parsed : parsed.cities ?? [];
    for (const c of cities) out.push({ id: c.id, nameEn: c.nameEn, wikiTitle: WIKI_TITLE[c.id] ?? c.nameEn });
  }
  return out;
}

/** 词条名与城市名不同（需消歧）的映射 */
const WIKI_TITLE = {
  victoria: 'Victoria, British Columbia',
  halifax: 'Halifax, Nova Scotia',
  maldonado: 'Maldonado, Uruguay',
  concepcion: 'Concepción, Chile',
  'la-serena': 'La Serena, Chile',
  curepipe: 'Curepipe',
};

// 人工指定的 Commons 原文件（优先于词条主图；均为已人工核验的城市实景/天际线）
const OVERRIDES = {
  'basel': 'File:Blick von der Mittleren. Brücke zur Grossbasler Altstadt (2023).jpg',
  'busan': 'File:Skyline of Busan Including Gwangan Bridge, Marine City and LCT Skyscrapers.jpg',
  'chennai': 'File:Chennai Skyline.jpg',
  'concepcion': 'File:Concepción (Chile).jpg',
  'daejeon': 'File:Daejeon Skyline.JPG',
  'dusseldorf': 'File:Düsseldorf (DE), Skyline von Oberkasseler Brücke -- 2023 -- 0023.jpg',
  'heraklion': 'File:Πανόραμα Ηρακλείου 8577.jpg',
  'kandy': 'File:Sri Lanka, Panorama of Kandy city on hills.jpg',
  'la-serena': 'File:Blick auf La Serena vom Cerro Grande.jpg',
  'lausanne': 'File:Vue Lausanne depuis la cathédrale.jpg',
  'lautoka': 'File:Lautoka Streets 22.jpg',
  'maldonado': 'File:Vista de La Barra desde La Gorgorita.JPG',
  'odense': 'File:Odense rådhus.jpg',
  'ostrava': 'File:Letecký pohled na Karolinu - panoramio.jpg',
  'plzen': 'File:Plzeň - Náměstí Republiky - Panorama view with Dům Anny Kreslové, Kašna Anděl, Renesanční radnice (City Hall) 1559 by Giovanni de Statia - Renaissance architecture - Císařský dům (Plzeň) - Marian column 1681 04.jpg',
  'queretaro': 'File:Vista aérea del Jardín Zenea, Querétaro.jpg',
  'szeged': 'File:Szeged - Belvárosi Mozi (30805881678).jpg',
  'uppsala': 'File:Västgöta Bridge over the Fyris river, Uppsala, Sweden julesvernex2.jpg',
};

function licenseAllowed(short) {
  if (!short) return false;
  if (/NC|ND|NonCommercial|NoDeriv/i.test(short)) return false;
  const s = short.trim();
  return /^CC0/i.test(s) || /^Public domain/i.test(s) || /^PD[- ]/i.test(s) ||
    /^CC BY(?:-SA)? ?\d/i.test(s) || /^CC BY(?:-SA)?$/i.test(s) || /^Attribution/i.test(s);
}
const aspectOk = (w, h) => { const r = w / h; return r >= 1.15 && r <= 2.4; };

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((res) => setTimeout(res, 1200 * (i + 1)));
    }
  }
}
const strip = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const fileTitleFromUrl = (url) => {
  if (!url) return null;
  const m = url.split('?')[0].match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+?)(?:\/\d+px-[^/]+)?$/);
  if (!m) return null;
  try { return 'File:' + decodeURIComponent(m[1]); } catch { return 'File:' + m[1]; }
};

async function commonsInfo(fileTitle) {
  const j = await getJson(`${COMMONS_API}?${new URLSearchParams({
    action: 'query', format: 'json', titles: fileTitle, prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', redirects: '1',
  })}`);
  const p = Object.values(j.query?.pages ?? {})[0];
  const ii = p?.imageinfo?.[0];
  if (!ii) return null;
  const em = ii.extmetadata ?? {};
  const short = em.LicenseShortName?.value ?? '';
  return {
    title: p.title, w: ii.width, h: ii.height, mime: ii.mime, url: ii.thumburl || ii.url,
    short, artist: strip(em.Artist?.value),
    licenseUrl: (em.LicenseUrl?.value && /^https?:/.test(em.LicenseUrl.value)) ? em.LicenseUrl.value
      : /CC0|Public domain|PD/i.test(short) ? 'https://creativecommons.org/publicdomain/zero/1.0/'
        : /by-sa/i.test(short) ? 'https://creativecommons.org/licenses/by-sa/4.0/'
          : 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: ii.descriptionurl,
  };
}

/** 取 Wikipedia 词条导语主图对应的 Commons 文件信息 */
async function leadImage(wikiTitle) {
  const j = await getJson(`${WIKI_API}?${new URLSearchParams({
    action: 'query', format: 'json', titles: wikiTitle, prop: 'pageimages', piprop: 'original', redirects: '1',
  })}`);
  const p = Object.values(j.query?.pages ?? {})[0];
  const ft = fileTitleFromUrl(p?.original?.source);
  if (!ft) return null;
  return commonsInfo(ft);
}

async function download(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('download HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 5000) throw new Error('too small');
  return buf;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { ok: [], manual: [], failed: [] };
const TARGETS = loadTargets();

for (const t of TARGETS) {
  const { id, nameEn, wikiTitle } = t;
  if (credits[id] && fs.existsSync(path.join(IMG_DIR, `${id}.webp`))) continue;
  let pick = null; let via = 'lead';
  if (OVERRIDES[id]) {
    try { const o = await commonsInfo(OVERRIDES[id]); if (o && licenseAllowed(o.short)) { pick = o; via = 'override'; } } catch { /* ignore */ }
  }
  if (!pick) {
    try { pick = await leadImage(wikiTitle || nameEn); if (pick) via = 'lead'; } catch { /* ignore */ }
  }
  if (!pick) { results.failed.push(`${id} (no image)`); await sleep(250); continue; }
  const good = licenseAllowed(pick.short) && aspectOk(pick.w, pick.h) && pick.w >= 900 && pick.h >= 600;
  if (!good) { results.failed.push(`${id} [${via}] (不合规: ${pick.short} ${pick.w}x${pick.h})`); await sleep(250); continue; }
  try {
    const buf = await download(pick.url);
    await sharp(buf).rotate().resize({ width: 800 }).webp({ quality: 78, effort: 5 })
      .toFile(path.join(IMG_DIR, `${id}.webp`));
    credits[id] = {
      file: `/city-images/${id}.webp`,
      artist: pick.artist || 'Wikimedia Commons contributor',
      license: pick.short, licenseUrl: pick.licenseUrl,
      source: 'Wikimedia Commons', sourceUrl: pick.sourceUrl,
    };
    results.ok.push(`${id} [${via}] ← ${pick.title} [${pick.short}]`);
    if (via === 'override') results.manual.push(id);
  } catch (e) { results.failed.push(`${id}(${e.message})`); }
  await sleep(300);
}

const sorted = Object.fromEntries(Object.keys(credits).sort().map((k) => [k, credits[k]]));
fs.writeFileSync(CREDITS_PATH, JSON.stringify(sorted, null, 2) + '\n');
console.log(`\n✔ 成功 ${results.ok.length}`);
results.ok.forEach((r) => console.log('   ' + r));
if (results.manual.length) console.log(`\n⚠ 人工指定：${results.manual.join(', ')}`);
if (results.failed.length) console.log(`\n✘ 待人工补 ${results.failed.length}：\n   ${results.failed.join('\n   ')}`);
