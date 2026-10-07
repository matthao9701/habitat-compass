/**
 * 首屏轻量过滤器（第十四轮移动端重构）
 *
 * 旧版把预算数值框、range 滑块、下拉与按钮全部塞进一句话里，靠 `absolute` 把滑块
 * 压在数值框下方——375px 竖屏下必然与文字重叠、标点被控件切碎。现改为块级垂直分组：
 *
 *   ① 引导标题（保留自然语言语意）+ 动态匹配计数
 *   ② 每月预算：标签行 + 通栏滑块（手指滑动不会遮挡上方数值）
 *   ③ 偏好标签：气候胶囊组 + 签证胶囊开关
 *   ④ 进阶底线：网速 / 税负，双列等宽，右侧实时状态
 *   ⑤ 重置：带底色的微型按钮
 *
 * 结果实时过滤城市列表（前端纯计算，与引擎约束层口径独立，属轻量预览）。
 */
import { useMemo } from 'react';
import type { City } from '../../data/types';
import { getCountry } from '../../data/countries';
import { useI18n } from '../../i18n';

export interface FilterState {
  /** 月预算上限 USD（500–4000） */
  budget: number;
  /** 气候偏好 */
  climate: 'any' | 'warm' | 'cool';
  /** 签证友好（数字游民签 friendly 优先） */
  visaFriendly: boolean;
  /** 税负敏感（税率 ≤30% 才保留） */
  taxLight: boolean;
  /** 网速底线 Mbps（0=不限） */
  minMbps: number;
}

export const DEFAULT_FILTER: FilterState = {
  budget: 2000,
  climate: 'any',
  visaFriendly: false,
  taxLight: false,
  minMbps: 0,
};

/** 应用过滤器；null 数据不硬排除（保持「待核实」可见性），仅强条件时降权置后 */
export function filterCities(cities: City[], f: FilterState): City[] {
  const scored = cities.map((c) => {
    const country = getCountry(c.countryCode);
    let penalty = 0;
    // 预算：超出即重罚；未知（null）轻度置后不排除
    if (c.monthlyCostUSD != null) {
      if (c.monthlyCostUSD > f.budget) penalty += 100;
      else if (c.monthlyCostUSD > f.budget * 0.85) penalty += 20;
    } else penalty += 40;
    // 气候
    if (f.climate === 'warm' && c.climateDetail) {
      if (c.climateDetail.avgTempC < 18) penalty += 60;
    } else if (f.climate === 'cool' && c.climateDetail) {
      if (c.climateDetail.avgTempC > 22) penalty += 60;
    }
    // 签证
    if (f.visaFriendly && country?.visaPassport && country.visaPassport.digitalNomad !== 'friendly') {
      penalty += 70;
    }
    // 税负
    if (f.taxLight && country?.taxTopRatePct != null && country.taxTopRatePct > 30) penalty += 50;
    // 网速
    const mbps = c.internetMbps ?? country?.internetMbpsFixed;
    if (f.minMbps > 0 && mbps != null && mbps < f.minMbps) penalty += 55;

    return { city: c, penalty };
  });

  return scored
    .filter((s) => s.penalty < 100) // 预算超限/强冲突剔除，其余保留
    .sort((a, b) => a.penalty - b.penalty || (a.city.monthlyCostUSD ?? 9e9) - (b.city.monthlyCostUSD ?? 9e9))
    .map((s) => s.city);
}

interface SentenceFilterProps {
  value: FilterState;
  onChange: (f: FilterState) => void;
  matchedCount: number;
  totalCount: number;
}

/** 胶囊按钮：选中用松绿实底，未选用纸底细线 */
function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-[13px] transition-colors ${
        active
          ? 'border-pine bg-pine font-medium text-paper'
          : 'border-line bg-white text-ink-soft hover:border-pine/50 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function SentenceFilter({ value, onChange, matchedCount, totalCount }: SentenceFilterProps) {
  const { t } = useI18n();
  const budgetLabel = useMemo(
    () => Math.round(value.budget).toLocaleString('en-US'),
    [value.budget],
  );

  const climateOptions = [
    { v: 'any' as const, label: t('landing.filter.any') },
    { v: 'warm' as const, label: t('landing.filter.warm') },
    { v: 'cool' as const, label: t('landing.filter.cool') },
  ];

  return (
    <div className="rounded-card border border-line bg-card">
      {/* ① 引导标题 + 匹配计数 */}
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 md:px-6">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{t('landing.filter.eyebrow')}</p>
          <p className="font-heading text-[15px] font-bold leading-snug text-ink md:text-base">
            {t('landing.filter.lead')}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full bg-paper-deep px-3 py-1.5 font-data text-[11px] tabular-nums text-ink-soft">
          {t('landing.filter.count', { matched: matchedCount, total: totalCount })}
        </span>
      </div>

      {/* ② 每月预算：标签与数值同行，滑块独占通栏 */}
      <div className="border-t border-line px-5 py-5 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="filter-budget" className="font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            {t('landing.filter.budgetTag')}
          </label>
          <span
            aria-hidden="true"
            className="inline-flex items-baseline gap-1.5 rounded-lg border border-line bg-white px-3 py-2 font-data text-[15px] font-semibold tabular-nums text-pine"
          >
            ${budgetLabel}
            <span className="text-[9px] font-normal text-ink-soft">USD</span>
          </span>
        </div>
        <input
          id="filter-budget"
          type="range"
          min={800}
          max={4000}
          step={100}
          value={value.budget}
          onChange={(e) => onChange({ ...value, budget: Number(e.target.value) })}
          aria-label={t('landing.filter.budgetAria')}
          aria-valuetext={`$${budgetLabel} USD`}
          className="hc-range mt-3 w-full"
        />
      </div>

      {/* ③ 偏好标签：气候胶囊组 + 签证开关 */}
      <div className="border-t border-line px-5 py-5 md:px-6">
        <p className="mb-3 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          {t('landing.filter.chipsLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          {climateOptions.map((o) => (
            <Chip
              key={o.v}
              active={value.climate === o.v}
              onClick={() => onChange({ ...value, climate: o.v })}
              ariaLabel={t('landing.filter.climateAria')}
            >
              {o.label}
            </Chip>
          ))}
          <Chip
            active={value.visaFriendly}
            onClick={() => onChange({ ...value, visaFriendly: !value.visaFriendly })}
          >
            {value.visaFriendly ? t('landing.filter.visaOn') : t('landing.filter.visaOff')}
          </Chip>
        </div>
      </div>

      {/* ④ 进阶底线：两行等宽，右侧实时状态 */}
      <div className="border-t border-line px-5 py-5 md:px-6">
        <p className="mb-3 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          {t('landing.filter.baseline')}
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <label
              htmlFor="filter-mbps"
              className="w-24 shrink-0 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:w-32"
            >
              {t('landing.filter.mbps')}
            </label>
            <input
              id="filter-mbps"
              type="range"
              min={0}
              max={200}
              step={10}
              value={value.minMbps}
              onChange={(e) => onChange({ ...value, minMbps: Number(e.target.value) })}
              aria-label={t('landing.filter.mbps')}
              aria-valuetext={
                value.minMbps === 0 ? t('landing.filter.unlimited') : `≥${value.minMbps} Mbps`
              }
              className="hc-range min-w-0 flex-1"
            />
            <span
              className={`w-20 shrink-0 whitespace-nowrap text-right font-data text-[11.5px] font-medium tabular-nums ${
                value.minMbps === 0 ? 'text-ink-soft/70' : 'text-pine'
              }`}
            >
              {value.minMbps === 0 ? t('landing.filter.unlimited') : `≥${value.minMbps} Mbps`}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <label
              htmlFor="filter-tax"
              className="w-24 shrink-0 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:w-32"
            >
              {t('landing.filter.tax')}
            </label>
            <input
              id="filter-tax"
              type="range"
              min={0}
              max={1}
              step={1}
              value={value.taxLight ? 1 : 0}
              onChange={(e) => onChange({ ...value, taxLight: e.target.value === '1' })}
              aria-label={t('landing.filter.tax')}
              aria-valuetext={value.taxLight ? t('landing.filter.taxOn') : t('landing.filter.unlimited')}
              className="hc-range min-w-0 flex-1"
            />
            <span
              className={`w-[5.5rem] shrink-0 whitespace-nowrap text-right font-data text-[11.5px] font-medium ${
                value.taxLight ? 'text-pine' : 'text-ink-soft/70'
              }`}
            >
              {value.taxLight ? t('landing.filter.taxOn') : t('landing.filter.unlimited')}
            </span>
          </div>
        </div>
      </div>

      {/* ⑤ 重置 */}
      <div className="border-t border-line px-5 py-4 md:px-6">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTER)}
          className="inline-flex min-h-[36px] items-center rounded-lg border border-line bg-paper-deep px-4 font-data text-[11.5px] text-ink-soft transition-colors hover:border-ink/25 hover:text-clay"
        >
          {t('landing.filter.reset')}
        </button>
      </div>
    </div>
  );
}
