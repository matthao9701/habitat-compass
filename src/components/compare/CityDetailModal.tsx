import { useEffect } from 'react';
import { CLIMATE_LABEL, INTERNET_LABEL, formatCost } from '../../lib/engine';
import { getCountry } from '../../data/countries';
import type { CompareRow } from '../../lib/compare';
import { useI18n, getCurrentLang } from '../../i18n';
import { cityName, countryName, formatDate } from '../../lib/format';
import { PassportVisaBlock, LongStayBlock } from '../report/PassportVisaBlock';
import { AIR_BAND_TONE } from '../../lib/colors';

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
  const { t } = useI18n();
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
      aria-label={t('cdm.detailAria', { name: cityName(city) })}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-xl border hairline bg-card shadow-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b hairline bg-card px-5 py-4">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight text-ink">{cityName(city)}</h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
              {city.nameEn} · {city.countryZh}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="shrink-0 rounded-full border hairline px-2.5 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-clay hover:text-clay"
          >
            ✕
          </button>
        </div>

        {/* 城市数据 */}
        <div className="px-5 py-4">
          <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ochre">{t('cmp.detail.cityData')}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px]">
            <Stat label={t('rep.stat.match')} value={`${row.composite}`} accent />
            <Stat label={t('rep.stat.monthly')} value={formatCost(city)} />
            <Stat
              label={t('rep.stat.avgAll')}
              value={city.monthlyCostUSD != null ? `~$${city.monthlyCostUSD.toLocaleString('en-US')}` : '—'}
            />
            <Stat label={t('rep.stat.costIndex')} value={city.costIndex != null ? `${city.costIndex} · NYC=100` : '—'} />
            <Stat
              label={t('cdm.rent')}
              value={city.rent1brUSD != null ? `$${city.rent1brUSD.toLocaleString('en-US')}` : '—'}
            />
            <Stat label={t('cmp.data.meal')} value={city.mealUSD != null ? `$${city.mealUSD}` : '—'} />
            <Stat
              label={t('cmp.data.internet')}
              value={
                city.internetMbps != null && city.internet != null
                  ? `${city.internetMbps} Mbps · ${t(INTERNET_LABEL[city.internet])}`
                  : city.internetMbps != null
                    ? `${city.internetMbps} Mbps`
                    : '—'
              }
            />
            <Stat label={t('cmp.data.safety')} value={city.safety != null ? `${city.safety} / 100` : '—'} />
            <Stat label={t('cmp.data.healthcare')} value={city.healthcareIndex != null ? `${city.healthcareIndex}` : '—'} />
            <Stat label={t('cmp.data.pollution')} value={city.pollutionIndex != null ? `${city.pollutionIndex}` : '—'} />
            <Stat
              label={t('cmp.data.climate')}
              value={
                city.climate != null && city.tempC != null
                  ? `${t(CLIMATE_LABEL[city.climate])} · ${city.tempC}°C`
                  : city.climateDetail != null
                    ? `${city.climateDetail.avgTempC}°C · ${t(city.climateDetail.summary)}`
                    : '—'
              }
            />
            <Stat
              label={t('cmp.data.air')}
              value={
                city.airQuality != null
                  ? `${t('air.pm25')} ${city.airQuality.pm25} μg/m³ · ${t(`air.band.${city.airQuality.band}`)}`
                  : t('air.nodata')
              }
              tone={city.airQuality ? AIR_BAND_TONE[city.airQuality.band] : undefined}
            />
            <Stat
              label={t('cmp.data.visa')}
              value={city.digitalNomadVisa === true ? t('report.copy.visaYes') : city.digitalNomadVisa === false ? '—' : t('profile.visa.pending')}
            />
          </dl>
          {city.visaLabel ? (
            <p className="mt-3 rounded-[6px] bg-paper-deep/70 px-3.5 py-2.5 text-[12px] leading-[1.7] text-ink">
              {city.visaLabel}
            </p>
          ) : null}
          {city.airQuality ? (
            <p className="mt-2 font-mono text-[9px] leading-[1.8] text-ink-soft/75">{t('air.note')}</p>
          ) : null}
        </div>

        {/* 国家基本信息 */}
        {country ? (
          <div className="border-t hairline px-5 py-4">
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ochre">
              {t('cdm.country.eyebrow', { name: countryName(country) })}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px]">
              <Stat label={t('cty.capital')} value={country.capital ?? '—'} />
              <Stat label={t('cty.languages')} value={country.languages?.join('、') ?? '—'} />
              <Stat label={t('cty.currency')} value={country.currency ?? '—'} />
              <Stat label={t('cty.population')} value={country.population != null ? formatPop(country.population) : '—'} />
              <Stat
                label={t('cty.gdp')}
                value={country.gdpPerCapitaUSD != null ? `$${country.gdpPerCapitaUSD.toLocaleString('en-US')}` : '—'}
              />
              <Stat label="HDI" value={country.hdi != null ? country.hdi.toFixed(3) : '—'} />
              <Stat
                label={t('cty.gpi')}
                value={country.gpi != null ? `${country.gpi.score.toFixed(2)} · ${t('cty.gpiRank', { rank: country.gpi.rank })}` : '—'}
              />
              <Stat label={t('cty.cpi')} value={country.cpi != null ? `${country.cpi} / 100` : '—'} />
              <Stat
                label={t('cty.safetyNumbeo')}
                value={country.numbeoSafety != null ? `${country.numbeoSafety} / 100` : '—'}
              />
              <Stat
                label={t('cty.internet')}
                value={country.internetMbpsFixed != null ? `${country.internetMbpsFixed} Mbps` : '—'}
              />
              <Stat
                label={t('cty.tax')}
                value={country.taxTopRatePct != null ? `${country.taxTopRatePct}%` : '—'}
              />
            </dl>
            {country.visaOverview ? (
              <p className="mt-3 text-[12px] leading-[1.7] text-ink-soft">
                <span className="font-medium text-ink">{t('cmp.detail.visaOverview')}</span>
                {country.visaOverview}
              </p>
            ) : null}
            <PassportVisaBlock country={country} />
            <LongStayBlock country={country} />
            <p className="mt-3 border-t hairline pt-2.5 font-mono text-[9px] leading-[1.8] text-ink-soft/75">
              {t('cdm.footnote', { date: formatDate(country.updatedAt) })}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false, tone }: { label: string; value: string; accent?: boolean; tone?: string }) {
  return (
    <div>
      <dt className="text-[10.5px] text-ink-soft">{label}</dt>
      <dd className={`mt-0.5 font-data text-[12px] tabular-nums ${tone ?? (accent ? 'text-clay' : 'text-ink')}`}>
        {value}
      </dd>
    </div>
  );
}

function formatPop(n: number): string {
  if (getCurrentLang() === 'zh') {
    if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)} 亿`;
    if (n >= 1_0000) return `${(n / 1_0000).toFixed(0)} 万`;
  }
  return n.toLocaleString('en-US');
}
