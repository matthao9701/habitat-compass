import { useState } from 'react';
import type { ExcludedEntry } from '../../lib/constraints';

/**
 * ConstraintsNotice — 报告页顶部的硬性条件过滤说明（第六轮）
 * 「已按你的硬性条件排除 N 座城市」，可展开查看逐城原因；保证过滤可解释。
 */
export default function ConstraintsNotice({
  excluded,
  relaxed,
  overBudgetCount,
}: {
  excluded: ExcludedEntry[];
  relaxed: boolean;
  overBudgetCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="border-b hairline bg-clay/[0.06]">
      <div className="mx-auto max-w-almanac px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* 几何漏斗图标 */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-clay">
              <path d="M3 4h14l-5.5 6.5V16l-3-1.8v-3.7L3 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-[13.5px] font-medium leading-snug text-ink">
                已按你的硬性条件排除 <span className="font-data text-clay">{excluded.length}</span> 座城市
                {overBudgetCount > 0 ? (
                  <>，其中 <span className="font-data text-ochre">{overBudgetCount}</span> 座因剩余城市不足放宽保留（降权标注「超预算」）</>
                ) : null}
              </p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-soft">
                硬性条件在打分之前一票否决，不参与 30/48/22 权重；可返回测评前的「硬性条件」步骤修改后重算。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 font-mono text-[10.5px] text-clay underline-offset-4 hover:underline"
          >
            {open ? '收起明细 −' : '查看被排除原因 +'}
          </button>
        </div>

        {open ? (
          <ul className="mt-4 grid gap-x-8 gap-y-2 border-t hairline pt-4 sm:grid-cols-2">
            {excluded.map((e) => (
              <li key={e.cityId} className="flex items-baseline gap-2 text-[12px] leading-[1.7]">
                <span className="shrink-0 font-medium text-ink">{e.nameZh}</span>
                <span className="font-mono text-[10px] text-ink-soft">{e.countryZh}</span>
                <span className="text-ink-soft">— {e.reason}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {relaxed ? (
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
            放宽规则：预算过滤后剩余城市不足 5 座时，「超上限但差距 &lt; 15%」的城市保留进入打分，并在匹配分上扣减 3 分、标注「超预算」。
          </p>
        ) : null}
      </div>
    </section>
  );
}
