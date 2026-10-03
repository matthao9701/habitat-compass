/**
 * verify-quiz-v2 — 第五轮（题库双版本 + 虚拟计费）离线验证脚本
 *
 * 覆盖：
 *  1. IPIP-NEO 120 题完整性（id 唯一 / 30 facets × 4 / 每 facet 2 正 2 反 / 出处非空）
 *  2. IPIP 计分方向回归（keyed 最优 → 域 100；keyed 最差 → 域 0；全中位 → 域 ≈50）
 *  3. Big Five → 16 型映射回归（全优 → ENFJ；全劣 → ISTP）+ assess(pro) 冒烟
 *  4. 标准版偏好 20 题：四题型齐备 / ordinalMap 有效 / 8 维全覆盖（含 choice slot）
 *  5. 兴趣 28 标签 + 二级细化：id 唯一 / 子项 3-5 / reinforcedTags 强化逻辑
 *
 * 运行：pnpm tsx scripts/verify-quiz-v2.ts（node 环境无 localStorage，storage 函数自动降级）
 */
import { ipipQuestions, IPIP_FACETS, proLifestyleQuestions, RANK_ORDINALS } from '../src/data/questionsPro';
import { interestTagsPro, interestSubs, reinforcedTags } from '../src/data/interestsPro';
import { assess, derivePersonalityPro, type UserAnswers, type BigFiveDomain } from '../src/lib/engine';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail?: string): void {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n[${title}]`);
}

// ---------------------------------------------------------------------------
// 1. IPIP-NEO 120 完整性
// ---------------------------------------------------------------------------
section('1. IPIP-NEO 120 题完整性');
check('题量 = 120', ipipQuestions.length === 120, `实际 ${ipipQuestions.length}`);
check('题目 id 唯一', new Set(ipipQuestions.map((q) => q.id)).size === ipipQuestions.length);
check('每题 text 非空', ipipQuestions.every((q) => q.text.trim().length > 0));
check('每题 ref 出处非空', ipipQuestions.every((q) => q.ref.trim().length > 0));

const facetCount = new Map<string, number>();
const facetSlugs = new Set<string>();
for (const q of ipipQuestions) {
  facetCount.set(q.facet, (facetCount.get(q.facet) ?? 0) + 1);
  facetSlugs.add(q.facet);
}
check('覆盖 30 个 facet', facetCount.size === 30, `实际 ${facetCount.size}`);
check('每 facet 恰好 4 题', [...facetCount.values()].every((n) => n === 4));
check('facet slug 与 IPIP_FACETS key 完全对齐', [...facetSlugs].every((k) => IPIP_FACETS.some((f) => f.key === k)) && IPIP_FACETS.every((f) => facetCount.has(f.key)));
check('IPIP_FACETS 表 30 条', IPIP_FACETS.length === 30);

let facetKeyedOk = true;
const keyedDetail: string[] = [];
for (const [facet, n] of facetCount) {
  const qs = ipipQuestions.filter((q) => q.facet === facet);
  const plus = qs.filter((q) => q.keyed === 1).length;
  const minus = qs.filter((q) => q.keyed === -1).length;
  if (plus !== 2 || minus !== 2 || n !== 4) {
    facetKeyedOk = false;
    keyedDetail.push(`${facet}(+${plus}/-${minus})`);
  }
}
check('每 facet 2 正 2 反（IPIP 官方计分键）', facetKeyedOk, keyedDetail.join(','));

const domainFacets = new Map<BigFiveDomain, number>();
for (const f of IPIP_FACETS) domainFacets.set(f.domain, (domainFacets.get(f.domain) ?? 0) + 1);
check(
  '五大域各 6 facets',
  ['E', 'A', 'C', 'N', 'O'].every((d) => domainFacets.get(d as BigFiveDomain) === 6),
  [...domainFacets.entries()].map(([d, n]) => `${d}:${n}`).join(' '),
);

// ---------------------------------------------------------------------------
// 2. IPIP 计分方向回归
// ---------------------------------------------------------------------------
section('2. IPIP 计分方向回归');

function answersBy(mode: 'best' | 'worst' | 'mid' | 'best-noE'): Record<string, number> {
  const m: Record<string, number> = {};
  for (const q of ipipQuestions) {
    if (mode === 'mid') {
      m[q.id] = 3;
    } else if (mode === 'best') {
      m[q.id] = q.keyed === 1 ? 5 : 1;
    } else if (mode === 'worst') {
      m[q.id] = q.keyed === 1 ? 1 : 5;
    } else {
      m[q.id] = q.domain === 'E' ? (q.keyed === 1 ? 1 : 5) : q.keyed === 1 ? 5 : 1;
    }
  }
  return m;
}

const best = derivePersonalityPro(answersBy('best'));
const worst = derivePersonalityPro(answersBy('worst'));
const mid = derivePersonalityPro(answersBy('mid'));
const noE = derivePersonalityPro(answersBy('best-noE'));

const all100 = (p: { domains: Record<string, number> }): boolean =>
  Object.values(p.domains).every((v) => v === 100);
const all0 = (p: { domains: Record<string, number> }): boolean =>
  Object.values(p.domains).every((v) => v === 0);
const allMid = (p: { domains: Record<string, number> }): boolean =>
  Object.values(p.domains).every((v) => Math.abs(v - 50) < 1e-6);

check('keyed 最优作答 → 五域百分位全 100', all100(best), JSON.stringify(best.domains));
check('keyed 最差作答 → 五域百分位全 0', all0(worst), JSON.stringify(worst.domains));
check('全中位作答 → 五域 ≈ 50', allMid(mid), JSON.stringify(mid.domains));
check('仅 E 域反向作答 → E 域为 0，其余 100', noE.domains.E === 0 && ['A', 'C', 'N', 'O'].every((d) => noE.domains[d as BigFiveDomain] === 100), `E=${noE.domains.E}`);
check('30 facets 百分位齐全', best.facets.length === 30 && best.facets.every((f) => f.percentile === 100));
check('facet 表与题目 facet 一致', best.facets.every((f) => facetCount.has(f.facet)));

// ---------------------------------------------------------------------------
// 3. Big Five → 16 型映射回归 + assess(pro) 冒烟
// ---------------------------------------------------------------------------
section('3. Big Five → 16 型映射 + 引擎冒烟');

// McCrae & Costa (1989)：E/I←Extraversion、S/N←Openness（高开放→N）、
// T/F←Agreeableness（高宜人→F）、J/P←Conscientiousness（高尽责→J）
check('全优作答 → ENFJ', best.typeCode === 'ENFJ', best.typeCode);
check('全劣作答 → ISTP', worst.typeCode === 'ISTP', worst.typeCode);
check('仅 E 反向 → INFJ', noE.typeCode === 'INFJ', noE.typeCode);
check(
  'axisScores 与域分一致（0-100 朝正向字母 E/N/F/P）',
  best.axisScores.EI === 100 && best.axisScores.SN === 100 && best.axisScores.TF === 100 && best.axisScores.JP === 0,
  JSON.stringify(best.axisScores),
);

const proAnswers: UserAnswers = {
  version: 'pro',
  mbti: answersBy('best'),
  lifestyle: {
    pl_budget: '1500-2500',
    pl_climate: 'temperate',
    pl_pace: '3',
    pl_size: '4',
    pl_social: '4',
    pl_language: '3',
    pl_visa: '4',
    pl_remote: '5',
    pl_forced1: 'sun',
    pl_slider1: '25-25-25-25',
    pl_rank1: 'safety>cost>community>nature',
  },
  interests: ['outdoor', 'food', 'startup'],
  interestSubs: { outdoor: ['hiking', 'cycling'], food: ['streetfood'] },
};

const proResult = assess(proAnswers);
check('assess(pro) version=pro', proResult.version === 'pro');
check('assess(pro) 含 proProfile', proResult.proProfile != null);
check('proProfile 域分全 100', proResult.proProfile != null && all100(proResult.proProfile));
check('pro typeCode 与映射一致', proResult.typeCode === 'ENFJ', proResult.typeCode);
check('Top5 输出 5 城', proResult.matches.length === 5);
check('匹配分范围合法', proResult.matches.every((m) => m.match >= 0 && m.match <= 99));
check('interestSubs 强化生效', (() => {
  const r = reinforcedTags({ outdoor: ['hiking'] });
  return r.has('outdoor');
})());
check('未选子项不强化', !reinforcedTags({ outdoor: [] }).has('outdoor') && !reinforcedTags({}).has('food'));

// 兴趣强化对匹配分的实际影响（同作答、更多子项 → 匹配分不降低）
const noSubs = assess({ ...proAnswers, interestSubs: undefined });
const withSubs = assess(proAnswers);
const topNoSub = noSubs.matches[0]?.match ?? 0;
const topWithSub = withSubs.matches[0]?.match ?? 0;
check('选中子项后 Top1 匹配分 ≥ 无子项', topWithSub >= topNoSub, `${topNoSub} → ${topWithSub}`);

// ---------------------------------------------------------------------------
// 4. 标准版偏好 20 题
// ---------------------------------------------------------------------------
section('4. 标准版生活偏好 20 题');
check('题量 = 20', proLifestyleQuestions.length === 20, `实际 ${proLifestyleQuestions.length}`);
check('题目 id 唯一', new Set(proLifestyleQuestions.map((q) => q.id)).size === proLifestyleQuestions.length);

const kinds = new Map<string, number>();
for (const q of proLifestyleQuestions) kinds.set(q.kind, (kinds.get(q.kind) ?? 0) + 1);
check(
  '四种题型齐备（choice/forced/slider/rank）',
  ['choice', 'forced', 'slider', 'rank'].every((k) => (kinds.get(k) ?? 0) >= 1),
  [...kinds.entries()].map(([k, n]) => `${k}:${n}`).join(' '),
);

const DIM_KEYS = ['budget', 'climate', 'pace', 'size', 'social', 'language', 'visa', 'remote'];
const covered = new Set<string>();
for (const q of proLifestyleQuestions) {
  if (q.kind === 'choice') {
    for (const k of Object.keys(q.ordinalMap)) covered.add(k);
    if (q.slot) covered.add(q.slot);
  } else if (q.kind === 'forced') {
    for (const k of Object.keys(q.ordinalMap)) covered.add(k);
  } else if (q.kind === 'slider') {
    for (const d of q.dims) covered.add(d.key);
  } else {
    for (const it of q.items) covered.add(it.value);
  }
}
check('8 个偏好维度全覆盖', DIM_KEYS.every((k) => covered.has(k)), [...covered].sort().join(','));

const ordOk = proLifestyleQuestions.every((q) => {
  if (q.kind === 'choice' || q.kind === 'forced') {
    return Object.values(q.ordinalMap).every((contrib) => Object.values(contrib).every((v) => v >= 1 && v <= 5));
  }
  return true;
});
check('ordinalMap 序数值均在 1-5', ordOk);

check('排序题 4 项 × RANK_ORDINALS 4 档', proLifestyleQuestions.every((q) => q.kind !== 'rank' || (q.items.length === 4 && RANK_ORDINALS.length === 4)));
check(
  '滑杆题维度 4 个且 total=100',
  proLifestyleQuestions.every((q) => q.kind !== 'slider' || (q.dims.length === 4 && q.total === 100)),
);

// ---------------------------------------------------------------------------
// 5. 兴趣 28 标签 + 二级细化
// ---------------------------------------------------------------------------
section('5. 兴趣 28 标签与二级细化');
check('一级标签 = 28', interestTagsPro.length === 28, `实际 ${interestTagsPro.length}`);
check('标签 id 唯一', new Set(interestTagsPro.map((t) => t.id)).size === 28);
check('每标签 label/desc 非空', interestTagsPro.every((t) => t.label.trim() && t.desc.trim().length > 0));

const subCounts = Object.entries(interestSubs).map(([k, v]) => ({ k, n: v.length }));
check('有二级细化的标签 ≥ 24', subCounts.length >= 24, `实际 ${subCounts.length}`);
check('每类子项 3-5 个', subCounts.every((s) => s.n >= 3 && s.n <= 5), subCounts.filter((s) => s.n < 3 || s.n > 5).map((s) => `${s.k}:${s.n}`).join(','));

const subIds = new Set<string>();
let subIdDup = false;
for (const [, subs] of Object.entries(interestSubs)) {
  for (const s of subs) {
    if (subIds.has(s.id)) subIdDup = true;
    subIds.add(s.id);
  }
}
check('子项 id 全局唯一', !subIdDup);
check('子项 label 非空', Object.values(interestSubs).every((subs) => subs.every((s) => s.label.trim().length > 0)));

const boosted = reinforcedTags({ outdoor: ['hiking', 'cycling'], food: [] });
check('reinforcedTags 只强化有选中子项的一级', boosted.has('outdoor') && !boosted.has('food'));

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------
console.log(`\n===== verify-quiz-v2: ${pass} passed, ${fail} failed =====`);
if (fail > 0) process.exit(1);
