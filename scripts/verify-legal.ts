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
  ['控制者与联系邮箱', 'hi@habitatcompass.com'],
  ['存储键披露', 'nomadmatch.v1'],
  ['法律基础 Art. 6(1)(b)', '6(1)(b)'],
  ['ePrivacy strictly necessary', 'strictly necessary'],
  ['无同意横幅声明', '不设 Cookie 同意横幅'],
  ['无追踪 Cookie', '无追踪 Cookie'],
  ['无第三方分析', '无第三方分析与广告'],
  ['AEO 爬虫披露（非"无 AI"绝对声明）', 'GPTBot / ClaudeBot / PerplexityBot'],
  ['仅设备本地存储', '没有任何数据上传到服务器'],
  ['无国际传输', '不存在国际数据传输'],
  ['保存期至用户清除', '直到你自行清除'],
  ['访问权 15', '第 15 条'],
  ['更正权 16', '第 16 条'],
  ['删除权 17', '第 17 条'],
  ['限制处理权 18', '第 18 条'],
  ['可携带权 20', '第 20 条'],
  ['反对权 21', '第 21 条'],
  ['监管机构申诉 77', '第 77 条'],
  ['30 天响应', '30 天内'],
  ['未成年人 16 岁 Art. 8', '16 周岁'],
  ['泄露 72 小时', '72 小时'],
  ['数据共享/披露节', '数据共享与披露'],
  ['第三方链接节', '第三方链接'],
  ['CCPA 补充', 'CCPA'],
  ['清除数据按钮', '清除我的所有数据'],
  ['eraseAll 最小 JS', 'function eraseAll'],
];
for (const [name, kw] of PRIV_ZH) check(`zh 隐私页：${name}`, htmls['privacy/index.html']?.includes(kw) ?? false, kw);
const PRIV_EN: Array<[string, string]> = [
  ['contact mailbox', 'hi@habitatcompass.com'],
  ['key prefix disclosure', 'nomadmatch.v1'],
  ['Art. 6(1)(b)', 'Art. 6(1)(b)'],
  ['Art. 5(3) ePrivacy', 'Art. 5(3)'],
  ['strictly necessary', 'strictly necessary'],
  ['no consent banner', 'no consent banner'],
  ['no tracking cookies', 'No tracking cookies'],
  ['no analytics/ads', 'No third-party analytics'],
  ['AEO crawler disclosure (non-absolute "no AI")', 'GPTBot / ClaudeBot / PerplexityBot'],
  ['local only', 'Nothing is uploaded to any server'],
  ['no international transfer', 'no international data transfer'],
  ['retention until erase', 'until you erase it'],
  ['right of access Art. 15', 'right of access (Art. 15)'],
  ['rectification Art. 16', 'rectification (Art. 16)'],
  ['erasure Art. 17', 'erasure (Art. 17)'],
  ['restriction Art. 18', 'restriction of processing (Art. 18)'],
  ['portability Art. 20', 'data portability (Art. 20)'],
  ['objection Art. 21', 'right to object (Art. 21)'],
  ['supervisory authority Art. 77', 'supervisory authority (Art. 77)'],
  ['30-day response', 'within'],
  ['children 16 Art. 8', 'under 16'],
  ['breach 72 hours', '72 hours'],
  ['sharing & disclosure section', 'Sharing &amp; disclosure'],
  ['third-party links section', 'Third-party links'],
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
  ['协议接受要件', '即表示你已阅读、理解并同意受本协议约束'],
  ['最低年龄 16', '年满 <strong>16 周岁</strong>'],
  ['as-is 免责', '现状'],
  ['非专业建议（九类）', '不构成移民、签证、居留、法律、税务、医疗、保险、财务或投资建议'],
  ['第三方快照可能过时', '可能过时或存在误差'],
  ['签证以官方渠道为准', '通过官方渠道核实'],
  ['责任限制', '责任限制'],
  ['赔偿条款', '赔偿并使其免受损害'],
  ['可分割性', '可分割性'],
  ['全量免费（计费节已删）', '无需付费'],
  ['无账号声明', '无需注册账号'],
  ['去品牌化：来源统一表述', '官方开放数据（Open Data）与公开统计测算'],
  ['GeoNames CC BY', 'GeoNames（CC BY 4.0）'],
  ['Open-Meteo CC BY', 'Open-Meteo'],
  ['OEJTS 许可', 'CC BY-NC-SA 4.0'],
  ['字体 OFL 署名', 'SIL Open Font License'],
  ['适用法域（运营者主要经营地）', '运营者主要经营地所在法域的法律'],
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
  ['acceptance clause', 'you have read, understood and agree to be bound'],
  ['minimum age 16', 'at least <strong>16 years old</strong>'],
  ['as-is', 'as is'],
  ['not professional advice (unified wording)', 'not immigration, visa, legal, tax, medical, insurance, financial or investment advice'],
  ['snapshots may be outdated', 'may be outdated or imprecise'],
  ['verify official channels', 'verify with official channels'],
  ['limitation of liability', 'Limitation of liability'],
  ['indemnification', 'indemnify and hold the operator harmless'],
  ['severability', 'Severability'],
  ['free of charge (billing removed)', 'free of charge'],
  ['no account', 'no account'],
  ['open data wording', 'official open data & public statistical estimates'],
  ['GeoNames CC BY', 'GeoNames (CC BY 4.0)'],
  ['OEJTS licence', 'CC BY-NC-SA 4.0'],
  ['typeface OFL attribution', 'SIL Open Font License'],
  ['governing law (operator principal place)', 'law of the jurisdiction where the operator is principally established'],
  ['no paid residue', '¥29\\.9|no refunds|withdrawal|orders|billing|one-time purchase'],
];
for (const [name, kw] of TERMS_EN) {
  if (name === 'no paid residue') {
    check(`en 协议页：${name}`, !new RegExp(kw).test(htmls['en/terms/index.html'] ?? ''), kw);
  } else {
    check(`en 协议页：${name}`, htmls['en/terms/index.html']?.includes(kw) ?? false, kw);
  }
}

console.log('\n══ 四之二、法务文本结构升级（摘要条 / 目录 / CC BY-SA 署名） ══');
for (const rel of ['privacy/index.html', 'en/privacy/index.html', 'terms/index.html', 'en/terms/index.html']) {
  const html = htmls[rel] ?? '';
  check(`${rel} 含摘要条 .notice`, html.includes('class="notice"'));
  check(`${rel} 含目录 nav.toc + 锚点`, html.includes('class="toc"') && html.includes('href="#s0"'));
  check(`${rel} 含 CC BY-SA 4.0 开源模板署名`, html.includes('creativecommons.org/licenses/by-sa/4.0') && html.includes('Legalmattic'));
  check(`${rel} 章节均有 id 锚点`, (html.match(/<h2 id="s\d+">/g) ?? []).length >= 10);
}
check('zh 隐私页披露"无账号/无服务器"立场', (htmls['privacy/index.html'] ?? '').includes('没有账号体系、没有服务器端数据库'));
check('en 隐私页 disclose no-account stance', (htmls['en/privacy/index.html'] ?? '').includes('no server-side database'));
check('免责页不含目录（短文本）', !(htmls['disclaimer/index.html'] ?? '').includes('class="toc"'));

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

// 融合页脚：Landing 不再自绘 footer，全站仅一处 Footer 渲染，数据/字体许可收敛进法律区
const landingSrc = fs.readFileSync(path.join(ROOT, 'src/components/Landing.tsx'), 'utf8');
check('Landing 不再自绘内联 footer（消除重复堆叠）', !landingSrc.includes('landing.footer.'));
check('Landing 不再引用已移除的 landing.footer.* 键', !landingSrc.includes('landing.footer.data') && !landingSrc.includes('landing.footer.fonts'));
check('Footer 含方法论链接与数据许可归纳链接', footerSrc.includes('/methodology/') && footerSrc.includes('footer.attribution'));
check('ui 词典 zh：footer.methodology/attribution 齐备', footerSrc.includes("'footer.methodology': '方法论'") && footerSrc.includes("'footer.attribution':"));
check('ui 词典 en：footer.methodology/attribution 齐备', footerSrc.includes("'footer.methodology': 'Methodology'") && footerSrc.includes("'footer.attribution':"));
check('landing.footer.* 死键已清除', !footerSrc.includes("'landing.footer.brand'") && !footerSrc.includes("'landing.footer.fonts'") && !footerSrc.includes("'landing.footer.data'"));
check('Footer 单一渲染锚点（App 每次仅 <Footer /> 一处）', (fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8').match(/<Footer\b/g) ?? []).length === 1);

console.log('\n══ 六、sitemap 收录 ══');
const sitemap = read('sitemap.xml') ?? '';
for (const u of ['/privacy/', '/terms/', '/disclaimer/', '/en/privacy/', '/en/terms/', '/en/disclaimer/']) {
  check(`sitemap 收录 ${u}`, new RegExp(`<loc>[^<]*${u}</loc>`).test(sitemap));
}
check('sitemap URL 总数 ≥678（270×2 城 + 65×2 国 + 索引/方法论/首页×2）', (sitemap.match(/<url>/g) ?? []).length >= 678);
check('扩容后城市页抽样仍在', (() => {
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
const spaSrc = ['src/App.tsx', 'src/components/Landing.tsx', 'src/components/ProfileScreen.tsx', 'src/components/Quiz.tsx', 'src/lib/storage.ts', 'src/lib/telemetry.ts']
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
  check(`方法论页(${tag})：字体 OFL 声明`, html.includes('SIL Open Font License 1.1') && html.includes('Manrope'));
}
// 9.5 法律页 dev 可达（public 同步）
for (const rel of ['privacy/index.html', 'terms/index.html', 'disclaimer/index.html', 'en/privacy/index.html', 'en/terms/index.html', 'en/disclaimer/index.html']) {
  check(`public/${rel} 存在（dev 模式直达无 404）`, fs.existsSync(path.join(ROOT, 'public', rel)));
}
// 9.5b 缓存响应头：带哈希的构建产物强缓存，HTML/索引保持回源校验（子页提速）
{
  const hdrPath = fs.existsSync(path.join(ROOT, 'public/_headers')) ? path.join(ROOT, 'public/_headers') : path.join(DIST, '_headers');
  const hdr = fs.existsSync(hdrPath) ? fs.readFileSync(hdrPath, 'utf8') : '';
  check('dist/_headers 已随构建产物下发', fs.existsSync(path.join(DIST, '_headers')));
  check('_headers：/assets/* 长期 immutable 强缓存', /\/assets\/\*[\s\S]{0,120}max-age=31536000, immutable/.test(hdr));
  check('_headers：HTML 页面 max-age=0 must-revalidate（发布即可见）', /\/\*\.html[\s\S]{0,120}max-age=0, must-revalidate/.test(hdr));
  check('_headers：城市实景图缓存 30 天', /\/city-images\/\*[\s\S]{0,120}max-age=2592000/.test(hdr));
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

console.log('\n══ 十一、Ko-fi 打赏入口（原生按钮 + 页脚直链；静态页保持自包含） ══');
{
  const kofiSrc = fs.readFileSync(path.join(ROOT, 'src/components/KofiWidget.tsx'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
  check('KofiWidget 组件存在并挂载于 App 入口', appSrc.includes('<KofiWidget />') && appSrc.includes("from './components/KofiWidget'"));
  check('发版韧性：懒加载 chunk 失败自动刷新一次（防旧哈希 404 卡死）', appSrc.includes('lazyWithReload') && appSrc.includes('hc:chunk-reload') && appSrc.includes('window.location.reload()'));
  check('零第三方脚本：不再注入官方 overlay-widget.js', !kofiSrc.includes('overlay-widget.js') && !kofiSrc.includes('kofiWidgetOverlay') && !kofiSrc.includes('document.createElement'));
  check('Ko-fi 用户名已配置为真实 ID（非占位符）', /const KOFI_ID(?::\s*string)?\s*=\s*'(?!YOUR_KOFI_ID')[^']+'/.test(kofiSrc));
  check('直链在新标签打开（target=_blank + noopener/noreferrer）', /target="_blank"[\s\S]{0,60}rel="noopener noreferrer"/.test(kofiSrc));
  check('层级收口：z-[45] 低于 PWA 卡（50）、高于正文', kofiSrc.includes('z-[45]'));
  check('移动端安全区：bottom 留 safe-area-inset-bottom', kofiSrc.includes('safe-area-inset-bottom'));
  check('体积收敛：圆形按钮按触控最小可点面积（h-11 w-11 = 44px）', kofiSrc.includes('h-11 w-11'));
  check('旧 iframe 浮窗样式覆盖已移除（index.css 无 floatingchat 残留）', !/floatingchat/i.test(cssSrc));
  // 页脚兜底入口：SPA 页脚 + 静态页脚均提供「纯 <a> 直链」，不依赖第三方脚本
  const footerSrc = fs.readFileSync(path.join(ROOT, 'src/components/Footer.tsx'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/dict/ui.ts'), 'utf8');
  const genSrc = fs.readFileSync(path.join(ROOT, 'scripts/generate-landing.mjs'), 'utf8');
  check('SPA 页脚含 Ko-fi 直链兜底入口（noopener/noreferrer）', /href="https:\/\/ko-fi\.com\/matthao9701"[\s\S]{0,80}rel="noopener noreferrer"/.test(footerSrc));
  check('i18n 提供打赏入口文案（zh/en）', uiSrc.includes("'footer.support': '请我喝杯咖啡'") && uiSrc.includes("'footer.support': 'Buy me a coffee'"));
  check('静态页脚注入 Ko-fi 直链（generator，纯 <a> 无脚本）', genSrc.includes('https://ko-fi.com/matthao9701') && genSrc.includes('class="support-link"'));
  // 第十七轮页脚轻量化：移除页脚大胶囊赞助按钮，改为「一行轻量赞助引导 + 文字按钮」；
  // 法律合规由大胶囊改为紧凑横向文字链；用户点过打赏入口后页脚引导自动收起。
  check('页脚移除大胶囊赞助按钮（旧 footer.support 胶囊已删）', !/t\('footer\.support'\)/.test(footerSrc));
  check('页脚赞助引导为轻量文案 + 文字按钮（indieLead + indieCta）', footerSrc.includes("t('footer.indieLead')") && footerSrc.includes("t('footer.indieCta')"));
  check('页脚法律链接为紧凑文字排版（legal-links 语义类）', footerSrc.includes('hover:text-ink hover:underline') && !/rounded-full border hairline bg-card px-4 py-2/.test(footerSrc));
  check('页脚赞助引导在点击打赏后收起（supportEngaged 门控）', footerSrc.includes('supportEngaged') && footerSrc.includes('markSupportEngaged') && footerSrc.includes('hasEngagedSupport'));
  check('i18n 提供独立开发赞助文案（zh/en）', uiSrc.includes("'footer.indieLead':") && uiSrc.includes("'footer.indieCta': '赞助独立开发'") && uiSrc.includes("'footer.indieCta': 'Support indie development'"));
  check('i18n 提供数据来源与说明词条（zh/en）', uiSrc.includes("'footer.dataSources': '数据来源与说明'") && uiSrc.includes("'footer.dataSources': 'Data sources & notes'"));
  check('静态页脚同步轻量赞助文案（generator）', genSrc.includes('栖居罗盘由个人独立维护并保持纯净无广告') && genSrc.includes('赞助独立开发'));
  check('静态页脚法律链接横向紧凑（legal-links 类）', genSrc.includes('class="legal-links"'));
  // 静态落地页必须保持「零外链脚本」：Ko-fi 相关脚本一律不得进入 dist 静态 HTML，
  // 静态页仅允许一个纯 <a> 直链兜底入口（无脚本、不破坏首屏自包含）。
  const kofiScriptHtml = allHtml.filter((p) => /<script[^>]+src=["'][^"']*ko-fi/i.test(fs.readFileSync(p, 'utf8')));
  check('dist 静态 HTML 无 Ko-fi 外链脚本（落地页保持自包含自首屏）', kofiScriptHtml.length === 0, kofiScriptHtml.slice(0, 3).map((p) => path.relative(ROOT, p)).join(', '));
  const kofiLinkHtml = allHtml.filter((p) => /<a\b[^>]*href=["']https:\/\/ko-fi\.com\//i.test(fs.readFileSync(p, 'utf8')));
  check('dist 静态 HTML 含纯 <a> 打赏兜底入口（无脚本）', kofiLinkHtml.length > 0, `命中 ${kofiLinkHtml.length} 页`);
}

console.log(`\n════════ verify-legal: ${passed} passed, ${failed.length} failed ════════`);
if (failed.length) {
  console.log('失败项：');
  for (const f of failed) console.log(`  - ${f}`);
  process.exit(1);
}
