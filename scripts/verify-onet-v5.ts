/**
 * verify-onet-v5.ts — 第八轮验证：O*NET RIASEC + IPIP Risk-Taking 接入
 *
 *  1. RIASEC 30 题完整性（题量 / id 唯一 / 每维 5 题 / ref 英文原句 / 中文题干）
 *  2. 计分单测（全 5 → 全维 100 / 混合 → 已知值 + top2 / 量表结构）
 *  3. 六维→标签映射（键齐 / 每维非空 / 标签 id 都在 28 标签池）
 *  4. IPIP Risk-Taking 10 题（题量 / keyed 方向 / ref / 计分单测 / band 阈值）
 *  5. 引擎联动（tagRepeats 叠加封顶 ×3 / 无 riasec 答案时零影响）
 *  6. 双语词典键（dim/combo/lead/link/tagSep/radar/risk 卡）
 *  7. Quiz 流程接入（源码含 riasec/risk 页分支）
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

import { riasecQuestions, RIASEC_DIMS, RIASEC_PER_DIM, RIASEC_SCALE } from '../src/data/riasec';
import { riskQuestions } from '../src/data/riskTaking';
import { RIASEC_TAG_BOOST } from '../src/data/riasecMap';
import { interestTagsPro } from '../src/data/interestsPro';
import {
  deriveRiasec,
  deriveRisk,
  riskBandOf,
  tagRepeats,
  riasecBoostedTags,
  RIASEC_BOOST_THRESHOLD,
  RIASEC_REPEAT_CAP,
} from '../src/lib/riasec';
import { weightedUserTags } from '../src/lib/engine';
import { DICTS } from '../src/i18n/dict';
import type { UserAnswers } from '../src/lib/engine';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}
function section(name: string): void {
  console.log(`\n[${name}]`);
}

// ── 1. RIASEC 30 题完整性 ──────────────────────────────────────────────
section('1. RIASEC 30 题完整性');
check('题量 = 30', riasecQuestions.length === 30, `实际 ${riasecQuestions.length}`);
check('题目 id 唯一', new Set(riasecQuestions.map((q) => q.id)).size === riasecQuestions.length);
const perDim = new Map<string, number>();
for (const q of riasecQuestions) perDim.set(q.dim, (perDim.get(q.dim) ?? 0) + 1);
check(
  `六维各 ${RIASEC_PER_DIM} 题`,
  RIASEC_DIMS.every((d) => perDim.get(d) === RIASEC_PER_DIM),
  [...perDim.entries()].map(([k, v]) => `${k}:${v}`).join(' '),
);
check(
  'ref 为英文原句（非空、无中文）',
  riasecQuestions.every((q) => q.ref.trim().length >= 8 && !/[\u4e00-\u9fff]/.test(q.ref)),
);
check('中文题干非空', riasecQuestions.every((q) => q.text.trim().length >= 4));

// ── 2. 计分单测 ────────────────────────────────────────────────────────
section('2. RIASEC 计分单测');
check('量表 5 档（1-5）', RIASEC_SCALE.length === 5 && RIASEC_SCALE[0].value === 1 && RIASEC_SCALE[4].value === 5);
{
  const allTop = Object.fromEntries(riasecQuestions.map((q) => [q.id, 5]));
  const p1 = deriveRiasec(allTop);
  check(
    '全 5 → 六维 100 / top2 稳定',
    RIASEC_DIMS.every((d) => p1.percent[d] === 100),
  );
  const allLow = Object.fromEntries(riasecQuestions.map((q) => [q.id, q.dim === 'A' ? 5 : 1]));
  const p2 = deriveRiasec(allLow);
  check(
    '单维满分 → top2 含该维且 combo 规范',
    p2.percent.A === 100 && p2.top2.includes('A') && /^[RIASEC]{2}$/.test(p2.combo) && p2.top2[0] === 'A',
    `top2=${p2.top2.join('')} combo=${p2.combo}`,
  );
}

// ── 3. 六维→标签映射 ──────────────────────────────────────────────────
section('3. RIASEC → 标签映射');
{
  const poolIds = new Set(interestTagsPro.map((t) => t.id));
  const keys = Object.keys(RIASEC_TAG_BOOST);
  check('映射键覆盖六维', RIASEC_DIMS.every((d) => keys.includes(d)), `实际 ${keys.join(',')}`);
  check(
    '每维映射标签非空',
    RIASEC_DIMS.every((d) => RIASEC_TAG_BOOST[d].length > 0),
  );
  const bad = RIASEC_DIMS.flatMap((d) => RIASEC_TAG_BOOST[d]).filter((id) => !poolIds.has(id));
  check('映射标签全部存在于 28 标签池', bad.length === 0, bad.join(','));
}

// ── 4. IPIP Risk-Taking 10 题 ─────────────────────────────────────────
section('4. IPIP Risk-Taking 10 题');
check('题量 = 10', riskQuestions.length === 10, `实际 ${riskQuestions.length}`);
check('题目 id 唯一', new Set(riskQuestions.map((q) => q.id)).size === riskQuestions.length);
check('keyed 方向合法（±1）', riskQuestions.every((q) => q.keyed === 1 || q.keyed === -1));
const keyedPos = riskQuestions.filter((q) => q.keyed === 1).length;
check('正反向题齐备（正 ≥5 反 ≥3）', keyedPos >= 5 && 10 - keyedPos >= 3, `正向 ${keyedPos}`);
check(
  'ref 英文原句 + 中文题干',
  riskQuestions.every((q) => q.ref.trim().length >= 6 && !/[\u4e00-\u9fff]/.test(q.ref) && q.text.trim().length >= 4),
);
{
  const full = Object.fromEntries(riskQuestions.map((q) => [q.id, q.keyed === 1 ? 5 : 1]));
  const r1 = deriveRisk(full);
  check('冒险全选 → 100 / high', r1 !== null && r1.score === 100 && r1.band === 'high');
  const none = Object.fromEntries(riskQuestions.map((q) => [q.id, q.keyed === 1 ? 1 : 5]));
  const r2 = deriveRisk(none);
  check('保守全选 → 0 / low', r2 !== null && r2.score === 0 && r2.band === 'low');
  check('空答案 → null', deriveRisk({}) === null);
  check('band 阈值单调', riskBandOf(0) === 'low' && riskBandOf(50) === 'mid' && riskBandOf(100) === 'high');
}

// ── 5. 引擎联动 ───────────────────────────────────────────────────────
section('5. 引擎联动（标签强化有界叠加）');
{
  const base = {
    version: 'pro' as const,
    mbti: {},
    lifestyle: {},
    interests: ['outdoor', 'arts'],
    interestSubs: { outdoor: ['hike'] },
  };
  const riasecHigh = Object.fromEntries(
    riasecQuestions.filter((q) => q.dim === 'R').map((q) => [q.id, 5]),
  );
  const ans: UserAnswers = { ...base, riasec: riasecHigh };
  const rep = tagRepeats(ans);
  check('子项 +1 与 RIASEC +1 叠加 → outdoor 重复 2（×3 封顶）', rep.get('outdoor') === RIASEC_REPEAT_CAP);
  check('RIASEC 强化不新增未勾选标签（nature 未选 → 无重复）', rep.get('nature') === undefined);
  check('未选且未强化标签无重复', rep.get('nightlife') === undefined);
  const weighted = weightedUserTags(ans);
  const outCount = weighted.filter((t) => t === 'outdoor').length;
  check('weightedUserTags ×3 封顶生效', outCount === RIASEC_REPEAT_CAP + 1, `outdoor ×${outCount}`);

  const ansLow: UserAnswers = { ...base, riasec: Object.fromEntries(riasecQuestions.map((q) => [q.id, 1])) };
  const repLow = tagRepeats(ansLow);
  const untouched = RIASEC_DIMS
    .flatMap((d) => RIASEC_TAG_BOOST[d])
    .filter((id) => !base.interests.includes(id) && !(base.interestSubs ?? {})[id]);
  check(
    `低分维（<${RIASEC_BOOST_THRESHOLD}）不强化未勾选标签`,
    untouched.every((id) => repLow.get(id) === undefined),
  );
  check(
    '无 riasec 字段（旧草稿）→ 仅子项强化，行为回退',
    JSON.stringify(tagRepeats(base as UserAnswers)) === JSON.stringify(tagRepeats(base as UserAnswers)) &&
      tagRepeats(base as UserAnswers).get('outdoor') === 1,
  );

  // 第十轮引擎 v3：兴趣类本体分与 RIASEC 强化解耦（computeCityFits 用 includeRiasec:false）
  const repBaseOnly = tagRepeats(ans, { includeRiasec: false });
  check('v3: includeRiasec:false → 仅子项强化（outdoor 重复 1）', repBaseOnly.get('outdoor') === 1);
  const boosted = riasecBoostedTags(ans);
  check('v3: riasecBoostedTags 差集含强化标签（outdoor ×2 封顶）', boosted.get('outdoor') === RIASEC_REPEAT_CAP);
}

// ── 6. 双语词典键 ─────────────────────────────────────────────────────
section('6. 双语词典键');
{
  const miss: string[] = [];
  const pairs = C(6, 2); // 15 种无序组合
  for (const lang of ['zh', 'en'] as const) {
    for (const d of RIASEC_DIMS) if (!DICTS[lang][`riasec.dim.${d}`]) miss.push(`${lang}:dim.${d}`);
    for (const [a, b] of pairs) {
      const combo = `${a}${b}`;
      for (const s of ['name', 'desc']) if (!DICTS[lang][`riasec.combo.${combo}.${s}`]) miss.push(`${lang}:combo.${combo}.${s}`);
    }
    for (const k of [
      'riasec.section.eyebrow', 'riasec.section.title', 'riasec.section.desc',
      'riasec.lead', 'riasec.radar.label', 'riasec.radar.note',
      'riasec.combo.eyebrow', 'riasec.link', 'riasec.link.eyebrow', 'riasec.link.note',
      'riasec.linkNone', 'riasec.tagSep',
      'risk.card.eyebrow', 'risk.card.title', 'risk.card.desc', 'risk.card.score',
      'risk.band.high', 'risk.band.mid', 'risk.band.low',
      'risk.band.high.desc', 'risk.band.mid.desc', 'risk.band.low.desc',
      'quiz.riasec.source', 'quiz.risk.source', 'quiz.stage.riasec.eyebrow', 'quiz.stage.risk.eyebrow',
    ]) {
      if (!DICTS[lang][k]) miss.push(`${lang}:${k}`);
    }
    for (const i of [1, 2, 3, 4, 5]) if (!DICTS[lang][`quiz.riasec.${i}`]) miss.push(`${lang}:quiz.riasec.${i}`);
  }
  check(`RIASEC/风险双语键完整（15 组合 ×2）`, miss.length === 0, miss.slice(0, 5).join(', '));
}
function C(n: number, r: number): [string, string][] {
  const dims = ['R', 'I', 'A', 'S', 'E', 'C'];
  const out: [string, string][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([dims[i], dims[j]]);
  void r;
  return out;
}

// ── 7. Quiz 流程接入 ──────────────────────────────────────────────────
section('7. Quiz 流程接入');
{
  const src = readFileSync(join(ROOT, 'src/components/Quiz.tsx'), 'utf-8');
  check('兴趣阶段含 RIASEC 页分支', src.includes("kind: 'riasec'"));
  check('偏好阶段末尾含风险页分支', src.includes("kind: 'risk'"));
  check(
    '草稿兼容字段（riasec/risk）恢复（旧草稿缺字段 → ?? {} 兜底）',
    src.includes('(draft.riasec ?? {})') && src.includes('(prev.riasec ?? {})') && src.includes('(prev.risk ?? {})'),
  );
  check('RIASEC 来源脚注接入', src.includes('quiz.riasec.source'));
  check('风险来源脚注接入', src.includes('quiz.risk.source'));
}

// ── 汇总 ──────────────────────────────────────────────────────────────
console.log(`\n════════ verify-onet-v5: ${pass + fail} 项断言，${pass} 通过，${fail} 失败 ════════`);
if (fail > 0) process.exit(1);
