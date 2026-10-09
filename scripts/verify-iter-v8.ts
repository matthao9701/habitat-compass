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
// 第十六轮：hero 次入口改为「城市库」统一入口，演示档案由下方独立区块承载（onDemo 仍逐项绑定）
check('hero 次入口指向城市库（onBrowse）', landingSrc.includes('onClick={onBrowse}') && landingSrc.includes('landing.hero.browseCta'));
check('演示档案入口逐项绑定 onDemo', landingSrc.includes('onClick={() => onDemo(profile.id)}'));

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

/* ============ 4. 导航枢纽（响应式双形态：顶栏 + 移动端底部栏） ============ */
section('4. 导航枢纽布局');
const tabSrc = read('src/components/TabBar.tsx');
// 移动端：顶栏精简为「Logo + 当前页标题 + 中英切换」，纯图标入口下沉到底部固定栏；
// 桌面端：隐藏底栏、顶栏横向展开，每项图标 + 文字，激活项胶囊底色。
check('LangSwitch 不再绝对定位（移除 absolute right-）', !tabSrc.includes('absolute right-'));
check('LangSwitch 容器 shrink-0 防挤压', tabSrc.includes('shrink-0'));
check('移动端顶栏展示当前页标题（md:hidden）', tabSrc.includes('md:hidden') && tabSrc.includes('pageTitle'));
// 底部导航栏：固定常驻、仅移动端（md 起隐藏）
const bottomNavFixed = tabSrc.includes('fixed inset-x-0 bottom-0') && tabSrc.includes('md:hidden');
check('底部导航栏固定常驻且仅移动端（fixed bottom-0 + md:hidden）', bottomNavFixed);
check('底栏处理底部安全区（env(safe-area-inset-bottom)）', tabSrc.includes('env(safe-area-inset-bottom)'));
check('底栏四项均分（flex-1）', tabSrc.includes('flex-1'));
check('底栏为图标 + 文字纵向布局（flex-col）', tabSrc.includes('flex-col'));
check('底栏触控热区 ≥44px（min-h-[56px]）', tabSrc.includes('min-h-[56px]'));
// 桌面端横向导航：图标 + 文字，激活胶囊
check('桌面横向导航 ≥md 展开（hidden ... md:flex）', tabSrc.includes('md:flex'));
check('桌面导航项始终显示图标 + 文字（标签不再 sm:inline 隐藏）', tabSrc.includes('{label}') && !tabSrc.includes('hidden sm:inline'));
check('激活项温和胶囊高亮（rounded-full + bg-clay/10）', tabSrc.includes('rounded-full') && tabSrc.includes('bg-clay/10'));
check('导航项保留可访问名（aria-current / aria-label）', tabSrc.includes('aria-current') && tabSrc.includes('aria-label={t(\'nav.ariaLabel\')}'));
// 四入口统一取自 TAB_ITEMS（首页由品牌标识承载，不单列）
check('四个核心入口（探索/税负/对比/我的）', tabSrc.includes("key: 'nav.explore'") && tabSrc.includes("key: 'tax.nav'") && tabSrc.includes("key: 'nav.compare'") && tabSrc.includes("key: 'nav.profile'"));
// App 侧预留防遮挡间距
check('常驻页面预留底栏防遮挡间距', appSrc.includes('pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0'));

/* ============ 5. 编辑部风色板（token 一致性） ============ */
// 第十一轮的「天空蓝白」已被后续「编辑部杂志风」取代（oat paper + ink + navy/terracotta）：
// 本节断言对齐现行 tailwind token，并顺带清理已废弃的深天蓝/浅蓝白残留。
section('5. 编辑部风色板');
const twSrc = read('tailwind.config.js');
check('pine 主操作 = 深海航海蓝 #1D3557', twSrc.includes('#1D3557'));
check('旧天空蓝 #0369A1 已清除', !twSrc.includes('#0369A1'));
check('paper = 燕麦羊皮纸 #F9F8F6', twSrc.includes('#F9F8F6'));
check('旧浅蓝白 #F0F9FF 已清除', !twSrc.includes('#F0F9FF'));
check('colors.ts deepSea 同步 #1D3557', CHART_COLORS.deepSea === '#1D3557');
check('colors.ts coral 同步 #C96A52', CHART_COLORS.coral === '#C96A52');
// 全源码旧色清零（含第十一轮天空蓝白 + 更早海洋蓝白两代残留）
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
      if (/#0A4D68|#E76F51|#0A2530|#5A7A8A|#F0F7FA|#3FA7BF|#4A8DB7|#C25438|#0369A1|#EE6C4D|#D9A441|#17A2C6|#082F49|#4E7A96|#F0F9FF|#57B4E0|#2E8B74/.test(src)) staleHits += 1;
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
