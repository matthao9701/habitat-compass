import { useState } from 'react';
import type { HardConstraints } from '../../lib/constraints';
import { DEFAULT_CONSTRAINTS, CNY_USD_RATE, budgetCapUSD } from '../../lib/constraints';

/**
 * ConstraintsStep — 测评前的「硬性条件」设置步骤（第六轮）
 * 三项均可留空/不开启 = 不过滤；保存后与测验进度同存 localStorage，可随时修改重算。
 */
export default function ConstraintsStep({
  initial,
  onApply,
  onSkip,
}: {
  initial: HardConstraints | null;
  onApply: (hc: HardConstraints) => void;
  onSkip: () => void;
}) {
  const [hc, setHc] = useState<HardConstraints>(initial ?? DEFAULT_CONSTRAINTS);
  const capUsd = budgetCapUSD(hc);

  const anyApplied = hc.budgetCap != null || hc.visaLine !== 'none' || hc.safetyEnabled;

  return (
    <div className="mx-auto max-w-almanac px-6 pb-20 pt-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-3">00 / hard constraints</p>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">先定硬性条件</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
          三项硬性条件会在打分之前做一票否决过滤——不符合的城市不会进入匹配，
          保证结果先满足底线、再谈性格契合。全部留空则不过滤。
        </p>

        {/* a. 月预算上限 */}
        <section className="mt-8 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">月预算上限</h3>
            <span className="font-data text-xs text-ink-soft">可留空</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="不限"
              value={hc.budgetCap ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                setHc((s) => ({ ...s, budgetCap: v != null && Number.isFinite(v) ? v : null }));
              }}
              className="w-36 rounded-lg border border-line bg-paper px-3 py-2 font-data text-base tabular-nums outline-none focus:border-clay"
            />
            <div className="flex overflow-hidden rounded-lg border border-line">
              {(['CNY', 'USD'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setHc((s) => ({ ...s, budgetCurrency: cur }))}
                  className={`px-3 py-2 font-data text-xs transition-colors ${
                    hc.budgetCurrency === cur ? 'bg-clay/10 text-clay' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {cur === 'CNY' ? `元 / 月` : 'USD / 月'}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {hc.budgetCap != null && capUsd != null
              ? `按近似汇率 1 USD ≈ ${CNY_USD_RATE} CNY 折算：月成本估算高于 $${capUsd.toLocaleString('en-US')} 的城市将被排除（排除后不足 5 城时，差距 15% 内的超预算城市会保留并降权标注）。`
              : '未设置预算上限——所有城市均参与匹配。'}
          </p>
        </section>

        {/* b. 签证底线 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">签证底线</h3>
            <span className="font-data text-xs text-ink-soft">三选一</span>
          </div>
          <div className="mt-4 grid gap-2">
            {(
              [
                { v: 'official', label: '必须有官方数字游民签证', desc: '仅保留签证档位为「官方签证」的城市' },
                { v: 'alternative', label: '接受长期居留替代路径', desc: '官方签证或长期居留/自雇路径均可' },
                { v: 'none', label: '不限', desc: '不按签证过滤' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setHc((s) => ({ ...s, visaLine: opt.v }))}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  hc.visaLine === opt.v
                    ? 'border-clay bg-clay/10'
                    : 'border-line bg-paper hover:border-ink/40'
                }`}
              >
                <span className={`block text-sm font-medium md:text-base ${hc.visaLine === opt.v ? 'text-clay' : 'text-ink'}`}>
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-ink-soft">{opt.desc}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            依据城市库的结构化签证档位（官方签证 / 替代路径 / 无）；档位未核实的城市在设底线时会被排除并在报告中注明。
          </p>
        </section>

        {/* c. 安全底线 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-bold md:text-lg">安全底线（Numbeo Safety）</h3>
              <p className="mt-0.5 text-xs text-ink-soft">低于阈值的城市排除；指数未核实的城市同样排除并注明</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hc.safetyEnabled}
              onClick={() => setHc((s) => ({ ...s, safetyEnabled: !s.safetyEnabled }))}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                hc.safetyEnabled ? 'border-clay bg-clay/20' : 'border-line bg-paper'
              }`}
            >
              <span
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
                  hc.safetyEnabled ? 'left-6 bg-clay' : 'left-1 bg-ink-soft'
                }`}
              />
            </button>
          </div>
          {hc.safetyEnabled && (
            <div className="mt-4">
              <input
                type="range"
                min={20}
                max={90}
                step={5}
                value={hc.safetyThreshold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHc((s) => ({ ...s, safetyThreshold: Number(e.target.value) }))}
                className="w-full accent-[#BE5A38]"
              />
              <div className="mt-1 flex justify-between font-data text-xs text-ink-soft">
                <span>20</span>
                <span className="text-clay tabular-nums">阈值 {hc.safetyThreshold} / 100</span>
                <span>90</span>
              </div>
            </div>
          )}
        </section>

        {/* 操作 */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onApply(hc)}
            className="rounded-full bg-clay px-7 py-3 text-sm font-medium text-paper shadow-sm transition-colors hover:bg-clay-deep md:text-base"
          >
            保存条件，开始测评
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
          >
            {anyApplied ? '清空条件并跳过' : '跳过（不过滤）'}
          </button>
        </div>
        <p className="mt-4 font-data text-xs text-ink-soft">
          条件会与测验进度一起保存在本地，之后可随时回来修改并重算。
        </p>
      </div>
    </div>
  );
}
