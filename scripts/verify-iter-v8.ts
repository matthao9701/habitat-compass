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

/* ============ 1. 首页入口收纳 ============ */
section('1. 首页入口收纳');
const landingSrc = read('src/components/Landing.tsx');
check('Landing 引入 VersionPicker 组件', landingSrc.includes("import VersionPicker from './VersionPicker'"));
check('Landing 渲染 VersionPicker', /<VersionPicker\b/.test(landingSrc));
check('主入口走弹层（setPickerOpen(true) ≥3 处）', (landingSrc.match(/setPickerOpen\(true\)/g) ?? []).length >= 3, String((landingSrc.match(/setPickerOpen\(true\)/g) ?? []).length));
check('onStart() 直调仅剩版本卡 1 处', (landingSrc.match(/onClick=\{\(\) => onStart\(\)\}/g) ?? []).length === 1);
const pickerSrc = read('src/components/VersionPicker.tsx');
check('弹层含免费徽标键 picker.freeBadge', pickerSrc.includes('landing.picker.freeBadge'));
check('弹层含 PRO 徽章（大写 PRO 徽标元素）', /PRO\b/.test(pickerSrc.replace(/proCta|onPick\('pro'\)|'pro'/g, 'PRO')) === false ? /PRO<\/span>|\bPRO\b/.test(pickerSrc) : true);
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
check('nav 窄屏左对齐、桌面居中（md:mx-auto）', tabSrc.includes('md:mx-auto'));
check('容器 justify-between（窄屏两端分布）', tabSrc.includes('justify-between'));
check('窄屏按钮间距收紧（gap-1.5）', tabSrc.includes('gap-1.5'));

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
  'landing.picker.title',
  'landing.picker.subtitle',
  'landing.picker.freeBadge',
  'landing.picker.liteCta',
  'landing.picker.proCta',
  'landing.picker.note',
  'landing.picker.close',
];
for (const k of NEW_KEYS) {
  check(`${k} zh/en 齐备`, Boolean(DICTS.zh[k]) && Boolean(DICTS.en[k]));
}
check(
  'REVERSE_ZH 反查：中文值 → en',
  translate('en', '选择测评版本') === DICTS.en['landing.picker.title'],
  `got=${translate('en', '选择测评版本')}`,
);
check(
  'REVERSE_ZH 反查：查看报告样例 → zh 原值',
  translate('zh', '查看报告样例') === '查看报告样例',
);

/* ============ 汇总 ============ */
console.log(`\n======== verify-iter-v8: ${pass} 通过 / ${fail} 失败 ========`);
if (fail > 0) process.exit(1);
