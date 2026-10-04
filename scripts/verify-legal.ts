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
const pages: Array<{ rel: string; lang: 'zh' | 'en'; kind: 'privacy' | 'terms' }> = [
  { rel: 'privacy/index.html', lang: 'zh', kind: 'privacy' },
  { rel: 'en/privacy/index.html', lang: 'en', kind: 'privacy' },
  { rel: 'terms/index.html', lang: 'zh', kind: 'terms' },
  { rel: 'en/terms/index.html', lang: 'en', kind: 'terms' },
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
  ['控制者与占位邮箱', 'privacy@nomadmatch.app'],
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
  ['placeholder mailbox', 'privacy@nomadmatch.app'],
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
  ['非专业建议', '不构成移民、法律、税务、财务或医疗建议'],
  ['第三方快照可能过时', '可能过时或存在误差'],
  ['签证以官方渠道为准', '通过官方渠道核实'],
  ['责任限制', '责任限制'],
  ['演示性付费 ¥29.9', '¥29.9'],
  ['无真实扣款', '不会产生任何真实扣款'],
  ['无退款流程', '无真实收款与退款流程'],
  ['本地解锁记录', 'proUnlocked / orders'],
  ['Numbeo 署名', 'Numbeo'],
  ['IPIP 署名', 'ipip.ori.org'],
  ['O*NET 署名', 'O*NET Interest Profiler'],
  ['GeoNames CC BY', 'GeoNames（CC BY 4.0）'],
  ['Open-Meteo CC BY', 'Open-Meteo'],
  ['OEJTS 许可', 'CC BY-NC-SA 4.0'],
  ['适用法域占位', '占位：待正式部署后补充法域与管辖条款'],
];
for (const [name, kw] of TERMS_ZH) check(`zh 协议页：${name}`, htmls['terms/index.html']?.includes(kw) ?? false, kw);
const TERMS_EN: Array<[string, string]> = [
  ['as-is', 'as is'],
  ['not professional advice', 'not immigration, legal, tax, financial or medical advice'],
  ['snapshots may be outdated', 'may be outdated or imprecise'],
  ['verify official channels', 'verify with official channels'],
  ['limitation of liability', 'Limitation of liability'],
  ['¥29.9 demo billing', '¥29.9'],
  ['no real charge', 'no real charge is ever made'],
  ['no refund process', 'no real collection or refund process'],
  ['local unlock log', 'proUnlocked / orders'],
  ['Numbeo', 'Numbeo'],
  ['IPIP', 'ipip.ori.org'],
  ['O*NET', 'O*NET Interest Profiler'],
  ['GeoNames CC BY', 'GeoNames (CC BY 4.0)'],
  ['OEJTS licence', 'CC BY-NC-SA 4.0'],
  ['governing law placeholder', 'placeholder: jurisdiction and venue to be added'],
];
for (const [name, kw] of TERMS_EN) check(`en 协议页：${name}`, htmls['en/terms/index.html']?.includes(kw) ?? false, kw);

console.log('\n══ 五、法律页互链与页脚链接 ══');
check('zh 隐私页链接用户协议', (htmls['privacy/index.html'] ?? '').includes('href="/terms/"'));
check('zh 协议页链接隐私政策', (htmls['terms/index.html'] ?? '').includes('href="/privacy/"'));
check('en 隐私页链接用户协议', (htmls['en/privacy/index.html'] ?? '').includes('href="/en/terms/"'));
check('en 协议页链接隐私政策', (htmls['en/terms/index.html'] ?? '').includes('href="/en/privacy/"'));
check('法律页返回首页链接', (htmls['privacy/index.html'] ?? '').includes('href="/"'));

const footerSrc = [
  'src/components/Footer.tsx', 'src/App.tsx', 'src/i18n/dict/ui.ts',
].map((rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')).join('\n');
check('Footer 组件存在 /terms/ 与 /privacy/ 链接', footerSrc.includes('/terms/') && footerSrc.includes('/privacy/'));
check('Footer 按语言切换前缀（base = en ? /en）', footerSrc.includes("lang === 'en' ? '/en' : ''"));
check('Footer 挂载于三 Tab 屏幕（TAB_SCREENS 判断）', fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8').includes('TAB_SCREENS.includes(screen) && <Footer />'));
check('ui 词典 zh：footer.terms/footer.privacy', footerSrc.includes("'footer.terms': '用户协议'") && footerSrc.includes("'footer.privacy': '隐私政策'"));
check('ui 词典 en：footer.terms/footer.privacy', footerSrc.includes("'footer.terms': 'Terms of Service'") && footerSrc.includes("'footer.privacy': 'Privacy Policy'"));

console.log('\n══ 六、sitemap 收录 ══');
const sitemap = read('sitemap.xml') ?? '';
for (const u of ['/privacy/', '/terms/', '/en/privacy/', '/en/terms/']) {
  check(`sitemap 收录 ${u}`, sitemap.includes(`<loc>${u.replace(/^\//, '')}</loc>`) || new RegExp(`<loc>[^<]*${u}</loc>`).test(sitemap));
}
check('sitemap URL 总数 ≥542（536 + 4 法律页 + 首页×2）', (sitemap.match(/<url>/g) ?? []).length >= 542);
check('第十二轮产物未破坏：城市页仍 200×2', (() => {
  let n = 0;
  for (const rel of ['city/chengdu/index.html', 'en/city/chengdu/index.html', 'city/lisbon/index.html', 'en/city/lisbon/index.html']) {
    if (read(rel)) n++;
  }
  return n === 4;
})());

console.log(`\n════════ verify-legal: ${passed} passed, ${failed.length} failed ════════`);
if (failed.length) {
  console.log('失败项：');
  for (const f of failed) console.log(`  - ${f}`);
  process.exit(1);
}
