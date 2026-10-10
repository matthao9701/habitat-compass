// ABOUTME: 税负测算子页面（V2 多国累进税率沙盒）——左输入，右「净收入 / 累进明细 / 税制类型 / 多留存」输出。
// 唯一事实源：src/data/taxBrackets.ts（分级税率，本币口径）+ src/data/taxRules.ts（粗颗粒兜底）+ src/lib/tax.ts（纯函数）。
// 已录入分级数据的国家走逐档累加引擎，并可选开关特惠税制；其余国家回落 V1 粗颗粒估算。
// 不依赖任何第三方付费 API；结论为方向性估算，页面显著位置声明非税务建议。
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cities } from '../data';
import type { City } from '../data/types';
import { cityName, cityCountryName } from '../lib/format';
import { estimateTax, applicableRegime, taxProfileForCity, type IncomeNature } from '../lib/tax';
import { TAX_BASELINE_EFF_RATE, TAX_REGIME_TYPES } from '../data/taxRules';
import { TAX_FX_ASOF } from '../data/taxBrackets';
import { useI18n } from '../i18n';
import { REGION_ORDER } from '../data/regions';

const ease = [0.22, 1, 0.36, 1] as const;

interface TaxPlannerProps {
  /** 预置目标城市（来自报告内嵌 CTA / URL 参数）；未命中回落到默认城 */
  initialCityId?: string | null;
  /** 返回测评/结果（可选入口） */
  onOpenQuiz?: () => void;
}

const DEFAULT_CITY_ID = 'chiang-mai';
const INCOME_MIN = 10000;
const INCOME_MAX = 250000;
const INCOME_STEP = 1000;
const DEFAULT_INCOME = 50000;

const NATURES: IncomeNature[] = ['employee', 'freelance', 'founder'];

/** 税制类型 → 标签配色（实心浅底 + 深色文字，与全站 chip 口径一致） */
const REGIME_STYLE: Record<string, string> = {
  exempt: 'border-moss-deep/45 bg-moss/10 text-moss-deep',
  territorial: 'border-sea-deep/45 bg-sea/10 text-sea-deep',
  concession: 'border-ochre-deep/45 bg-ochre/10 text-ochre-deep',
  standard: 'border-ink/25 bg-ink/[0.04] text-ink-soft',
};

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function cny(usdValue: number): string {
  return `¥${Math.round(usdValue * 7.2).toLocaleString('en-US')}`;
}
/** 本地货币金额（Intl 格式化；异常时回落「数值 + 代码」） */
function localMoney(n: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n).toLocaleString('en-US')} ${currency}`;
  }
}

export default function TaxPlanner({ initialCityId, onOpenQuiz }: TaxPlannerProps) {
  const { t, lang } = useI18n();
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const initial = cities.find((c) => c.id === initialCityId) ?? cities.find((c) => c.id === DEFAULT_CITY_ID) ?? cities[0];
  const [cityId, setCityId] = useState<string>(initial?.id ?? '');
  const [gross, setGross] = useState<number>(DEFAULT_INCOME);
  const [nature, setNature] = useState<IncomeNature>('employee');
  const [applySpecial, setApplySpecial] = useState<boolean>(true);

  const city: City | undefined = useMemo(() => cities.find((c) => c.id === cityId) ?? initial, [cityId, initial]);
  const result = useMemo(
    () => (city ? estimateTax(city, gross, nature, { applySpecial }) : null),
    [city, gross, nature, applySpecial],
  );
  // 该国是否有适用于当前收入性质的特惠税制（决定是否显示开关）
  const specialAvailable = useMemo(() => {
    const profile = city ? taxProfileForCity(city) : null;
    return profile ? applicableRegime(profile, nature) : null;
  }, [city, nature]);

  // 城市下拉按大洲分组（原生 select + optgroup，移动端体验最稳）
  // 语言切换时重建排序（cityName 依赖当前语言，lang 作为响应式信号）
  const grouped = useMemo(
    () =>
      REGION_ORDER.map((r) => ({
        r,
        items: cities.filter((c) => c.region === r).sort((a, b) => cityName(a).localeCompare(cityName(b))),
      })).filter((g) => g.items.length > 0),
    [lang],
  );

  if (!city || !result) return null;

  const rule = result.rule;
  const regimeLabel = rule ? t(`tax.regime.${rule.type}`) : t('tax.regime.standard');
  const regimeNote = rule ? t(`tax.regime.note.${rule.type}`) : t('tax.out.noData');
  const chipStyle = REGIME_STYLE[rule?.type ?? 'standard'];
  const saved = result.savedVsBaselineUSD;
  const savedPositive = saved >= 0;
  const cur = result.currency;
  const localFmt = (v: number) => (cur ? localMoney(v, cur, locale) : usd(v));
  const basisLabel = result.bracketBased ? t('tax.out.basisMap') : t('tax.out.basisInfer');

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-almanac px-5 py-8 md:px-10 md:py-12">
        {/* 抬头 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <p className="eyebrow mb-4">{t('tax.eyebrow')}</p>
          <h1 className="max-w-3xl font-display text-[28px] font-medium leading-[1.2] tracking-tight sm:text-[34px] md:text-[46px]">
            {t('tax.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-[1.9] text-ink-soft">{t('tax.lead')}</p>
        </motion.div>

        {/* 两栏：左输入 / 右结果。min-w-0 让栅格子项可收缩到视口内，
            否则移动端单列时会被内容 min-content 撑宽而横向溢出。 */}
        <div className="mt-9 grid gap-6 md:mt-12 md:grid-cols-[minmax(0,420px)_1fr]">
          {/* 左：输入沙盘 */}
          <section className="min-w-0 rounded-card border hairline bg-card p-6 md:p-7">
            {/* 年收入 */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="tax-income" className="font-heading text-[15px] font-semibold">
                  {t('tax.field.income')}
                </label>
                <span className="font-data text-[10px] uppercase tracking-eyebrow text-ink-soft">{t('tax.income.unit')}</span>
              </div>
              <p className="mt-3 font-data text-[30px] font-semibold leading-none tabular-nums text-ink">
                {usd(gross)}
              </p>
              <input
                id="tax-income"
                type="range"
                className="hc-range mt-2"
                min={INCOME_MIN}
                max={INCOME_MAX}
                step={INCOME_STEP}
                value={gross}
                aria-valuetext={`${usd(gross)} / ${t('tax.income.unit')}`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGross(Number(e.target.value))}
              />
              <div className="mt-1 flex justify-between font-data text-[10px] text-ink-soft">
                <span>{usd(INCOME_MIN)}</span>
                <span>{usd(INCOME_MAX)}</span>
              </div>
            </div>

            {/* 收入性质 */}
            <div className="mt-7">
              <p className="font-heading text-[15px] font-semibold">{t('tax.field.nature')}</p>
              <div className="mt-3 space-y-2">
                {NATURES.map((n) => {
                  const active = n === nature;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setNature(n)}
                      className={`block w-full rounded-[6px] border px-4 py-3 text-left transition-colors ${
                        active ? 'border-pine bg-pine/[0.04]' : 'border-line bg-card hover:border-pine/40'
                      }`}
                    >
                      <span className={`block font-heading text-[14px] font-semibold ${active ? 'text-pine' : 'text-ink'}`}>
                        {t(`tax.nature.${n}`)}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-soft">
                        {t(`tax.nature.${n}.desc`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 目标城市 */}
            <div className="mt-7">
              <label htmlFor="tax-city" className="font-heading text-[15px] font-semibold">
                {t('tax.field.city')}
              </label>
              <select
                id="tax-city"
                value={cityId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCityId(e.target.value)}
                className="mt-3 w-full rounded-[6px] border border-line bg-paper px-3 py-3 font-body text-[15px] text-ink outline-none transition-colors focus:border-pine"
              >
                {grouped.map((g) => (
                  <optgroup key={g.r} label={t(`region.${g.r}`)}>
                    {g.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {cityName(c)} · {cityCountryName(c)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* 特惠税制开关（仅当该国有适用于当前收入性质的优惠制度） */}
            {specialAvailable && (
              <div className="mt-7 rounded-[6px] border border-ochre-deep/30 bg-ochre/[0.06] px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-[13.5px] font-semibold text-ink">
                      {t('tax.out.special')} · {lang === 'zh' ? specialAvailable.label : specialAvailable.labelEn}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                      {lang === 'zh' ? specialAvailable.note : specialAvailable.noteEn}
                    </p>
                  </div>
                  <label className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-pine"
                      checked={applySpecial}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplySpecial(e.target.checked)}
                    />
                    <span className="font-data text-[11px] text-ink-soft">
                      {applySpecial ? t('tax.out.specialOn') : t('tax.out.specialOff')}
                    </span>
                  </label>
                </div>
                <p className="mt-2 font-data text-[10px] text-ink-soft/80">{t('tax.out.source')}: {specialAvailable.source}</p>
              </div>
            )}
          </section>

          {/* 右：结果 */}
          <section className="flex min-w-0 flex-col gap-5">
            {/* 净收入主结果 */}
            <motion.div
              key={`${cityId}-${gross}-${nature}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="rounded-card border hairline bg-ink p-6 text-paper md:p-8"
            >
              <p className="font-data text-[10px] uppercase tracking-eyebrow text-paper/55">{t('tax.out.net')}</p>
              <p className="mt-3 font-display text-[38px] font-semibold leading-none tabular-nums md:text-[48px]">
                {usd(result.netUSD)}
              </p>
              <p className="mt-2 font-data text-[12px] text-paper/65">
                {lang === 'zh' ? `≈ ${cny(result.netUSD)} / 年` : t('tax.out.netUnit')} ·{' '}
                {t('tax.out.perMonth', { v: usd(result.netUSD / 12) })}
              </p>
              <div className="mt-5 border-t border-paper/15 pt-4">
                <p className="text-[13.5px] leading-relaxed text-paper/85">
                  {savedPositive ? t('tax.out.saved', { rate: TAX_BASELINE_EFF_RATE }) : t('tax.out.savedNeg', { rate: TAX_BASELINE_EFF_RATE })}{' '}
                  <span className={`font-data font-semibold ${savedPositive ? 'text-[#9CC79A]' : 'text-[#E8A08C]'}`}>
                    {savedPositive ? '+' : ''}
                    {usd(Math.abs(saved))}
                  </span>
                </p>
                <p className="mt-1 font-data text-[10px] text-paper/45">{t('tax.baseline.explain')}</p>
              </div>
            </motion.div>

            {/* 税制类型 + 有效税率 */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-card border hairline bg-card p-6">
                <p className="font-data text-[10px] uppercase tracking-eyebrow text-ink-soft">{t('tax.out.regime')}</p>
                <span className={`mt-3 inline-block rounded-full border px-3 py-1 font-data text-[12px] ${chipStyle}`}>
                  {regimeLabel}
                </span>
                <p className="mt-3 text-[12.5px] leading-[1.75] text-ink-soft">{regimeNote}</p>
              </div>
              <div className="rounded-card border hairline bg-card p-6">
                <p className="font-data text-[10px] uppercase tracking-eyebrow text-ink-soft">{t('tax.out.effRate')}</p>
                <p className="mt-3 font-data text-[32px] font-semibold leading-none tabular-nums text-ink">
                  {result.effRate}
                  <span className="text-[16px] font-medium text-ink-soft"> %</span>
                </p>
                <p className="mt-3 text-[12.5px] leading-[1.75] text-ink-soft">
                  {rule ? (lang === 'zh' ? rule.desc : rule.descEn) : t('tax.out.noData')}
                </p>
              </div>
            </div>

            {/* V2：分级税率测算过程 + 累进级距明细（仅已录入分级数据的国家） */}
            {result.bracketBased && result.taxableLocal != null && (
              <div className="rounded-card border hairline bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-data text-[10px] uppercase tracking-eyebrow text-ink-soft">{t('tax.out.lines')}</p>
                  <span className="rounded-full border border-moss-deep/40 bg-moss/10 px-2.5 py-0.5 font-data text-[10px] text-moss-deep">
                    {basisLabel}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 font-data text-[12.5px] tabular-nums">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('tax.out.threshold')}</dt>
                    <dd className="text-ink">{localFmt(result.thresholdLocalAmount ?? 0)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('tax.out.taxable')}</dt>
                    <dd className="text-ink">{localFmt(result.taxableLocal)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t hairline pt-2">
                    <dt className="font-semibold text-ink">{t('tax.out.taxPaid')}</dt>
                    <dd className="font-semibold text-ink">
                      {localFmt(result.taxLocal ?? 0)}
                      {cur !== 'USD' && result.taxLocal != null && (
                        <span className="ml-1 font-normal text-ink-soft">≈ {usd(result.taxLocal * (result.profile?.usdRate ?? 1))}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {result.breakdown.length > 0 && (
                  <>
                    <p className="mt-5 font-heading text-[12.5px] font-semibold text-ink">{t('tax.out.bracketTitle')}</p>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[420px] border-collapse font-data text-[11.5px] tabular-nums">
                        <thead>
                          <tr className="text-left text-ink-soft">
                            <th className="border-b hairline pb-1.5 font-normal">{t('tax.out.band')}</th>
                            <th className="border-b hairline pb-1.5 text-right font-normal">{t('tax.out.bandRate')}</th>
                            <th className="border-b hairline pb-1.5 text-right font-normal">{t('tax.out.bandTax')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.breakdown.map((bd, i) => (
                            <tr key={i}>
                              <td className="border-b hairline py-1.5 pr-2 text-ink-soft">
                                {localFmt(bd.from)} – {bd.to == null ? t('tax.out.over') : localFmt(bd.to)}
                              </td>
                              <td className="border-b hairline py-1.5 text-right text-ink-soft">{bd.ratePct}%</td>
                              <td className="border-b hairline py-1.5 text-right text-ink">{localFmt(bd.taxLocal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {cur && cur !== 'USD' && (
                  <p className="mt-3 font-data text-[10px] text-ink-soft/80">{t('tax.out.fxNote')} · FX {TAX_FX_ASOF}</p>
                )}
              </div>
            )}

            {/* 事实参考：居留门槛 / 最高边际税率 */}
            {(result.residencyDays != null || result.topRatePct != null) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-card border hairline bg-paper-deep/50 px-5 py-4">
                {result.residencyDays != null && (
                  <span className="font-data text-[11.5px] text-ink-soft">
                    {t('tax.out.residency', { days: result.residencyDays })}
                  </span>
                )}
                {result.topRatePct != null && (
                  <span className="font-data text-[11.5px] text-ink-soft">{t('tax.out.topRate', { v: result.topRatePct })}</span>
                )}
              </div>
            )}

            {/* 免责 */}
            <div className="rounded-card border-l-4 border-clay bg-card px-5 py-4">
              <p className="font-heading text-[13.5px] font-semibold text-ink">{t('tax.disclaimer.title')}</p>
              <p className="mt-1.5 text-[12.5px] leading-[1.8] text-ink-soft">{t('tax.disclaimer.body')}</p>
              <p className="mt-2 border-t hairline pt-2 text-[12px] leading-[1.75] text-ink-soft/90">
                {t('tax.disclaimer.card', { country: cityCountryName(city, lang) })}
              </p>
            </div>

            {onOpenQuiz && (
              <button type="button" onClick={onOpenQuiz} className="btn-ghost self-start !text-[13px]">
                {t('tax.cta.report')}
              </button>
            )}
          </section>
        </div>

        {/* 用法三步（AEO 直答段） */}
        <section className="mt-12 border-t hairline pt-8">
          <h2 className="font-heading text-lg font-semibold">{t('tax.section.howTitle')}</h2>
          <ol className="mt-5 grid gap-6 md:grid-cols-3">
            {(['tax.step1', 'tax.step2', 'tax.step3'] as const).map((k, i) => (
              <li key={k} className="border-t hairline pt-4">
                <p className="font-mono text-[11px] text-clay">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{t(k)}</p>
              </li>
            ))}
          </ol>
          {/* 四类税制图例 */}
          <div className="mt-8 flex flex-wrap gap-2">
            {TAX_REGIME_TYPES.map((rt) => (
              <span
                key={rt}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-data text-[11.5px] ${REGIME_STYLE[rt]}`}
              >
                {t(`tax.regime.${rt}`)}
                <span className="text-ink-soft/80">· {t(`tax.regime.note.${rt}`)}</span>
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
