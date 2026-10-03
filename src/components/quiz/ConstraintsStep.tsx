import { useState } from 'react';
import type { PassportCode } from '../../data/types';
import type { HardConstraints } from '../../lib/constraints';
import { DEFAULT_CONSTRAINTS, CNY_USD_RATE, budgetCapUSD } from '../../lib/constraints';
import { loadPassport, savePassport } from '../../lib/storage';
import { useI18n } from '../../i18n';

/** 护照/国籍选项（第九轮；免签快照目前仅覆盖中国大陆护照） */
export const PASSPORT_OPTIONS: PassportCode[] = [
  'CN', 'HK', 'MO', 'TW', 'SG', 'JP', 'US', 'GB', 'CA', 'AU', 'EU', 'OTHER',
];

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
  const { t } = useI18n();
  // 旧存档可能缺 passport 字段（第六轮结构）→ 用 storage 记忆或默认值补齐
  const [hc, setHc] = useState<HardConstraints>(() => {
    if (initial == null) return DEFAULT_CONSTRAINTS;
    return { ...DEFAULT_CONSTRAINTS, ...initial, passport: initial.passport ?? loadPassport() };
  });
  const capUsd = budgetCapUSD(hc);

  const anyApplied = hc.budgetCap != null || hc.visaLine !== 'none' || hc.safetyEnabled;

  function pickPassport(code: PassportCode): void {
    savePassport(code);
    setHc((prev) => ({ ...prev, passport: code }));
  }

  return (
    <div className="mx-auto max-w-almanac px-6 pb-20 pt-10 md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-3">00 / hard constraints</p>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t('cons.title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
          {t('cons.intro')}
        </p>

        {/* a. 月预算上限 */}
        <section className="mt-8 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">{t('cons.budget')}</h3>
            <span className="font-data text-xs text-ink-soft">{t('cons.optional')}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('cons.budget.placeholder')}
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
                  {cur === 'CNY' ? t('cons.budgetUnitCNY') : t('cons.budgetUnitUSD')}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {hc.budgetCap != null && capUsd != null
              ? t('cons.budget.hint', { rate: CNY_USD_RATE, cap: capUsd.toLocaleString('en-US') })
              : t('cons.budget.none')}
          </p>
        </section>

        {/* a2. 护照/国籍（第九轮）：决定签证底线的护照视角 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">{t('passport.label')}</h3>
            <span className="font-data text-xs text-ink-soft">{t('cons.optional')}</span>
          </div>
          <div className="mt-4">
            <select
              value={hc.passport}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => pickPassport(e.target.value as PassportCode)}
              aria-label={t('passport.label')}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-clay md:text-base"
            >
              {PASSPORT_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {t(`passport.${code}`)}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              {hc.passport === 'CN' ? t('passport.hintCn') : t('passport.hintOther')}
            </p>
          </div>
        </section>

        {/* b. 签证底线 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-base font-bold md:text-lg">{t('cons.visa')}</h3>
            <span className="font-data text-xs text-ink-soft">{t('cons.visa.pill')}</span>
          </div>
          <div className="mt-4 grid gap-2">
            {(
              [
                { v: 'visaFree', label: t('cons.visa.visaFree'), desc: t('cons.visa.visaFree.desc') },
                { v: 'official', label: t('cons.visa.official'), desc: t('cons.visa.official.desc') },
                { v: 'alternative', label: t('cons.visa.alternative'), desc: t('cons.visa.alternative.desc') },
                { v: 'none', label: t('cons.visa.any'), desc: t('cons.visa.any.desc') },
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
            {t('cons.visa.hint')}
          </p>
        </section>

        {/* c. 安全底线 */}
        <section className="mt-4 rounded-xl border border-line bg-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-bold md:text-lg">{t('cons.safety')}</h3>
              <p className="mt-0.5 text-xs text-ink-soft">{t('cons.safety.hint')}</p>
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
                className="w-full accent-[#EE6C4D]"
              />
              <div className="mt-1 flex justify-between font-data text-xs text-ink-soft">
                <span>20</span>
                <span className="text-clay tabular-nums">{t('cons.safety.threshold', { v: hc.safetyThreshold })}</span>
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
            {t('cons.saveCta')}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
          >
            {anyApplied ? t('cons.skip') : t('cons.skipShort')}
          </button>
        </div>
        <p className="mt-4 font-data text-xs text-ink-soft">
          {t('cons.footer')}
        </p>
      </div>
    </div>
  );
}
