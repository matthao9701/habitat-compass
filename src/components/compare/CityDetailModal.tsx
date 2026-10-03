import { useEffect } from 'react';
import { CLIMATE_LABEL, INTERNET_LABEL, formatCost } from '../../lib/engine';
import { getCountry } from '../../data/countries';
import type { CompareRow } from '../../lib/compare';

/**
 * CityDetailModal — 对比页城市详情弹层（第六轮）
 * 城市关键数据 + 所属国家基本信息（参考层）。点击对比表中城市名打开。
 */
export default function CityDetailModal({
  row,
  onClose,
}: {
  row: CompareRow;
  onClose: () => void;
}) {
  // Esc 关闭 + 打开时锁定滚动
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { city } = row;
  const country = getCountry(city.countryCode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${city.nameZh} 详情`}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-xl border hairline bg-card shadow-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b hairline bg-card px-5 py-4">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">{city.nameZh}</h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
              {city.nameEn} · {city.countryZh}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="shrink-0 rounded-full border hairline px-2.5 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-clay hover:text-clay"
          >
            ✕
          </button>
        </div>

        {/* 城市数据 */}
        <div className="px-5 py-4">
          <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ochre">city · 城市数据</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px]">
            <Stat label="匹配度" value={`${row.composite}`} accent />
            <Stat label="月生活成本" value={formatCost(city)} />
            <Stat
              label="综合月均"
              value={city.monthlyCostUSD != null ? `~$${city.monthlyCostUSD.toLocaleString('en-US')}` : '—'}
            />
            <Stat label="成本指数" value={city.costIndex != null ? `${city.costIndex} · NYC=100` : '—'} />
            <Stat
              label="市中心 1 居"
              value={city.rent1brUSD != null ? `$${city.rent1brUSD.toLocaleString('en-US')}` : '—'}
            />
            <Stat label="平价一餐" value={city.mealUSD != null ? `$${city.mealUSD}` : '—'} />
            <Stat
              label="宽带中位"
              value={
                city.internetMbps != null && city.internet != null
                  ? `${city.internetMbps} Mbps · ${INTERNET_LABEL[city.internet]}`
                  : city.internetMbps != null
                    ? `${city.internetMbps} Mbps`
                    : '—'
              }
            />
            <Stat label="安全指数" value={city.safety != null ? `${city.safety} / 100` : '—'} />
            <Stat label="医疗指数" value={city.healthcareIndex != null ? `${city.healthcareIndex}` : '—'} />
            <Stat label="污染指数" value={city.pollutionIndex != null ? `${city.pollutionIndex}` : '—'} />
            <Stat
              label="气候"
              value={
                city.climate != null && city.tempC != null
                  ? `${CLIMATE_LABEL[city.climate]} · ${city.tempC}°C`
                  : city.climateDetail != null
                    ? `${city.climateDetail.avgTempC}°C · ${city.climateDetail.summary}`
                    : '—'
              }
            />
            <Stat
              label="数字游民签证"
              value={city.digitalNomadVisa === true ? '有' : city.digitalNomadVisa === false ? '—' : '待核实'}
            />
          </dl>
          {city.visaLabel ? (
            <p className="mt-3 rounded-[6px] bg-paper-deep/70 px-3.5 py-2.5 text-[12px] leading-[1.7] text-ink">
              {city.visaLabel}
            </p>
          ) : null}
        </div>

        {/* 国家基本信息 */}
        {country ? (
          <div className="border-t hairline px-5 py-4">
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ochre">
              country · {country.nameZh} 国家概况（参考）
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px]">
              <Stat label="首都" value={country.capital ?? '—'} />
              <Stat label="官方语言" value={country.languages?.join('、') ?? '—'} />
              <Stat label="货币" value={country.currency ?? '—'} />
              <Stat label="人口" value={country.population != null ? formatPop(country.population) : '—'} />
              <Stat
                label="人均 GDP"
                value={country.gdpPerCapitaUSD != null ? `$${country.gdpPerCapitaUSD.toLocaleString('en-US')}` : '—'}
              />
              <Stat label="HDI" value={country.hdi != null ? country.hdi.toFixed(3) : '—'} />
              <Stat
                label="GPI 和平指数"
                value={country.gpi != null ? `${country.gpi.score.toFixed(2)} · 第 ${country.gpi.rank} 位` : '—'}
              />
              <Stat label="CPI 廉洁指数" value={country.cpi != null ? `${country.cpi} / 100` : '—'} />
              <Stat
                label="国家安全（Numbeo）"
                value={country.numbeoSafety != null ? `${country.numbeoSafety} / 100` : '—'}
              />
              <Stat
                label="宽带均速"
                value={country.internetMbpsFixed != null ? `${country.internetMbpsFixed} Mbps` : '—'}
              />
              <Stat
                label="最高边际个税率"
                value={country.taxTopRatePct != null ? `${country.taxTopRatePct}%` : '—'}
              />
            </dl>
            {country.visaOverview ? (
              <p className="mt-3 text-[12px] leading-[1.7] text-ink-soft">
                <span className="font-medium text-ink">数字游民签证概览：</span>
                {country.visaOverview}
              </p>
            ) : null}
            <p className="mt-3 border-t hairline pt-2.5 font-mono text-[9px] leading-[1.8] text-ink-soft/75">
              国家数据截至 {country.updatedAt} · World Bank（CC BY 4.0）/ UNDP / Vision of Humanity（引用）/
              Transparency International（引用）/ Numbeo；不参与城市打分。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[10.5px] text-ink-soft">{label}</dt>
      <dd className={`mt-0.5 font-data text-[12px] tabular-nums ${accent ? 'text-clay' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}

function formatPop(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)} 亿`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(0)} 万`;
  return n.toLocaleString('en-US');
}
