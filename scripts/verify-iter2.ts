// 第二轮验证脚本：对比链路冒烟（选城 / 临时权重重算 / 成本结论 / 中性基准）
// 运行：pnpm tsx scripts/verify-iter2.ts
import { PREFERENCE_WEIGHTS, assess, computeCityFits } from '../src/lib/engine';
import { DEMO_PROFILES, buildDemoAnswers } from '../src/data/demoProfiles';
import { cities } from '../src/data';
import {
  COMPARE_COLORS,
  NEUTRAL_ANSWERS,
  buildCompareRow,
  compareCost,
  defaultWeights,
  equalWeights,
  rankRows,
  weightShare,
} from '../src/lib/compare';

let fails = 0;
function check(name: string, cond: boolean, detail = ''): void {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`);
  if (!cond) fails++;
}

const profile = DEMO_PROFILES.find((p) => p.id === 'family-with-kids');
if (!profile) {
  console.log('FAIL 演示档案 family-with-kids 不存在');
  process.exit(1);
}
const answers = buildDemoAnswers(profile);

// ---- 1. computeCityFits 与 assess 输出一致（提取未改变引擎行为；v2 起类级分数可空） ----
const eqRound = (a: number | null, b: number | null): boolean =>
  a == null ? b == null : b != null && Math.round(a) === Math.round(b);
for (const m of assess(answers).matches.slice(0, 3)) {
  const fits = computeCityFits(m.city, answers);
  check(
    `computeCityFits 一致性 · ${m.city.id}`,
    eqRound(fits.personalityFit, m.personalityFit) &&
      eqRound(fits.preferenceFit, m.preferenceFit) &&
      eqRound(fits.interestFit, m.interestFit),
    `(${fits.personalityFit == null ? 'null' : Math.round(fits.personalityFit)}/${m.personalityFit}, ${fits.preferenceFit == null ? 'null' : Math.round(fits.preferenceFit)}/${m.preferenceFit}, ${fits.interestFit == null ? 'null' : Math.round(fits.interestFit)}/${m.interestFit})`,
  );
}

// ---- 2. 中性基准可计算（未测评模式） ----
const lisbon = cities.find((c) => c.id === 'lisbon');
const bangkok = cities.find((c) => c.id === 'bangkok');
const mexico = cities.find((c) => c.id === 'mexico-city');
const berlin = cities.find((c) => c.id === 'berlin');
check('中性基准城市存在', Boolean(lisbon && bangkok && mexico && berlin));
if (lisbon) {
  const neutralRow = buildCompareRow(lisbon, COMPARE_COLORS[0], NEUTRAL_ANSWERS, equalWeights());
  check(
    '中性基准 composite 有限',
    Number.isFinite(neutralRow.composite) && neutralRow.composite > 0 && neutralRow.composite <= 99,
    `lisbon=${neutralRow.composite}`,
  );
}

// ---- 3. 临时权重重算并重排 ----
if (lisbon && bangkok && mexico && berlin) {
  const pick = [lisbon, bangkok, mexico, berlin];
  const cheapest = [...pick].sort((a, b) => a.monthlyCostUSD - b.monthlyCostUSD)[0];
  const base = rankRows(
    pick.map((c, i) => buildCompareRow(c, COMPARE_COLORS[i % 4], answers, defaultWeights())),
  );
  const biased = rankRows(
    pick.map((c, i) =>
      buildCompareRow(
        c,
        COMPARE_COLORS[i % 4],
        answers,
        { budget: 5, climate: 0.1, pace: 0.1, size: 0.1, social: 0.1, language: 0.1, visa: 0.1, remote: 0.1 },
      ),
    ),
  );
  console.log(`默认排名: ${base.map((r) => `${r.city.id}:${r.composite}`).join(' > ')}`);
  console.log(`重预算排名: ${biased.map((r) => `${r.city.id}:${r.composite}`).join(' > ')}`);
  const changed =
    base.some((r, i) => biased[i].city.id !== r.city.id || biased[i].composite !== r.composite);
  check('权重调整后排名/分数发生变化', changed);
  // 重预算后，低成本城市与高分基本盘城市的分差应收窄（预算敏感度生效）
  const gapBase = base[0].composite - base[base.length - 1].composite;
  const gapBiased = biased[0].composite - biased[biased.length - 1].composite;
  check('重预算后分差收窄', gapBiased < gapBase, `${gapBase} → ${gapBiased}`);
  check('重预算后最低成本城市得分上升', biased.find((r) => r.city.id === cheapest.id)!.composite > base.find((r) => r.city.id === cheapest.id)!.composite);
}

// ---- 4. 成本对比结论（真实数字模板） ----
if (lisbon && bangkok) {
  const cost = compareCost(lisbon, bangkok);
  console.log(`成本结论: ${cost.conclusion}`);
  const hiUSD = Math.max(lisbon.monthlyCostUSD, bangkok.monthlyCostUSD).toLocaleString('en-US');
  check('成本结论含真实数字', cost.conclusion.includes(hiUSD) && cost.diffPct > 0, `diffPct=${cost.diffPct}%`);
}

// ---- 5. 权重份额 ----
const dw = defaultWeights();
const engineSum = Object.values(PREFERENCE_WEIGHTS).reduce((s, v) => s + v, 0);
check(
  '默认份额 = 引擎权重占比',
  weightShare(dw, 'budget') === Math.round((PREFERENCE_WEIGHTS.budget / engineSum) * 100),
  `budget=${weightShare(dw, 'budget')}%`,
);
const ew = equalWeights();
const shares = Object.keys(ew).map((k) => weightShare(ew, k));
check('均分份额合计 100%', shares.reduce((s, v) => s + v, 0) === 100, shares.join('+'));

// ---- 6. 演示答案完整性（进入对比的个性化输入） ----
check(
  '演示答案 32+8+兴趣 完整',
  Object.keys(answers.mbti).length === 32 &&
    Object.keys(answers.lifestyle).length === 8 &&
    answers.interests.length > 0,
  `${Object.keys(answers.mbti).length}/${Object.keys(answers.lifestyle).length}/${answers.interests.length}`,
);

console.log(fails === 0 ? '\n=== 全部通过 ===' : `\n=== ${fails} 项失败 ===`);
process.exit(fails === 0 ? 0 : 1);
