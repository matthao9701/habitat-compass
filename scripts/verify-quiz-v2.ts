/**
 * verify-quiz-v2 — 融合题库（标准测验 + 深度测验）离线验证脚本
 *
 * 覆盖：
 *  1. IPIP 二元迫选配对（ipipPairs）完整性：60 对 / 30 facets × 2 / a/b 双语非空 / 域分布
 *  2. IPIP 二元计分方向回归（全 A → 域 100；全 B → 域 0；全未答 → 域 50；仅 E 反向）
 *  3. Big Five → 16 型映射回归（全优 → ENFJ；全劣 → ISTP）+ assess(deep) 冒烟
 *  4. 深度段偏好 12 题：四题型齐备 / 6 个序数维覆盖 / 与核心段 8 题去重
 *  5. 兴趣标签：核心 16 + 深度 12（去重）+ 二级细化 / reinforcedTags 强化逻辑
 *
 * 运行：pnpm tsx scripts/verify-quiz-v2.ts
 */
import { ipipPairs, ipipQuestions, IPIP_FACETS, proLifestyleQuestions, RANK_ORDINALS } from '../src/data/questionsPro';
import { riasecQuestions, RIASEC_DIMS, RIASEC_PER_DIM } from '../src/data/riasec';
import { riskQuestions } from '../src/data/riskTaking';
import { interestTagsPro, interestSubs, reinforcedTags } from '../src/data/interestsPro';
import { assess, isDeep, derivePersonalityPro, type UserAnswers, type BigFiveDomain } from '../src/lib/engine';
import { scenarioQuestions, lifestyleQuestions } from '../src/data/questions';
import { interestTags } from '../src/data/interests';

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
// 1. IPIP 二元迫选配对完整性
// ---------------------------------------------------------------------------
section('1. IPIP 二元迫选配对完整性');
check('配对数 = 60', ipipPairs.length === 60, `实际 ${ipipPairs.length}`);
check('配对 id 唯一', new Set(ipipPairs.map((p) => p.id)).size === ipipPairs.length);
check('每对 a/b 双语非空', ipipPairs.every((p) =>
  p.a.text.trim() && p.a.ref.trim() && p.b.text.trim() && p.b.ref.trim()));
check('每题 ref 出处非空（保留 120 题来源）', ipipQuestions.length === 120 && ipipQuestions.every((q) => q.ref.trim().length > 0));

const pairFacetCount = new Map<string, number>();
const pairFacetSlugs = new Set<string>();
for (const p of ipipPairs) {
  pairFacetCount.set(p.facet, (pairFacetCount.get(p.facet) ?? 0) + 1);
  pairFacetSlugs.add(p.facet);
}
check('覆盖 30 个 facet', pairFacetCount.size === 30, `实际 ${pairFacetCount.size}`);
check('每 facet 恰好 2 对', [...pairFacetCount.values()].every((n) => n === 2));
check('facet slug 与 IPIP_FACETS key 完全对齐', [...pairFacetSlugs].every((k) => IPIP_FACETS.some((f) => f.key === k)) && IPIP_FACETS.every((f) => pairFacetCount.has(f.key)));
check('IPIP_FACETS 表 30 条', IPIP_FACETS.length === 30);

const pairDomainFacets = new Map<BigFiveDomain, number>();
for (const f of IPIP_FACETS) pairDomainFacets.set(f.domain, (pairDomainFacets.get(f.domain) ?? 0) + 1);
check(
  '五大域各 6 facets',
  ['E', 'A', 'C', 'N', 'O'].every((d) => pairDomainFacets.get(d as BigFiveDomain) === 6),
  [...pairDomainFacets.entries()].map(([d, n]) => `${d}:${n}`).join(' '),
);
check('A 陈述与 B 陈述文案不同', ipipPairs.every((p) => p.a.text !== p.b.text));

// ---------------------------------------------------------------------------
// 2. IPIP 二元计分方向回归
// ---------------------------------------------------------------------------
section('2. IPIP 二元计分方向回归');

function ipipBy(mode: 'best' | 'worst' | 'mid' | 'best-noE'): Record<string, string> {
  const m: Record<string, string> = {};
  for (const p of ipipPairs) {
    if (mode === 'mid') continue; // 全未作答 → 记 0.5
    if (mode === 'best') m[p.id] = 'a';
    else if (mode === 'worst') m[p.id] = 'b';
    else m[p.id] = p.domain === 'E' ? 'b' : 'a';
  }
  return m;
}

const best = derivePersonalityPro(ipipBy('best'));
const worst = derivePersonalityPro(ipipBy('worst'));
const mid = derivePersonalityPro(ipipBy('mid'));
const noE = derivePersonalityPro(ipipBy('best-noE'));

const all100 = (p: { domains: Record<string, number> }): boolean =>
  Object.values(p.domains).every((v) => v === 100);
const all0 = (p: { domains: Record<string, number> }): boolean =>
  Object.values(p.domains).every((v) => v === 0);
const allMid = (p: { domains: Record<string, number> }): boolean =>
  Object.values(p.domains).every((v) => Math.abs(v - 50) < 1e-6);

check('全选 A（正向）→ 五域百分位全 100', all100(best), JSON.stringify(best.domains));
check('全选 B（反向）→ 五域百分位全 0', all0(worst), JSON.stringify(worst.domains));
check('全未作答 → 五域 ≈ 50', allMid(mid), JSON.stringify(mid.domains));
check('仅 E 域选 B → E 域为 0，其余 100', noE.domains.E === 0 && ['A', 'C', 'N', 'O'].every((d) => noE.domains[d as BigFiveDomain] === 100), `E=${noE.domains.E}`);
check('30 facets 百分位齐全', best.facets.length === 30 && best.facets.every((f) => f.percentile === 100));
check('facet 表与配对的 facet 一致', best.facets.every((f) => pairFacetCount.has(f.facet)));

// ---------------------------------------------------------------------------
// 3. Big Five → 16 型映射回归 + assess(deep) 冒烟
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

const deepAnswers: UserAnswers = {
  mbti: {},
  ipip: ipipBy('best'),
  lifestyle: {
    budget: '1500-2500',
    climate: 'temperate',
    pace: 'fast',
    size: 'metro',
    social: 'high',
    language: 'high-english',
    visa: 'high',
    remote: 'high',
    socialDepth: 'locals',
    paceShift: 'keep',
    sizeTrade: 'space',
    languageSink: 'dive',
    'f-pace-social': 'pace',
    'f-language-visa': 'language',
    'f-size-pace': 'size',
    'f-social-remote': 'remote',
    's-remote': '25-25-25-25',
    's-abroad': '25-25-25-25',
    'r-city': 'pace>social>remote>size',
    'r-bureaucracy': 'language>visa>size>remote',
  },
  interests: ['outdoor', 'food', 'startup', 'photo'],
  interestSubs: { outdoor: ['outdoor:hike', 'outdoor:cycling'], food: ['food:street'] },
};

const proResult = assess(deepAnswers);
check('assess(deep) version=pro', proResult.version === 'pro');
check('assess(deep) 含 proProfile', proResult.proProfile != null);
check('proProfile 域分全 100', proResult.proProfile != null && all100(proResult.proProfile));
check('pro typeCode 与映射一致', proResult.typeCode === 'ENFJ', proResult.typeCode);
check('Top5 输出 5 城', proResult.matches.length === 5);
check('匹配分范围合法', proResult.matches.every((m) => m.match >= 0 && m.match <= 99));
check('interestSubs 强化生效', reinforcedTags({ outdoor: ['outdoor:hike'] }).has('outdoor'));
check('未选子项不强化', !reinforcedTags({ outdoor: [] }).has('outdoor') && !reinforcedTags({}).has('food'));

// 兴趣强化对匹配分的实际影响（同作答、更多子项 → 匹配分不降低）
const noSubs = assess({ ...deepAnswers, interestSubs: undefined });
const withSubs = assess(deepAnswers);
const topNoSub = noSubs.matches[0]?.match ?? 0;
const topWithSub = withSubs.matches[0]?.match ?? 0;
check('选中子项后 Top1 匹配分 ≥ 无子项', topWithSub >= topNoSub, `${topNoSub} → ${topWithSub}`);

// ---------------------------------------------------------------------------
// 4. 深度段偏好 12 题（去重后）
// ---------------------------------------------------------------------------
section('4. 深度段生活偏好 12 题');
check('题量 = 12', proLifestyleQuestions.length === 12, `实际 ${proLifestyleQuestions.length}`);
check('题目 id 唯一', new Set(proLifestyleQuestions.map((q) => q.id)).size === proLifestyleQuestions.length);

const kinds = new Map<string, number>();
for (const q of proLifestyleQuestions) kinds.set(q.kind, (kinds.get(q.kind) ?? 0) + 1);
check(
  '四种题型齐备（choice/forced/slider/rank）',
  ['choice', 'forced', 'slider', 'rank'].every((k) => (kinds.get(k) ?? 0) >= 1),
  [...kinds.entries()].map(([k, n]) => `${k}:${n}`).join(' '),
);

const ORDINAL_KEYS = ['pace', 'size', 'social', 'language', 'visa', 'remote'];
const covered = new Set<string>();
for (const q of proLifestyleQuestions) {
  if (q.kind === 'choice') {
    for (const k of Object.keys(q.ordinalMap)) covered.add(k);
  } else if (q.kind === 'forced') {
    for (const k of Object.keys(q.ordinalMap)) covered.add(k);
  } else if (q.kind === 'slider') {
    for (const d of q.dims) covered.add(d.key);
  } else {
    for (const it of q.items) covered.add(it.value);
  }
}
check('6 个序数维全覆盖', ORDINAL_KEYS.every((k) => covered.has(k)), [...covered].sort().join(','));
check('budget/climate 不在深度段题库（已去重，由核心段区间题负责）', !covered.has('budget') && !covered.has('climate'));

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

// 去重：深度段偏好题 id 不与核心段 8 题冲突
const coreLsIds = new Set(lifestyleQuestions.map((q) => q.id));
check('深度段偏好题 id 与核心段 8 题无重叠', proLifestyleQuestions.every((q) => !coreLsIds.has(q.id)));
check('核心段偏好题 = 8', lifestyleQuestions.length === 8, `实际 ${lifestyleQuestions.length}`);
check('核心段 budget/climate 为区间选择（各 5 档）', ['budget', 'climate'].every((id) => (lifestyleQuestions.find((q) => q.id === id)?.options.length ?? 0) === 5));
check('核心段 6 个序数维为二元迫选（各 2 选项）', ['pace', 'size', 'social', 'language', 'visa', 'remote'].every((id) => (lifestyleQuestions.find((q) => q.id === id)?.options.length ?? 0) === 2));

// ---------------------------------------------------------------------------
// 5. 兴趣标签（核心 16 + 深度 12，去重）
// ---------------------------------------------------------------------------
section('5. 兴趣标签与二级细化');
check('核心标签 = 16', interestTags.length === 16, `实际 ${interestTags.length}`);
check('深度标签 = 12', interestTagsPro.length === 12, `实际 ${interestTagsPro.length}`);
check('标签 id 唯一', new Set(interestTagsPro.map((t) => t.id)).size === interestTagsPro.length);
check('每标签 label/desc 非空', interestTagsPro.every((t) => t.label.trim() && t.desc.trim().length > 0));
const coreTagIds = new Set(interestTags.map((t) => t.id));
check('深度标签与核心 16 标签无重叠', interestTagsPro.every((t) => !coreTagIds.has(t.id)));

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

const boosted = reinforcedTags({ outdoor: ['outdoor:hike', 'outdoor:cycling'], food: [] });
check('reinforcedTags 只强化有选中子项的一级', boosted.has('outdoor') && !boosted.has('food'));

// ---------------------------------------------------------------------------
// 5b. RIASEC 30 题 + IPIP Risk-Taking 10 题（接入性断言）
// ---------------------------------------------------------------------------
section('5b. 第八轮量表接入');
check('RIASEC 题量 = 30（六维 × 5）', riasecQuestions.length === 30 && RIASEC_DIMS.length === 6 && RIASEC_PER_DIM === 5);
check('Risk-Taking 题量 = 10', riskQuestions.length === 10);
check(
  '两量表 ref（英文原句）全部非空',
  riasecQuestions.every((q) => q.ref.trim().length > 0) && riskQuestions.every((q) => q.ref.trim().length > 0),
);
check(
  '两量表题 id 不与 IPIP/偏好题冲突',
  new Set([...riasecQuestions, ...riskQuestions, ...ipipPairs, ...proLifestyleQuestions].map((q) => q.id)).size ===
    30 + 10 + 60 + 12,
);

// ---------------------------------------------------------------------------
// 6. 融合题库：统一入口 + 深度派生（isDeep 由 IPIP 作答决定）
// ---------------------------------------------------------------------------
section('6. 融合题库：统一入口 + 深度派生');
{
  // 6.1 标准计分（无 IPIP）→ version=lite，无 proProfile
  const liteAnswers: UserAnswers = {
    mbti: Object.fromEntries(scenarioQuestions.map((q) => [q.id, 'a'])),
    lifestyle: {
      budget: '1500-2500', climate: 'temperate', pace: 'fast', size: 'metro',
      social: 'high', language: 'high-english', visa: 'high', remote: 'high',
    },
    interests: ['outdoor', 'food'],
  };
  const liteResult = assess(liteAnswers);
  check('标准段（无 IPIP）→ version = lite', liteResult.version === 'lite', liteResult.version);
  check('标准段无 BigFive proProfile', liteResult.proProfile == null);
  check('标准段 Top5 齐整', liteResult.matches.length === 5);

  // 6.2 isDeep 派生：仅当 ipip 非空才视为深化
  check('isDeep：空 ipip → false', !isDeep({ ...liteAnswers, ipip: {} }));
  check('isDeep：有 ipip 作答 → true', isDeep({ ...liteAnswers, ipip: { 'anxiety-p1': 'a' } }));

  // 6.3 深度段作答 → version=pro（标准 + 深度共用同一份 answers）
  const partialIpip = { 'anxiety-p1': 'a', 'anxiety-p2': 'b' };
  const fused: UserAnswers = { ...liteAnswers, ipip: partialIpip };
  const deepResult = assess(fused);
  check('含 IPIP 作答 → version = pro', deepResult.version === 'pro', deepResult.version);
  check('深度段附带 BigFive proProfile', deepResult.proProfile != null);

  // 6.4 标准段人格沿用 SJT 情境迫选，深度段改用 IPIP（同一份题库两种口径）
  check('标准段人格为合法 16 型码', /^[EI][SN][TF][JP]$/.test(liteResult.typeCode), liteResult.typeCode);
  check('深度段人格来自 IPIP（与 derivePersonalityPro 一致）', deepResult.typeCode === derivePersonalityPro(partialIpip).typeCode, deepResult.typeCode);
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------
console.log(`\n===== verify-quiz-v2: ${pass} passed, ${fail} failed =====`);
if (fail > 0) process.exit(1);
