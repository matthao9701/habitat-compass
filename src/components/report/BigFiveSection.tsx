import { motion } from 'framer-motion';
import type { AssessmentResult, BigFiveProfile } from '../../lib/engine';
import { interestLabelById } from '../../data/interests';
import { interestLabelProById } from '../../data/interestsPro';
import * as storage from '../../lib/storage';

/**
 * 标准版报告增强：Big Five 五维剖面雷达 + 30 facets 条形 + 16 型映射说明卡
 * + 简易版结果对比（若做过）。
 */

const DOMAIN_LABEL: Record<string, string> = {
  E: '外向性 Extraversion',
  A: '宜人性 Agreeableness',
  C: '尽责性 Conscientiousness',
  N: '神经质 Neuroticism',
  O: '开放性 Openness',
};

const DOMAIN_ORDER: (keyof BigFiveProfile['domains'])[] = ['O', 'C', 'E', 'A', 'N'];

/** 映射说明：Big Five 域 → MBTI 字母（McCrae & Costa 1989 对应，中位 50 分界） */
const MAPPING_NOTES: { axis: string; from: string; rule: string }[] = [
  { axis: 'E / I', from: '外向性 Extraversion', rule: '百分位 ≥ 50 → E，否则 I' },
  { axis: 'S / N', from: '开放性 Openness', rule: '百分位 ≥ 50 → N（高开放偏向直觉），否则 S' },
  { axis: 'T / F', from: '宜人性 Agreeableness', rule: '百分位 ≥ 50 → F（高宜人偏向情感），否则 T' },
  { axis: 'J / P', from: '尽责性 Conscientiousness', rule: '百分位 ≥ 50 → J，否则 P' },
];

// ---------------------------------------------------------------------------
// 五边形雷达（Big Five 专用，值域 0-100）
// ---------------------------------------------------------------------------

function PentagonRadar({ values }: { values: { label: string; pct: number }[] }) {
  const cx = 130;
  const cy = 125;
  const r = 92;
  const point = (i: number, pct: number): [number, number] => {
    const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    const rr = (Math.max(0, Math.min(100, pct)) / 100) * r;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)];
  };
  const polygon = values.map((v, i) => point(i, v.pct).join(',')).join(' ');

  return (
    <svg viewBox="0 0 260 250" className="mx-auto w-full max-w-[320px]" role="img" aria-label="Big Five 五维剖面雷达图">
      {/* 网格：25/50/75/100 四圈五边形 */}
      {[25, 50, 75, 100].map((ring) => (
        <polygon
          key={ring}
          points={values.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="rgba(31,45,40,0.14)"
          strokeWidth="0.7"
        />
      ))}
      {/* 轴线 */}
      {values.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(31,45,40,0.14)" strokeWidth="0.7" />;
      })}
      {/* 数据面 */}
      <motion.polygon
        points={polygon}
        fill="rgba(190,90,56,0.18)"
        stroke="#BE5A38"
        strokeWidth="1.6"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* 顶点 */}
      {values.map((v, i) => {
        const [x, y] = point(i, v.pct);
        return <circle key={v.label} cx={x} cy={y} r="2.6" fill="#BE5A38" />;
      })}
      {/* 标签 */}
      {values.map((v, i) => {
        const [x, y] = point(i, 100);
        const dx = x > cx + 6 ? 8 : x < cx - 6 ? -8 : 0;
        const dy = y > cy ? 14 : y < cy - 6 ? -8 : 3;
        const anchor = x > cx + 6 ? 'start' : x < cx - 6 ? 'end' : 'middle';
        return (
          <text
            key={`label-${v.label}`}
            x={x + dx}
            y={y + dy}
            textAnchor={anchor}
            className="fill-ink-soft"
            fontSize="9"
            fontFamily="'IBM Plex Mono', monospace"
          >
            {v.label} {Math.round(v.pct)}
          </text>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// facets 条形行
// ---------------------------------------------------------------------------

function FacetBar({ label, pct }: { label: string; pct: number }) {
  const tag = pct >= 80 ? '高' : pct <= 20 ? '低' : null;
  const barColor = pct >= 80 ? 'bg-moss' : pct <= 20 ? 'bg-clay-deep' : 'bg-sea';
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-32 shrink-0 truncate text-[12.5px] text-ink md:w-40">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="w-9 shrink-0 text-right font-data text-[12px] tabular-nums text-ink-soft">
        {pct}
      </span>
      {tag ? (
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 font-data text-[9px] ${
            tag === '高' ? 'bg-moss/15 text-moss' : 'bg-clay-deep/15 text-clay-deep'
          }`}
        >
          {tag}
        </span>
      ) : (
        <span className="w-6 shrink-0" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 两版结果对比
// ---------------------------------------------------------------------------

function LiteCompareCard({ result }: { result: AssessmentResult }) {
  const lite = storage.loadHistory();
  if (!lite) {
    return (
      <div className="rounded-xl border hairline bg-card/70 p-5">
        <p className="eyebrow mb-2">cross-version compare</p>
        <h3 className="mb-2 font-heading text-base font-bold text-ink">两版结果对比</h3>
        <p className="text-[13px] leading-relaxed text-ink-soft">
          你还没有做过免费的简易版测评。完成简易版（约 8 分钟）后，
          这里会并排对比两套题库给出的人格类型与兴趣差异。
        </p>
      </div>
    );
  }

  const sameType = lite.result.typeCode === result.typeCode;
  const liteInterests = new Set(lite.result.interests);
  const proOnly = result.interests.filter((t) => !liteInterests.has(t));
  const shared = result.interests.filter((t) => liteInterests.has(t));
  const liteOnly = lite.result.interests.filter((t) => !result.interests.includes(t));
  const labelOf = (id: string): string =>
    interestLabelById.get(id) ?? interestLabelProById.get(id) ?? id;

  return (
    <div className="rounded-xl border hairline bg-card/70 p-5">
      <p className="eyebrow mb-2">cross-version compare</p>
      <h3 className="mb-4 font-heading text-base font-bold text-ink">两版结果对比</h3>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-paper p-3.5">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
            简易版（OEJTS）
          </p>
          <p className="font-data text-lg font-semibold text-ink">{lite.result.typeCode}</p>
        </div>
        <div className="rounded-lg border border-ochre/50 bg-ochre/[0.06] p-3.5">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
            标准版（Big Five 映射）
          </p>
          <p className="font-data text-lg font-semibold text-ink">{result.typeCode}</p>
        </div>
      </div>

      <p
        className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
          sameType ? 'bg-moss/15 text-moss' : 'bg-ochre/15 text-ochre'
        }`}
      >
        {sameType ? '两版人格类型一致' : `两版类型不同：${lite.result.typeCode} → ${result.typeCode}`}
      </p>
      <p className="mb-4 text-[12px] leading-relaxed text-ink-soft">
        {sameType
          ? '两套独立量表收敛到同一类型，说明你的自我认知比较稳定；标准版的 30 facets 还提供了更细的强度剖面。'
          : '两套量表测的是同一份你，但题式与计分口径不同，类型出现偏移是正常现象——建议以标准版 30 facets 的强度分布为准，参考简易版的定性描述。'}
      </p>

      <div className="space-y-2 text-[12.5px] leading-relaxed">
        <p>
          <span className="font-medium text-ink">两版共同兴趣（{shared.length}）：</span>
          <span className="text-ink-soft">
            {shared.length ? shared.map(labelOf).join('、') : '无'}
          </span>
        </p>
        <p>
          <span className="font-medium text-ink">标准版新增（{proOnly.length}）：</span>
          <span className="text-ink-soft">{proOnly.length ? proOnly.map(labelOf).join('、') : '无'}</span>
        </p>
        <p>
          <span className="font-medium text-ink">简易版独有（{liteOnly.length}）：</span>
          <span className="text-ink-soft">{liteOnly.length ? liteOnly.map(labelOf).join('、') : '无'}</span>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主区块
// ---------------------------------------------------------------------------

export default function BigFiveSection({
  result,
  proProfile,
}: {
  result: AssessmentResult;
  proProfile: BigFiveProfile;
}) {
  const radarValues = DOMAIN_ORDER.map((d) => ({
    label: d,
    pct: proProfile.domains[d],
  }));

  // facets 按域分组展示
  const groups = DOMAIN_ORDER.map((d) => ({
    domain: d,
    facets: proProfile.facets.filter((f) => f.domain === d),
  }));
  const nPct = Math.round(proProfile.domains.N);

  return (
    <section className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
      <p className="eyebrow mb-3">big five profile · standard</p>
      <h2 className="mb-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
        Big Five 人格剖面
      </h2>
      <p className="mb-10 max-w-xl text-[13px] leading-relaxed text-ink-soft">
        基于 IPIP-NEO 120 题官方计分（+keyed / −keyed），30 个侧面聚合为五大域百分位（0-100）。
        引用：IPIP (Goldberg, 1999) / IPIP-NEO 120 (Johnson, 2014)，公有领域。
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* 左：雷达 + 映射说明 */}
        <div className="card-paper">
          <PentagonRadar values={radarValues} />
          <div className="mt-4 border-t hairline px-5 py-4">
            <p className="mb-3 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
              16 型映射（McCrae &amp; Costa 1989 对应）
            </p>
            <ul className="space-y-2 text-[12.5px] leading-relaxed">
              {MAPPING_NOTES.map((m) => (
                <li key={m.axis} className="flex items-start gap-2">
                  <span className="shrink-0 font-data font-medium text-clay">{m.axis}</span>
                  <span className="text-ink-soft">
                    ← {m.from}：{m.rule}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-paper-deep/60 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">关于神经质 N（{nPct}）：</span>
              它在 Big Five 中没有对应的 MBTI 字母——分数越高，面对陌生环境的压力波动越大。
              海外定居意味着重建日常秩序，N 偏高的话，建议优先考虑社区成熟、英语普及深的城市，
              并把「先试住 30 天」当作硬性流程。
            </p>
          </div>
        </div>

        {/* 右：30 facets */}
        <div className="card-paper px-5 py-6 md:px-7">
          <p className="mb-4 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
            30 facets · 高分（≥80 绿）/ 低分（≤20 红）标注
          </p>
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.domain}>
                <p className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-heading text-[13.5px] font-bold text-ink">
                    {DOMAIN_LABEL[g.domain]}
                  </span>
                  <span className="font-data text-[12px] tabular-nums text-ochre">
                    {Math.round(proProfile.domains[g.domain])}
                  </span>
                </p>
                {g.facets.map((f) => (
                  <FacetBar key={f.facet} label={f.facetZh} pct={f.percentile} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 两版对比 */}
      <div className="mt-8">
        <LiteCompareCard result={result} />
      </div>
    </section>
  );
}
