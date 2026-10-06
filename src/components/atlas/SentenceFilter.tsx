/**
 * 首屏轻量过滤器：一句话自然填空 + 紧凑多维微调滑块。
 * 填空式交互：「我想在每月预算 [滑块] 左右，寻找一个 [气候偏好] 、[签证友好] 的定居城市」。
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

function InlineSelect<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}): React.ReactElement {
  return (
    <span className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={ariaLabel}
        className="cursor-pointer appearance-none rounded-[5px] border border-line bg-white px-2.5 py-0.5 font-body text-[13px] font-medium text-pine outline-none transition-colors hover:border-pine/50 focus:border-pine"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-data text-[8px] text-ink-soft">
        ▼
      </span>
    </span>
  );
}

export default function SentenceFilter({ value, onChange, matchedCount, totalCount }: SentenceFilterProps) {
  const { t } = useI18n();
  const budgetLabel = useMemo(
    () => `$${Math.round(value.budget).toLocaleString('en-US')}`,
    [value.budget],
  );

  return (
    <div className="rounded-card border border-line bg-card">
      {/* 一句话填空 */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2.5 px-5 py-4 text-[14px] leading-loose text-ink md:px-6 md:text-[15px]">
        <span className="font-serif-accent italic text-ink-soft">“</span>
        {t('landing.filter.lead')}
        <span className="relative inline-flex flex-col">
          <span className="inline-flex min-w-[118px] items-center justify-between rounded-[5px] border border-line bg-white px-2.5 py-0.5 font-data text-[13px] font-semibold text-pine">
            {budgetLabel}
            <span className="ml-1 text-[8px] text-ink-soft">USD</span>
          </span>
          <input
            type="range"
            min={800}
            max={4000}
            step={100}
            value={value.budget}
            onChange={(e) => onChange({ ...value, budget: Number(e.target.value) })}
            className="absolute -bottom-1 left-0 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[#1D3557]"
            aria-label={t('landing.filter.budgetAria')}
          />
        </span>
        {t('landing.filter.trailing')}
        <InlineSelect
          value={value.climate}
          ariaLabel={t('landing.filter.climateAria')}
          onChange={(v) => onChange({ ...value, climate: v })}
          options={[
            { v: 'any', label: t('landing.filter.any') },
            { v: 'warm', label: t('landing.filter.warm') },
            { v: 'cool', label: t('landing.filter.cool') },
          ]}
        />
        <span
          role="button"
          tabIndex={0}
          onClick={() => onChange({ ...value, visaFriendly: !value.visaFriendly })}
          onKeyDown={(e) => e.key === 'Enter' && onChange({ ...value, visaFriendly: !value.visaFriendly })}
          className={`cursor-pointer rounded-[5px] border px-2.5 py-0.5 text-[13px] font-medium transition-colors ${
            value.visaFriendly
              ? 'border-pine bg-pine text-paper'
              : 'border-line bg-white text-ink-soft hover:border-pine/50'
          }`}
        >
          {value.visaFriendly ? t('landing.filter.visaOn') : t('landing.filter.visaOff')}
        </span>
        {t('landing.filter.settle')}
        <span className="font-serif-accent italic text-ink-soft">”</span>
        <span className="ml-auto font-data text-[11px] text-ink-soft">
          {t('landing.filter.count', { matched: matchedCount, total: totalCount })}
        </span>
      </div>

      {/* 紧凑多维微调滑块行 */}
      <div className="grid gap-x-8 gap-y-3 border-t border-line px-5 py-3.5 md:grid-cols-[1fr_1fr_auto] md:px-6">
        <label className="flex items-center gap-3">
          <span className="shrink-0 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft">{t('landing.filter.mbps')}</span>
          <input
            type="range"
            min={0}
            max={200}
            step={10}
            value={value.minMbps}
            onChange={(e) => onChange({ ...value, minMbps: Number(e.target.value) })}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-[#1D3557]"
            aria-label={t('landing.filter.mbps')}
          />
          <span className="w-16 shrink-0 text-right font-data text-[11px] font-medium text-ink">
            {value.minMbps === 0 ? t('landing.filter.unlimited') : `≥${value.minMbps}M`}
          </span>
        </label>
        <label className="flex items-center gap-3">
          <span className="shrink-0 font-data text-[10px] uppercase tracking-[0.14em] text-ink-soft">{t('landing.filter.tax')}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={1}
            value={value.taxLight ? 1 : 0}
            onChange={(e) => onChange({ ...value, taxLight: e.target.value === '1' })}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-[#1D3557]"
            aria-label={t('landing.filter.tax')}
          />
          <span className="w-16 shrink-0 text-right font-data text-[11px] font-medium text-ink">
            {value.taxLight ? t('landing.filter.taxOn') : t('landing.filter.unlimited')}
          </span>
        </label>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTER)}
          className="justify-self-start font-data text-[10.5px] text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-clay md:justify-self-end"
        >
          {t('landing.filter.reset')}
        </button>
      </div>
    </div>
  );
}
