import { motion } from 'framer-motion';
import type { AssessmentResult, BigFiveProfile } from '../../lib/engine';
import { interestLabelById } from '../../data/interests';
import { interestLabelProById } from '../../data/interestsPro';
import * as storage from '../../lib/storage';
import { useI18n, translate, getCurrentLang } from '../../i18n';

/**
 * 标准版报告增强：Big Five 五维剖面雷达 + 30 facets 条形 + 16 型映射说明卡
 * + 简易版结果对比（若做过）。
 */

/** 域代码 → 双语标签（工厂：每次渲染期调用取当前语言） */
function domainLabel(domain: string): string {
  return translate(getCurrentLang(), 'report.bigfive.domain.' + domain);
}

const DOMAIN_ORDER: (keyof BigFiveProfile['domains'])[] = ['O', 'C', 'E', 'A', 'N'];

/** 映射说明：Big Five 域 → 四字母人格（McCrae & Costa 1989 对应，中位 50 分界） */
function buildMappingNotes(): { axis: string; from: string; rule: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { axis: 'E / I', from: L('report.bigfive.domain.E'), rule: L('report.bigfive.map.EI') },
    { axis: 'S / N', from: L('report.bigfive.domain.O'), rule: L('report.bigfive.map.SN') },
    { axis: 'T / F', from: L('report.bigfive.domain.A'), rule: L('report.bigfive.map.TF') },
    { axis: 'J / P', from: L('report.bigfive.domain.C'), rule: L('report.bigfive.map.JP') },
  ];
}

// ---------------------------------------------------------------------------
// 五边形雷达（Big Five 专用，值域 0-100）
// ---------------------------------------------------------------------------

function PentagonRadar({ values }: { values: { label: string; pct: number }[] }) {
  const { t } = useI18n();
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
    <svg viewBox="0 0 260 250" className="mx-auto w-full max-w-[320px]" role="img" aria-label={t('bf.radar.aria')}>
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
        stroke="#C96A52"
        strokeWidth="1.6"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* 顶点 */}
      {values.map((v, i) => {
        const [x, y] = point(i, v.pct);
        return <circle key={v.label} cx={x} cy={y} r="2.6" fill="#C96A52" />;
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
            fontFamily="'Manrope Variable', system-ui, sans-serif"
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
  const { t } = useI18n();
  const tag = pct >= 80 ? t('report.bigfive.high') : pct <= 20 ? t('report.bigfive.low') : null;
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
            tag === t('report.bigfive.high') ? 'bg-moss/15 text-moss-deep' : 'bg-clay-deep/15 text-clay-deep'
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
  const { t } = useI18n();
  const lite = storage.loadHistory();
  if (!lite) {
    return (
      <div className="rounded-xl border hairline bg-card/70 p-5">
        <p className="eyebrow mb-2">cross-version compare</p>
        <h3 className="mb-2 font-heading text-base font-bold text-ink">{t('report.bigfive.compare')}</h3>
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {t('bf.compare.empty')}
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
      <h3 className="mb-4 font-heading text-base font-bold text-ink">{t('report.bigfive.compare')}</h3>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-paper p-3.5">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
            {t('bf.compare.lite')}
          </p>
          <p className="font-data text-lg font-semibold text-ink">{lite.result.typeCode}</p>
        </div>
        <div className="rounded-lg border border-ochre/50 bg-ochre/[0.06] p-3.5">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
            {t('bf.compare.pro')}
          </p>
          <p className="font-data text-lg font-semibold text-ink">{result.typeCode}</p>
        </div>
      </div>

      <p
        className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
          sameType ? 'bg-moss/15 text-moss-deep' : 'bg-ochre/15 text-ochre-deep'
        }`}
      >
        {sameType ? t('report.bigfive.compare.same') : t('bf.compare.diff', { lite: lite.result.typeCode, pro: result.typeCode })}
      </p>
      <p className="mb-4 text-[12px] leading-relaxed text-ink-soft">
        {sameType
          ? t('report.bigfive.compare.same.desc')
          : t('report.bigfive.compare.diff.desc')}
      </p>

      <div className="space-y-2 text-[12.5px] leading-relaxed">
        <p>
          <span className="font-medium text-ink">{t('bf.compare.shared', { count: shared.length })}</span>
          <span className="text-ink-soft">
            {shared.length ? shared.map(labelOf).join('、') : t('common.none')}
          </span>
        </p>
        <p>
          <span className="font-medium text-ink">{t('bf.compare.proOnly', { count: proOnly.length })}</span>
          <span className="text-ink-soft">{proOnly.length ? proOnly.map(labelOf).join('、') : t('common.none')}</span>
        </p>
        <p>
          <span className="font-medium text-ink">{t('bf.compare.liteOnly', { count: liteOnly.length })}</span>
          <span className="text-ink-soft">{liteOnly.length ? liteOnly.map(labelOf).join('、') : t('common.none')}</span>
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
  const { t } = useI18n();
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
        {t('bf.title')}
      </h2>
      <p className="mb-10 max-w-xl text-[13px] leading-relaxed text-ink-soft">
        {t('bf.desc')}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* 左：雷达 + 映射说明 */}
        <div className="card-paper">
          <PentagonRadar values={radarValues} />
          <div className="mt-4 border-t hairline px-5 py-4">
            <p className="mb-3 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
              {t('bf.map.eyebrow')}
            </p>
            <ul className="space-y-2 text-[12.5px] leading-relaxed">
              {buildMappingNotes().map((m) => (
                <li key={m.axis} className="flex items-start gap-2">
                  <span className="shrink-0 font-data font-medium text-clay">{m.axis}</span>
                  <span className="text-ink-soft">
                    ← {m.from}：{m.rule}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-paper-deep/60 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">{t('bf.n.title', { pct: nPct })}</span>
              {t('bf.n.desc')}
            </p>
          </div>
        </div>

        {/* 右：30 facets */}
        <div className="card-paper px-5 py-6 md:px-7">
          <p className="mb-4 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
            {t('bf.facets.eyebrow')}
          </p>
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.domain}>
                <p className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-heading text-[13.5px] font-bold text-ink">
                    {domainLabel(g.domain)}
                  </span>
                  <span className="font-data text-[12px] tabular-nums text-ochre-deep">
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
