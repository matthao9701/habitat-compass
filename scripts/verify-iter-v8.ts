/**
 * 第十一轮验证：入口收纳 + 报告样例联动 + Tab 布局 + 天空蓝白换肤 + i18n
 * 运行：pnpm tsx scripts/verify-iter-v8.ts
 */
import * as fs from 'node:fs';
import { DEMO_PROFILES, buildDemoAnswers } from '../src/data/demoProfiles';
import { assess } from '../src/lib/engine';
import * as storage from '../src/lib/storage';
import { translate } from '../src/i18n';
import { DICTS } from '../src/i18n/dict';
import { CHART_COLORS } from '../src/lib/colors';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? `（${detail}）` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n[${title}]`);
}

const read = (p: string): string => fs.readFileSync(p, 'utf8');

/* ============ 1. 首页入口收纳（融合题库后统一入口） ============ */
section('1. 首页入口收纳');
const landingSrc = read('src/components/Landing.tsx');
check('Landing 不再引入 VersionPicker', !landingSrc.includes('VersionPicker'));
check('Landing 不渲染版本选择弹层', !/<VersionPicker\b/.test(landingSrc) && !landingSrc.includes('pickerOpen'));
check('主入口直调 onStart（无弹层中转）', (landingSrc.match(/onClick=\{onStart\}/g) ?? []).length >= 2, String((landingSrc.match(/onClick=\{onStart\}/g) ?? []).length));
check('结局区含核心/深化两卡文案键', landingSrc.includes('landing.version.core') && landingSrc.includes('landing.version.deepen'));
check('样例次入口指向演示档案首项', landingSrc.includes('onDemo(DEMO_PROFILES[0]?.id'));

/* ============ 2. 报告样例（demo 数据完整性 + 同源渲染） ============ */
section('2. 报告样例渲染');
const SAMPLE_KEYS = ['rep.demo.badge', 'rep.demo.cta1', 'rep.demo.cta2'];
for (const k of SAMPLE_KEYS) {
  check(`样例标注键 ${k}（zh/en）`, Boolean(DICTS.zh[k]) && Boolean(DICTS.en[k]));
}
check('样例徽标文案含「样例报告」', String(DICTS.zh['rep.demo.badge']).includes('样例报告'));
const reportSrc = read('src/components/Report.tsx');
check('Report 样例徽标走 isDemo 分支', reportSrc.includes('isDemo ? ('));
check('Report 样例引导按钮存在', reportSrc.includes('rep.cta.start'));

for (const profile of DEMO_PROFILES) {
  const answers = buildDemoAnswers(profile);
  const result = assess(answers);
  check(
    `demo[${profile.id}] version=lite 且 Top5 齐整`,
    result.version === 'lite' && result.matches.length === 5,
    `matches=${result.matches.length}`,
  );
  check(
    `demo[${profile.id}] 人格判定 ${result.typeCode}（期望 ${profile.expectedType}）`,
    result.typeCode === profile.expectedType,
  );
  check(
    `demo[${profile.id}] 首位城市报告可生成`,
    result.matches[0] != null && result.matches[0].city.id.length > 0 && typeof result.matches[0].match === 'number',
  );
  check(
    `demo[${profile.id}] 分维度分数可空安全`,
    result.matches.every((m) => typeof m.match === 'number' && m.match >= 0 && m.match <= 100),
  );
}

/* ============ 3. 样例模式不污染真实数据 ============ */
section('3. 样例模式不污染真实数据');
const appSrc = read('src/App.tsx');
const openDemoIdx = appSrc.indexOf('function openDemo');
const openDemoEnd = appSrc.indexOf('}', appSrc.indexOf('go(\'report\')', openDemoIdx));
const openDemoBody = appSrc.slice(openDemoIdx, openDemoEnd);
check('openDemo 不写简易版历史', !openDemoBody.includes('storage.saveHistory'));
check('openDemo 不写标准版历史', !openDemoBody.includes('storage.saveProHistory'));
check('openDemo 不写草稿', !openDemoBody.includes('saveDraft') && !openDemoBody.includes('saveProDraft'));
check('openDemo 标记 isDemo=true', openDemoBody.includes('setIsDemo(true)'));
// node 环境守卫：storage 写入安全降级不抛错
let guardOk = true;
try {
  storage.saveHistory(buildDemoAnswers(DEMO_PROFILES[0]), assess(buildDemoAnswers(DEMO_PROFILES[0])));
} catch (err) {
  guardOk = false;
}
check('storage 写入 node 守卫安全降级', guardOk);

/* ============ 4. Tab 栏布局（无重叠，响应式类语义断言） ============ */
section('4. Tab 栏布局');
const tabSrc = read('src/components/TabBar.tsx');
check('LangSwitch 不再绝对定位（移除 absolute right-）', !tabSrc.includes('absolute right-'));
check('LangSwitch 容器 shrink-0 防挤压', tabSrc.includes('shrink-0'));
// 五 Tab 改版（城/税加入后）：nav 占满可用宽度并允许窄屏横向滚动，语言切换固定右侧不被遮挡；
// 小屏仅图标（44px 触控热区 + aria-label/title 保留可读名），≥ sm 显示图标 + 文字。
check('nav 占满剩余宽度（flex-1，避免与语言切换重叠）', tabSrc.includes('flex-1'));
check('窄屏可横向滚动兜底（overflow-x-auto）', tabSrc.includes('overflow-x-auto'));
check('小屏仅图标（sm:inline 才显示文字）', tabSrc.includes('hidden sm:inline'));
check('触控热区 ≥44px（min-h-[44px]）', tabSrc.includes('min-h-[44px]'));
check('图标按钮保留可访问名（aria-label）', tabSrc.includes('aria-label={label}'));

/* ============ 5. 天空蓝白换肤（token 一致性） ============ */
section('5. 天空蓝白换肤');
const twSrc = read('tailwind.config.js');
check('pine 主操作 = 深天蓝 #0369A1', twSrc.includes("#0369A1"));
check('旧深海蓝 #0A4D68 已清除', !twSrc.includes('#0A4D68'));
check('paper = 极浅蓝白 #F0F9FF', twSrc.includes('#F0F9FF'));
check('colors.ts deepSea 同步 #0369A1', CHART_COLORS.deepSea === '#0369A1');
check('colors.ts coral 同步 #EE6C4D', CHART_COLORS.coral === '#EE6C4D');
// 全源码旧色清零
let staleHits = 0;
function walk(dir: string): void {
  for (const name of fs.readdirSync(dir)) {
    const p = `${dir}/${name}`;
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(p);
    } else if (/\.(tsx?|css|js)$/.test(name)) {
      const src = fs.readFileSync(p, 'utf8');
      if (/#0A4D68|#E76F51|#0A2530|#5A7A8A|#F0F7FA|#3FA7BF|#4A8DB7|#C25438/.test(src)) staleHits += 1;
    }
  }
}
walk('src');
check('src/ 下旧色板 hex 清零（staleHits=0）', staleHits === 0, `staleHits=${staleHits}`);

/* ============ 6. i18n 双语 + REVERSE_ZH 反查 ============ */
section('6. i18n');
const NEW_KEYS = [
  'landing.hero.sampleCta',
  'landing.version.core',
  'landing.version.coreDesc',
  'landing.version.coreCta',
  'landing.version.deepen',
  'landing.version.deepenDesc',
  'landing.version.deepenCta',
  'landing.version.freeCta',
];
for (const k of NEW_KEYS) {
  check(`${k} zh/en 齐备`, Boolean(DICTS.zh[k]) && Boolean(DICTS.en[k]));
}
check(
  'REVERSE_ZH 反查：中文值 → en',
  translate('en', '核心测评') === DICTS.en['landing.version.core'],
  `got=${translate('en', '核心测评')}`,
);
check(
  'REVERSE_ZH 反查：查看报告样例 → zh 原值',
  translate('zh', '查看报告样例') === '查看报告样例',
);

/* ============ 汇总 ============ */
console.log(`\n======== verify-iter-v8: ${pass} 通过 / ${fail} 失败 ========`);
if (fail > 0) process.exit(1);
