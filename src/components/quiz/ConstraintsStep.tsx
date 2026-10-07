import { useId, useMemo, useState } from 'react';
import type { PassportCode } from '../../data/types';
import type { HardConstraints } from '../../lib/constraints';
import {
  DEFAULT_CONSTRAINTS,
  CNY_USD_RATE,
  VISA_LINE_ORDER,
  applyHardConstraints,
  budgetCapUSD,
} from '../../lib/constraints';
import { cities as CITIES } from '../../data';
import { loadPassport, savePassport } from '../../lib/storage';
import { useI18n } from '../../i18n';

/** 护照/国籍选项（第九轮；免签快照目前仅覆盖中国大陆护照） */
export const PASSPORT_OPTIONS: PassportCode[] = [
  'CN', 'HK', 'MO', 'TW', 'SG', 'JP', 'US', 'GB', 'CA', 'AU', 'EU', 'OTHER',
];

/** 常见月度预算档（点击即填，省去手动输入） */
const BUDGET_PRESETS = {
  CNY: [5000, 8000, 12000, 20000],
  USD: [700, 1100, 1700, 2800],
} as const;

/** 签证底线的徽标色：免签最宽松、受限最严格 */
const VISA_TONE: Record<(typeof VISA_LINE_ORDER)[number], string> = {
  visaFree: 'border-moss-deep bg-moss/15 text-moss-deep',
  official: 'border-sea-deep bg-sea/15 text-sea-deep',
  alternative: 'border-ochre-deep bg-ochre/15 text-ochre-deep',
  none: 'border-ink/45 bg-ink/[0.06] text-ink',
};

/** 预估剩余城市少于该数即提示「条件偏严」，避免用户带着过窄的条件进测评 */
const NARROW_KEEP = 10;

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * ConstraintsStep — 测评前的「硬性条件」设置（第六轮，第十四轮简明化改版）
 *
 * 改版要点：把三张长说明卡收敛为「单行摘要 + 计分项 + 折叠规则」，
 * 并接上引擎做「即时预估」——调参时立刻看到预计保留城市数，避免盲调。
 * 三项条件均可留空/关闭 = 不过滤；保存后与测验进度同存 localStorage，可随时修改重算。
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
  const { t } = useI18n();
  const budgetInputId = useId();
  // 旧存档可能缺 passport 字段（第六轮结构）→ 用 storage 记忆或默认值补齐
  const [hc, setHc] = useState<HardConstraints>(() => {
    if (initial == null) return DEFAULT_CONSTRAINTS;
    return { ...DEFAULT_CONSTRAINTS, ...initial, passport: initial.passport ?? loadPassport() };
  });
  // 进阶设置（护照 / 筛选规则说明）默认收起，让首屏只留三件事
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const capUsd = budgetCapUSD(hc);
  const anyApplied = hc.budgetCap != null || hc.visaLine !== 'none' || hc.safetyEnabled;

  // 即时预估：直接复用引擎的过滤层，保证预览与最终报告口径一致
  const preview = useMemo(
    () => applyHardConstraints(CITIES, anyApplied ? hc : null),
    [hc, anyApplied],
  );
  const activeCount = [hc.budgetCap != null, hc.visaLine !== 'none', hc.safetyEnabled].filter(
    Boolean,
  ).length;

  function pickPassport(code: PassportCode): void {
    savePassport(code);
    setHc((prev) => ({ ...prev, passport: code }));
  }

  function resetAll(): void {
    setHc({ ...DEFAULT_CONSTRAINTS, passport: hc.passport });
  }

  const preset = BUDGET_PRESETS[hc.budgetCurrency];

  return (
    <div className="mx-auto max-w-almanac px-6 pb-20 pt-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-3">00 / hard constraints</p>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t('cons.title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">{t('cons.subtitle')}</p>

        {/* 摘要条：一屏交代「当前筛选了什么 / 预计还剩多少城」 */}
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-card px-4 py-3.5 md:px-5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${anyApplied ? 'bg-clay' : 'bg-moss'}`}
            aria-hidden="true"
          />
          <p className="font-data text-[13px] tabular-nums text-ink">
            {!anyApplied
              ? t('cons.summary.none')
              : preview.kept.length < NARROW_KEEP
                ? t('cons.summary.narrow', { n: activeCount, keep: preview.kept.length })
                : t('cons.summary.active', { n: activeCount, keep: preview.kept.length })}
          </p>
          <span className="hidden text-ink-soft/50 md:inline" aria-hidden="true">
            ·
          </span>
          <p className="w-full text-[11.5px] leading-relaxed text-ink-soft md:w-auto">
            {t('cons.previewNote')}
          </p>
        </div>

        {/* 1 · 月预算上限 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">{t('cons.budget')}</h3>
            <span className="font-data text-xs text-ink-soft">{t('cons.optional')}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              id={budgetInputId}
              type="number"
              min={0}
              inputMode="numeric"
              aria-label={t('cons.budget')}
              placeholder={t('cons.budget.placeholder')}
              value={hc.budgetCap ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                setHc((s) => ({ ...s, budgetCap: v != null && Number.isFinite(v) ? v : null }));
              }}
              className="w-36 rounded-lg border border-line bg-paper px-3 py-2.5 font-data text-base tabular-nums outline-none transition-colors focus:border-clay"
            />
            <div className="flex overflow-hidden rounded-lg border border-line">
              {(['CNY', 'USD'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  aria-pressed={hc.budgetCurrency === cur}
                  onClick={() => setHc((s) => ({ ...s, budgetCurrency: cur }))}
                  className={`min-h-[44px] px-3.5 font-data text-xs transition-colors ${
                    hc.budgetCurrency === cur ? 'bg-clay/10 text-clay' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {cur === 'CNY' ? t('cons.budgetUnitCNY') : t('cons.budgetUnitUSD')}
                </button>
              ))}
            </div>
          </div>

          {/* 档位快填 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {preset.map((amount) => {
              const selected = hc.budgetCap === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setHc((s) => ({ ...s, budgetCap: s.budgetCap === amount ? null : amount }))}
                  className={`min-h-[44px] rounded-full border px-3.5 font-data text-[12px] tabular-nums transition-colors ${
                    selected
                      ? 'border-clay bg-clay/10 text-clay'
                      : 'border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {hc.budgetCurrency === 'CNY' ? `¥${fmt(amount)}` : `$${fmt(amount)}`}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {hc.budgetCap != null && capUsd != null
              ? t('cons.budget.active', { rate: CNY_USD_RATE, cap: fmt(capUsd) })
              : t('cons.budget.none')}
          </p>
        </section>

        {/* 2 · 签证底线（原四张说明卡 → 四枚可选徽标） */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">{t('cons.visa')}</h3>
            <span className="font-data text-xs text-ink-soft">{t('cons.visa.pill')}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('cons.visa')}>
            {[
              { v: 'visaFree', label: t('cons.visa.quick.visaFree') },
              { v: 'official', label: t('cons.visa.quick.official') },
              { v: 'alternative', label: t('cons.visa.quick.alternative') },
              { v: 'none', label: t('cons.visa.quick.none') },
            ].map((opt) => {
              const selected = hc.visaLine === opt.v;
              return (
                <button
                  key={opt.v}
                  type="button"
                  aria-pressed={selected}
                  aria-label={opt.label}
                  onClick={() =>
                    setHc((s) => ({ ...s, visaLine: s.visaLine === opt.v ? 'none' : (opt.v as typeof s.visaLine) }))
                  }
                  className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-[13.5px] transition-colors ${
                    selected ? VISA_TONE[opt.v as keyof typeof VISA_TONE] : 'border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3 · 安全底线 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">{t('cons.safety')}</h3>
            <button
              type="button"
              role="switch"
              aria-checked={hc.safetyEnabled}
              aria-label={t('cons.safety')}
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
                aria-label={t('cons.safety')}
                value={hc.safetyThreshold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHc((s) => ({ ...s, safetyThreshold: Number(e.target.value) }))}
                className="h-6 w-full accent-[#EE6C4D]"
              />
              <div className="mt-1 flex justify-between font-data text-xs text-ink-soft">
                <span>20</span>
                <span className="text-clay tabular-nums">{t('cons.safety.threshold', { v: hc.safetyThreshold })}</span>
                <span>90</span>
              </div>
            </div>
          )}
        </section>

        {/* 进阶：护照 + 筛选规则（默认收起） */}
        <section className="mt-4 rounded-xl border border-line bg-card">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            aria-controls={`${budgetInputId}-advanced`}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left md:px-6"
          >
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-heading text-sm font-bold text-ink md:text-base">
                {t('cons.advanced.toggle')}
              </span>
              <span className="inline-flex items-center rounded-full border border-line bg-paper px-2.5 py-0.5 font-data text-[11px] text-ink-soft">
                {t('cons.summary.passport', { label: t(`passport.${hc.passport}`) })}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`shrink-0 font-mono text-xs text-ink-soft transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>

          {advancedOpen && (
            <div id={`${budgetInputId}-advanced`} className="border-t hairline px-5 py-5 md:px-6">
              <label htmlFor={`${budgetInputId}-passport`} className="font-heading text-sm font-bold text-ink">
                {t('passport.label')}
              </label>
              <select
                id={`${budgetInputId}-passport`}
                value={hc.passport}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => pickPassport(e.target.value as PassportCode)}
                className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-clay md:text-base"
              >
                {PASSPORT_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {t(`passport.${code}`)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                {hc.passport === 'CN' ? t('passport.hintCn') : t('passport.hintOther')}
              </p>

              <p className="mt-5 font-heading text-sm font-bold text-ink">{t('cons.rule.title')}</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-soft">
                <li>{t('cons.rule.budget')}</li>
                <li>{t('cons.rule.visa')}</li>
                <li>{t('cons.rule.safety')}</li>
              </ul>

              <p className="mt-5 text-xs leading-relaxed text-ink-soft">{t('cons.footer')}</p>
            </div>
          )}
        </section>

        {/* 操作 */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => onApply(hc)} className="btn-clay text-sm md:text-base">
            {t('cons.saveCta')}
          </button>
          {anyApplied && (
            <button
              type="button"
              onClick={resetAll}
              className="min-h-[44px] text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
            >
              {t('cons.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={onSkip}
            className={`text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink ${anyApplied ? 'ml-auto' : ''}`}
          >
            {anyApplied ? t('cons.skip') : t('cons.skipShort')}
          </button>
        </div>
      </div>
    </div>
  );
}
