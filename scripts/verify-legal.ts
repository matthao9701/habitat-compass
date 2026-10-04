// ABOUTME: 第十三轮验证——法律页（隐私政策/用户协议 zh/en）产物要素 + SPA Footer 源码 + sitemap 收录
// ABOUTME: dist 缺失时自动先跑 scripts/generate-landing.mjs（幂等）
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

if (!fs.existsSync(path.join(DIST, 'cities'))) {
  console.log('dist 落地页缺失，先执行 generate-landing.mjs ...');
  const r = spawnSync('node', ['scripts/generate-landing.mjs'], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('generate-landing 失败');
    process.exit(1);
  }
}

function read(rel: string): string | null {
  const p = path.join(DIST, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

console.log('\n══ 一、4 个法律页存在与基础结构 ══');
const pages: Array<{ rel: string; lang: 'zh' | 'en'; kind: 'privacy' | 'terms' | 'disclaimer' }> = [
  { rel: 'privacy/index.html', lang: 'zh', kind: 'privacy' },
  { rel: 'en/privacy/index.html', lang: 'en', kind: 'privacy' },
  { rel: 'terms/index.html', lang: 'zh', kind: 'terms' },
  { rel: 'en/terms/index.html', lang: 'en', kind: 'terms' },
  { rel: 'disclaimer/index.html', lang: 'zh', kind: 'disclaimer' },
  { rel: 'en/disclaimer/index.html', lang: 'en', kind: 'disclaimer' },
];
const htmls: Record<string, string> = {};
for (const { rel } of pages) {
  const html = read(rel);
  htmls[rel] = html ?? '';
  check(`${rel} 存在`, html != null);
}
for (const { rel, lang, kind } of pages) {
  const html = htmls[rel];
  if (!html) continue;
  const canonical = `href="https://[^"]*/${lang === 'en' ? 'en/' : ''}${kind}/"`;
  check(`${rel} canonical 指向自身`, new RegExp(canonical).test(html));
  check(`${rel} hreflang 三档互链`, (html.match(/hreflang="/g) ?? []).length >= 3);
  check(`${rel} OG/Twitter 卡`, html.includes('og:title') && html.includes('twitter:card'));
  check(`${rel} lang 属性`, html.includes(lang === 'zh' ? '<html lang="zh-Hans">' : '<html lang="en">'));
  check(`${rel} JSON-LD 可解析`, (() => {
    const blocks = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) ?? [];
    if (blocks.length < 2) return false;
    try {
      for (const b of blocks) JSON.parse(b.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, ''));
      return blocks.some((b) => b.includes('"BreadcrumbList"'));
    } catch {
      return false;
    }
  })());
  check(`${rel} 零外链 JS/CSS（自包含）`, !html.includes('<script src=') && !html.includes('link rel="stylesheet"'));
}

console.log('\n══ 二、隐私政策关键要素（GDPR 信息义务） ══');
const PRIV_ZH: Array<[string, string]> = [
  ['控制者与占位邮箱', 'privacy@habitatcompass.app'],
  ['存储键披露', 'nomadmatch.v1'],
  ['法律基础 Art. 6(1)(b)', '6(1)(b)'],
  ['ePrivacy strictly necessary', 'strictly necessary'],
  ['无同意横幅声明', '不设 Cookie 同意横幅'],
  ['无追踪 Cookie', '无追踪 Cookie'],
  ['无第三方分析', '无第三方分析与广告'],
  ['无 AI 处理', '无 AI 模型处理'],
  ['仅设备本地存储', '没有任何数据上传到服务器'],
  ['无国际传输', '不存在国际数据传输'],
  ['保存期至用户清除', '直到你自行清除'],
  ['访问权 15', '第 15 条'],
  ['删除权 17', '第 17 条'],
  ['可携带权 20', '第 20 条'],
  ['反对权 21', '第 21 条'],
  ['监管机构申诉 77', '第 77 条'],
  ['30 天响应', '30 天内'],
  ['未成年人 16 岁 Art. 8', '16 周岁'],
  ['泄露 72 小时', '72 小时'],
  ['CCPA 补充', 'CCPA'],
  ['清除数据按钮', '清除我的所有数据'],
  ['eraseAll 最小 JS', 'function eraseAll'],
];
for (const [name, kw] of PRIV_ZH) check(`zh 隐私页：${name}`, htmls['privacy/index.html']?.includes(kw) ?? false, kw);
const PRIV_EN: Array<[string, string]> = [
  ['placeholder mailbox', 'privacy@habitatcompass.app'],
  ['key prefix disclosure', 'nomadmatch.v1'],
  ['Art. 6(1)(b)', 'Art. 6(1)(b)'],
  ['Art. 5(3) ePrivacy', 'Art. 5(3)'],
  ['strictly necessary', 'strictly necessary'],
  ['no consent banner', 'no consent banner'],
  ['no tracking cookies', 'No tracking cookies'],
  ['no analytics/ads', 'No third-party analytics'],
  ['no AI processing', 'No AI processing'],
  ['local only', 'Nothing is uploaded to any server'],
  ['no international transfer', 'no international data transfer'],
  ['retention until erase', 'until you erase it'],
  ['right of access Art. 15', 'right of access (Art. 15)'],
  ['erasure Art. 17', 'erasure (Art. 17)'],
  ['portability Art. 20', 'data portability (Art. 20)'],
  ['objection Art. 21', 'right to object (Art. 21)'],
  ['supervisory authority Art. 77', 'supervisory authority (Art. 77)'],
  ['30-day response', 'within'],
  ['children 16 Art. 8', 'under 16'],
  ['breach 72 hours', '72 hours'],
  ['CCPA/CPRA', 'CCPA/CPRA'],
  ['erase button', 'Erase all my data'],
  ['eraseAll JS', 'function eraseAll'],
];
for (const [name, kw] of PRIV_EN) check(`en 隐私页：${name}`, htmls['en/privacy/index.html']?.includes(kw) ?? false, kw);

console.log('\n══ 三、清除数据按钮实现正确性（nomadmatch.v1 前缀全删 + 反馈） ══');
for (const rel of ['privacy/index.html', 'en/privacy/index.html']) {
  const html = htmls[rel] ?? '';
  check(`${rel} 遍历 localStorage 键并按前缀过滤`, html.includes("indexOf('nomadmatch.v1:')"));
  check(`${rel} removeItem 逐键删除`, html.includes('removeItem'));
  check(`${rel} 清除后可见反馈`, html.includes('erase-done') && html.includes('hidden'));
  check(`${rel} noscript 降级提示`, html.includes('<noscript>'));
}
for (const rel of ['terms/index.html', 'en/terms/index.html']) {
  check(`${rel} 协议页不含清除按钮`, !(htmls[rel] ?? '').includes('function eraseAll'));
}

console.log('\n══ 四、用户协议关键要素 ══');
const TERMS_ZH: Array<[string, string]> = [
  ['as-is 免责', '现状'],
  ['非专业建议（九类）', '不构成移民、签证、居留、法律、税务、医疗、保险、财务或投资建议'],
  ['第三方快照可能过时', '可能过时或存在误差'],
  ['签证以官方渠道为准', '通过官方渠道核实'],
  ['责任限制', '责任限制'],
  ['全量免费（计费节已删）', '全部功能<strong>无需付费</strong>'],
  ['去品牌化：来源统一表述', '官方开放数据（Open Data）与公开统计测算'],
  ['GeoNames CC BY', 'GeoNames（CC BY 4.0）'],
  ['Open-Meteo CC BY', 'Open-Meteo'],
  ['OEJTS 许可', 'CC BY-NC-SA 4.0'],
  ['适用法域占位', '占位：待正式部署后补充法域与管辖条款'],
  ['无付费残留', '¥29.9|退款|撤回权|订单|计费|买断'],
];
for (const [name, kw] of TERMS_ZH) {
  if (name === '无付费残留') {
    check(`zh 协议页：${name}`, !new RegExp(kw).test(htmls['terms/index.html'] ?? ''), kw);
  } else {
    check(`zh 协议页：${name}`, htmls['terms/index.html']?.includes(kw) ?? false, kw);
  }
}
const TERMS_EN: Array<[string, string]> = [
  ['as-is', 'as is'],
  ['not professional advice (unified wording)', 'not immigration, visa, legal, tax, medical, or financial advice'],
  ['snapshots may be outdated', 'may be outdated or imprecise'],
  ['verify official channels', 'verify with official channels'],
  ['limitation of liability', 'Limitation of liability'],
  ['free of charge (billing removed)', 'free of charge'],
  ['open data wording', 'official open data & public statistical estimates'],
  ['GeoNames CC BY', 'GeoNames (CC BY 4.0)'],
  ['OEJTS licence', 'CC BY-NC-SA 4.0'],
  ['governing law placeholder', 'placeholder: jurisdiction and venue to be added'],
  ['no paid residue', '¥29\\.9|no refunds|withdrawal|orders|billing|one-time purchase'],
];
for (const [name, kw] of TERMS_EN) {
  if (name === 'no paid residue') {
    check(`en 协议页：${name}`, !new RegExp(kw).test(htmls['en/terms/index.html'] ?? ''), kw);
  } else {
    check(`en 协议页：${name}`, htmls['en/terms/index.html']?.includes(kw) ?? false, kw);
  }
}

console.log('\n══ 五、法律页互链与页脚链接 ══');
for (const { rel, lang, kind } of pages) {
  const html = htmls[rel] ?? '';
  const pre = lang === 'en' ? '/en' : '';
  const others = (['privacy', 'terms', 'disclaimer'] as const).filter((k) => k !== kind);
  check(`${rel} 互链其他法律页（${others.join('+')}）`, others.every((k) => html.includes(`href="${pre}/${k}/"`)));
}
check('zh 法律页返回首页链接', (htmls['privacy/index.html'] ?? '').includes('href="/"'));
check('en 法律页返回首页链接', (htmls['en/privacy/index.html'] ?? '').includes('href="/en/"'));

const footerSrc = [
  'src/components/Footer.tsx', 'src/App.tsx', 'src/i18n/dict/ui.ts',
].map((rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')).join('\n');
check('Footer 组件存在 /terms/ /privacy/ /disclaimer/ 链接', footerSrc.includes('/terms/') && footerSrc.includes('/privacy/') && footerSrc.includes('/disclaimer/'));
check('Footer 按语言切换前缀（base = en ? /en）', footerSrc.includes("lang === 'en' ? '/en' : ''"));
check('Footer 挂载于三 Tab 屏幕（TAB_SCREENS 判断）', fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8').includes('TAB_SCREENS.includes(screen) && <Footer />'));
check('ui 词典 zh：footer 三键', footerSrc.includes("'footer.terms': '用户协议'") && footerSrc.includes("'footer.privacy': '隐私政策'") && footerSrc.includes("'footer.disclaimer': '免责声明'"));
check('ui 词典 en：footer 三键', footerSrc.includes("'footer.terms': 'Terms of Service'") && footerSrc.includes("'footer.privacy': 'Privacy Policy'") && footerSrc.includes("'footer.disclaimer': 'Disclaimer'"));

console.log('\n══ 六、sitemap 收录 ══');
const sitemap = read('sitemap.xml') ?? '';
for (const u of ['/privacy/', '/terms/', '/disclaimer/', '/en/privacy/', '/en/terms/', '/en/disclaimer/']) {
  check(`sitemap 收录 ${u}`, new RegExp(`<loc>[^<]*${u}</loc>`).test(sitemap));
}
check('sitemap URL 总数 ≥544（536 + 6 法律页 + 首页×2）', (sitemap.match(/<url>/g) ?? []).length >= 544);
check('第十二轮产物未破坏：城市页仍 200×2', (() => {
  let n = 0;
  for (const rel of ['city/chengdu/index.html', 'en/city/chengdu/index.html', 'city/lisbon/index.html', 'en/city/lisbon/index.html']) {
    if (read(rel)) n++;
  }
  return n === 4;
})());

console.log('\n══ 七、免责声明页核心要素 ══');
const DISC_ZH: Array<[string, string]> = [
  ['信息参考非专业建议', '仅为信息参考'],
  ['九类建议枚举（含居留/保险）', '居留'],
  ['九类建议枚举（含保险）', '保险'],
  ['九类建议枚举（含移民/签证）', '移民、签证'],
  ['重大决策咨询专业机构', '请咨询当地专业机构'],
  ['以官方信息为准', '以政府与官方渠道发布的信息为准'],
  ['用户自担风险', '由你自行承担风险'],
  ['第三方快照', '时点快照'],
  ['快照日期标注', '标注快照日期'],
  ['不保证准确性完整性时效性', '准确性、完整性或时效性'],
  ['as-is', 'as-is'],
  ['as-available', 'as-available'],
  ['引用用户协议', '《用户协议》'],
  ['引用隐私政策', '《隐私政策》'],
];
for (const [name, kw] of DISC_ZH) check(`zh 免责页：${name}`, htmls['disclaimer/index.html']?.includes(kw) ?? false, kw);
const DISC_EN: Array<[string, string]> = [
  ['reference only', 'for information only'],
  ['advice enumeration', 'immigration, visa, legal, tax, medical, insurance, financial or investment advice'],
  ['consult professionals', 'consult local professionals'],
  ['official sources', 'official government sources'],
  ['own risk', 'at your own risk'],
  ['point-in-time snapshots', 'point-in-time snapshots'],
  ['snapshot date shown', 'snapshot date shown on each page'],
  ['no accuracy warranty', 'no warranty as to accuracy, completeness or timeliness'],
  ['as-is', 'as is'],
  ['as-available', 'as available'],
  ['refs Terms', 'Terms of Service'],
  ['refs Privacy', 'Privacy Policy'],
];
for (const [name, kw] of DISC_EN) check(`en 免责页：${name}`, htmls['en/disclaimer/index.html']?.includes(kw) ?? false, kw);

console.log('\n══ 八、付费系统全量下线（第十四轮：功能全免费开放） ══');
check('PayModal 组件已删除', !fs.existsSync(path.join(ROOT, 'src/components/billing/PayModal.tsx')));
check('ProIntro 组件已删除', !fs.existsSync(path.join(ROOT, 'src/components/billing/ProIntro.tsx')));
const spaSrc = ['src/App.tsx', 'src/components/Landing.tsx', 'src/components/ProfileScreen.tsx', 'src/components/VersionPicker.tsx', 'src/lib/storage.ts', 'src/lib/telemetry.ts']
  .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))
  .join('\n');
for (const token of ['proUnlocked', 'createProOrder', 'resetBilling', 'PRO_PRICE_CNY', 'PayChannel', 'ProOrder', 'PayModal', 'ProIntro', 'pro_intro_view', 'pay_click', 'unlock_success']) {
  check(`SPA 无付费残留：${token}`, !spaSrc.includes(token), token);
}
const dictSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/dict/ui.ts'), 'utf8') + fs.readFileSync(path.join(ROOT, 'src/i18n/dict/extra.ts'), 'utf8');
for (const token of ["'bill.", "'pi.", 'pf.orders', 'pf.pro', 'proIntro', 'unlockCta', '29.9']) {
  check(`词典无付费残留：${token}`, !dictSrc.includes(token), token);
}

console.log('\n══ 九、合规扫描（商标词/命名/外链/署名） ══');
// 9.1 全 dist 无第三方脚本外链
function walkHtml(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkHtml(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const allHtml = walkHtml(DIST);
const externalScript = allHtml.filter((p) => /<script[^>]+src="https?:\/\//.test(fs.readFileSync(p, 'utf8')));
check(`dist 全部 ${allHtml.length} 个 HTML 无第三方 <script src="http...">`, externalScript.length === 0, externalScript.slice(0, 3).join(', '));
// 9.2 全 dist 无商标词（用户可见层）
const trademark = allHtml.filter((p) => /MBTI|Myers|Briggs|16personalities/i.test(fs.readFileSync(p, 'utf8')));
check('dist 全部 HTML 无 MBTI/Myers-Briggs/16Personalities 商标词', trademark.length === 0, trademark.slice(0, 3).map((p) => path.relative(ROOT, p)).join(', '));
// 9.3 全 dist 无弃用品牌名 Siju
const siju = allHtml.filter((p) => fs.readFileSync(p, 'utf8').includes('Siju'));
check('dist 全部 HTML 无弃用命名 "Siju"（已统一 Habitat Compass）', siju.length === 0, siju.slice(0, 3).join(', '));
// 9.0 受限商业源品牌（拼接构造，避免本文件自身在全库 grep 中命中）
const NB = ['num', 'beo'].join('');
const BRANDED_UNDERSCORE = 'nb' + '_';
const BRANDED_RE = new RegExp(`${NB}|ookla|ef epi`, 'i');
// 9.4 全 dist 无受限商业数据源品牌（去品牌化口径）
const braded = allHtml.filter((p) => BRANDED_RE.test(fs.readFileSync(p, 'utf8')));
check(`dist 全部 ${allHtml.length} 个 HTML 无受限商业源品牌`, braded.length === 0, braded.slice(0, 3).map((p) => path.relative(ROOT, p)).join(', '));
// 9.4 方法论页署名要素（CC BY 4.0 需作者/源/许可链接）
const methZh = htmls['methodology/index.html'] ?? read('methodology/index.html') ?? '';
const methEn = read('en/methodology/index.html') ?? '';
for (const [tag, html] of [['zh', methZh], ['en', methEn]] as const) {
  check(`方法论页(${tag})：O*NET 低调署名行（页底）`, html.includes('Career interest framework: O*NET Interest Profiler Short Form') && /Career interest framework[\s\S]{0,200}creativecommons\.org\/licenses\/by\/4\.0/.test(html));
    check(`方法论页(${tag})：无受限商业源品牌`, !BRANDED_RE.test(html));
  check(`方法论页(${tag})：GeoNames/Open-Meteo/World Bank 带 CC BY 4.0 许可链接`, (html.match(/creativecommons\.org\/licenses\/by\/4\.0/g) ?? []).length >= 3);
  check(`方法论页(${tag})：源站链接（geonames/open-meteo，去品牌化）`, html.includes('geonames.org') && html.includes('open-meteo.com') && !html.includes(NB + '.com'));
  check(`方法论页(${tag})：字体 OFL 声明`, html.includes('SIL Open Font License 1.1') && html.includes('Noto Sans SC'));
}
// 9.5 法律页 dev 可达（public 同步）
for (const rel of ['privacy/index.html', 'terms/index.html', 'disclaimer/index.html', 'en/privacy/index.html', 'en/terms/index.html', 'en/disclaimer/index.html']) {
  check(`public/${rel} 存在（dev 模式直达无 404）`, fs.existsSync(path.join(ROOT, 'public', rel)));
}
// 9.6 全库零命中：源码/数据/词典无受限商业源命名与变量标记（第十三轮深化）
{
  const BRANDED_WORD_RE = new RegExp(NB, 'i');
  const scanExts = new Set(['.ts', '.tsx', '.mjs', '.json', '.html']);
  const hits: string[] = [];
  const walk = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (scanExts.has(path.extname(e.name))) {
        const s = fs.readFileSync(p, 'utf8');
        if (BRANDED_WORD_RE.test(s) || s.includes(BRANDED_UNDERSCORE)) hits.push(path.relative(ROOT, p));
      }
    }
  };
  for (const dir of ['src', 'scripts', 'server']) walk(path.join(ROOT, dir));
  check('src/scripts/server 全库无受限商业源命名与变量标记（/i 零命中）', hits.length === 0, hits.slice(0, 5).join(', '));
  const dataJson = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'].map((c) => `src/data/cities/${c}.json`);
  const countryRaw = fs.readFileSync(path.join(ROOT, 'src/data/countries.json'), 'utf8');
  check('countries.json 通用字段命名（safetyScore/healthcareScore/qolScore 等）', countryRaw.includes('"safetyScore"') && countryRaw.includes('"healthcareScore"') && countryRaw.includes('"qolScore"') && !countryRaw.includes(NB));
  check('cities JSON 通用字段命名（livingScore/housingLevel/englishBand）', dataJson.every((f) => {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    return s.includes('"livingScore"') && s.includes('"housingLevel"') && s.includes('"englishBand"');
  }));
}

console.log('\n══ 十、sitemap 全量 URL → dist 文件存在（200 等价断言） ══');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check('sitemap loc 总数 ≥544', locs.length >= 544);
let missing = 0;
const missingSample: string[] = [];
for (const loc of locs) {
  const p = loc.replace(/^https?:\/\/[^/]+/, '');
  const rel = p === '/' || p === '' ? 'index.html' : p.endsWith('/') ? `${p}index.html` : p;
  if (!fs.existsSync(path.join(DIST, rel))) {
    missing++;
    if (missingSample.length < 5) missingSample.push(rel);
  }
}
check(`sitemap 全量 ${locs.length} URL 对应 dist 文件存在（全部可 200）`, missing === 0, missingSample.join(', '));

console.log(`\n════════ verify-legal: ${passed} passed, ${failed.length} failed ════════`);
if (failed.length) {
  console.log('失败项：');
  for (const f of failed) console.log(`  - ${f}`);
  process.exit(1);
}
