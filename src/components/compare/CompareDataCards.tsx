// 数据卡区：生活成本对比（真实字段计算 + 规则模板结论） + 公开数据对比表（仅列数据库实际字段）
// + 国家级参考对比行（第六轮：同国城市合并为一列，参考信息不参与打分）
import { useState } from 'react';
import { CLIMATE_LABEL } from '../../lib/engine';
import { compareCost, type CompareRow } from '../../lib/compare';
import { getCountry } from '../../data/countries';
import type { Country } from '../../data/types';
import { useI18n, getCurrentLang } from '../../i18n';
import { cityName, countryName, formatMoney, formatDate } from '../../lib/format';
import { AIR_BAND_TONE } from '../../lib/colors';

const fmt = (n: number): string => `$${n.toLocaleString('en-US')}`;

export default function CompareDataCards({ rows }: { rows: CompareRow[] }) {
  const { t } = useI18n();
  const [pair, setPair] = useState<[number, number]>([0, Math.min(1, 1)]);

  if (rows.length < 2) return null;

  // 城对选择索引防越界（城市增删后 pair 可能失效）
  const ai = Math.min(pair[0], rows.length - 1);
  const biRaw = pair[1] >= rows.length || pair[1] === pair[0] ? (ai + 1) % rows.length : pair[1];
  const bi = biRaw >= rows.length || biRaw === ai ? (ai + 1) % rows.length : biRaw;
  const costDiff = compareCost(rows[ai].city, rows[bi].city);

  /** 公开数据表：仅列城市数据库实际字段；null = 未入库，显示 — 不编造 */
  const dataRows: { label: string; valueOf: (r: CompareRow) => string; toneOf?: (r: CompareRow) => string }[] = [
    {
      label: t('cmp.data.climate'),
      valueOf: (r) =>
        r.city.climate != null
          ? CLIMATE_LABEL[r.city.climate]
          : (r.city.climateDetail?.summary ?? '—'),
    },
    {
      label: t('cmp.data.avgTemp'),
      valueOf: (r) =>
        r.city.tempC != null
          ? `${r.city.tempC}°C`
          : r.city.climateDetail != null
            ? `${r.city.climateDetail.avgTempC}°C`
            : '—',
    },
    { label: t('cmp.data.monthlyCost'), valueOf: (r) => (r.city.monthlyCostUSD != null ? formatMoney(r.city.monthlyCostUSD) : '—') },
    { label: t('cmp.data.living'), valueOf: (r) => (r.city.livingScore != null ? `${r.city.livingScore}` : '—') },
    { label: t('cmp.data.housing'), valueOf: (r) => (r.city.housingLevel != null ? fmt(r.city.housingLevel) : '—') },
    { label: t('cmp.data.internet'), valueOf: (r) => (r.city.internetMbps != null ? `${r.city.internetMbps} Mbps` : '—') },
    { label: t('cmp.data.safety'), valueOf: (r) => (r.city.safety != null ? `${r.city.safety}/100` : '—') },
    { label: t('cmp.data.healthcare'), valueOf: (r) => (r.city.healthcareIndex != null ? `${r.city.healthcareIndex}` : '—') },
    { label: t('cmp.data.pollution'), valueOf: (r) => (r.city.pollutionIndex != null ? `${r.city.pollutionIndex}` : '—') },
    {
      label: t('cmp.data.air'),
      valueOf: (r) => (r.city.airQuality != null ? `${r.city.airQuality.pm25} · ${t(`air.band.${r.city.airQuality.band}`)}` : '—'),
      toneOf: (r) => (r.city.airQuality ? AIR_BAND_TONE[r.city.airQuality.band] : 'text-ink-soft'),
    },
    { label: t('cd.traffic'), valueOf: (r) => (r.city.trafficIndex != null ? `${r.city.trafficIndex}` : '—') },
    { label: t('cd.purchasing'), valueOf: (r) => (r.city.purchasingPowerIndex != null ? `${r.city.purchasingPowerIndex}` : '—') },
    { label: t('rep.stat.community'), valueOf: (r) => (r.city.community != null ? `${r.city.community}/5` : '—') },
    { label: t('an.dim.language'), valueOf: (r) => (r.city.english != null ? `${r.city.english}/5` : '—') },
    { label: t('an.dim.pace'), valueOf: (r) => (r.city.pace != null ? `${r.city.pace}/5` : '—') },
    {
      label: t('cmp.data.visa'),
      valueOf: (r) =>
        r.city.digitalNomadVisa === true ? t('report.copy.visaYes') : r.city.digitalNomadVisa === false ? '—' : t('profile.visa.pending'),
      toneOf: (r) => (r.city.digitalNomadVisa === true ? 'text-moss' : 'text-ink-soft'),
    },
  ];

  return (
    <section className="border-t hairline">
      <div className="mx-auto max-w-almanac px-6 py-12 md:px-10">
        <p className="eyebrow">{t('cd.section.eyebrow')}</p>
        <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">{t('cd.section.title')}</h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* 生活成本对比卡 */}
          <div className="card-paper p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-[16px] font-bold">{t('cd.cost.title')}</h3>
              <div className="flex gap-2">
                {([0, 1] as const).map((slot) => (
                  <select
                    key={slot}
                    value={slot === 0 ? ai : bi}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPair(slot === 0 ? [v, bi === v ? ai : bi] : [ai, v === ai ? bi : v]);
                    }}
                    className="rounded-[6px] border border-ink/15 bg-paper px-2 py-1 font-mono text-[11px] text-ink outline-none focus:border-clay"
                    aria-label={slot === 0 ? t('cd.slotA') : t('cd.slotB')}
                  >
                    {rows.map((r, i) => (
                      <option key={r.city.id} value={i} disabled={slot === 0 ? i === bi : i === ai}>
                        {slot === 0 ? 'A · ' : 'B · '}
                        {cityName(r.city)}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-y hairline py-4 text-center">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">{t('cd.cost.diffCost')}</p>
                <p className="mt-1 font-mono text-[17px] text-ink">
                  {costDiff.diffUSD != null ? `$${Math.abs(costDiff.diffUSD).toLocaleString('en-US')}` : '—'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">{t('cd.cost.diffRel')}</p>
                <p className="mt-1 font-mono text-[17px] text-ink">{costDiff.diffPct != null ? `${costDiff.diffPct}%` : '—'}</p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">{t('cd.cost.diffIndex')}</p>
                <p className="mt-1 font-mono text-[17px] text-ink">
                  {costDiff.diffIndex != null ? Math.abs(costDiff.diffIndex) : '—'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-[1.8] text-ink-soft">{t(costDiff.conclusion)}</p>
            <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-ink-soft/70">
              {t('cd.cost.note')}
            </p>
          </div>

          {/* 公开数据对比表 */}
          <div className="card-paper p-5 md:p-7">
            <h3 className="font-heading text-[16px] font-bold">{t('cd.table.title')}</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse">
                <thead>
                  <tr className="border-b border-ink/15 text-left">
                    <th className="py-2 pr-3 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-ink-soft">{t('cd.table.field')}</th>
                    {rows.map((r) => (
                      <th key={r.city.id} className="py-2 pr-3 text-right font-mono text-[11px] font-medium text-ink">
                        {cityName(r.city)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row) => (
                    <tr key={row.label} className="border-b border-ink/[0.07]">
                      <td className="py-1.5 pr-3 text-[12px] text-ink-soft">{t(row.label)}</td>
                      {rows.map((r) => (
                        <td
                          key={r.city.id}
                          className={`py-1.5 pr-3 text-right font-mono text-[11.5px] ${row.toneOf ? row.toneOf(r) : 'text-ink'}`}
                        >
                          {row.valueOf(r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-ink-soft/70">
              {t('cd.table.note')}
            </p>
          </div>
        </div>

        {/* 国家级参考对比行（第六轮）：同国城市合并为一列 */}
        <CountryCompareTable rows={rows} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 国家级参考对比（第六轮）：参考信息层，同国合并，缺失显示 —
// ---------------------------------------------------------------------------

function CountryCompareTable({ rows }: { rows: CompareRow[] }) {
  const { t } = useI18n();
  const groups = new Map<string, { country: Country; cities: string[] }>();
  for (const r of rows) {
    const c = getCountry(r.city.countryCode);
    if (!c) continue;
    const g = groups.get(c.code);
    if (g) g.cities.push(cityName(r.city));
    else groups.set(c.code, { country: c, cities: [cityName(r.city)] });
  }
  if (groups.size === 0) return null;
  const list = [...groups.values()];

  const fields: { label: string; valueOf: (c: Country) => string }[] = [
    { label: t('cty.capital'), valueOf: (c) => c.capital ?? '—' },
    { label: t('cty.languages'), valueOf: (c) => c.languages?.join('、') ?? '—' },
    { label: t('cty.currency'), valueOf: (c) => c.currency ?? '—' },
    { label: t('cty.population'), valueOf: (c) => (c.population != null ? formatPop(c.population) : '—') },
    { label: t('cty.gdp'), valueOf: (c) => (c.gdpPerCapitaUSD != null ? `$${c.gdpPerCapitaUSD.toLocaleString('en-US')}` : '—') },
    { label: 'HDI', valueOf: (c) => (c.hdi != null ? c.hdi.toFixed(3) : '—') },
    { label: t('cty.gpi'), valueOf: (c) => (c.gpi != null ? `${c.gpi.score.toFixed(2)} · ${c.gpi.rank}` : '—') },
    { label: t('cty.cpi'), valueOf: (c) => (c.cpi != null ? `${c.cpi}/100` : '—') },
    { label: t('cty.safety'), valueOf: (c) => (c.safetyScore != null ? `${c.safetyScore}/100` : '—') },
    { label: t('cty.healthcare'), valueOf: (c) => (c.healthcareScore != null ? `${c.healthcareScore}/100` : '—') },
    { label: t('cty.internet'), valueOf: (c) => (c.internetMbpsFixed != null ? `${c.internetMbpsFixed} Mbps` : '—') },
    { label: t('cty.tax'), valueOf: (c) => (c.taxTopRatePct != null ? `${c.taxTopRatePct}%` : '—') },
    {
      label: t('cmp.taxDays'),
      valueOf: (c) =>
        c.longStay?.taxResidencyDays != null
          ? t('longstay.taxDays', { days: c.longStay.taxResidencyDays })
          : '—',
    },
  ];

  return (
    <div className="card-paper mt-8 p-5 md:p-7">
      <h3 className="font-heading text-[16px] font-bold">{t('cty.section')}</h3>
      <p className="mt-1 text-[12px] text-ink-soft">
        {t('cty.sectionNote')}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-ink/15 text-left">
              <th className="py-2 pr-3 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-ink-soft">{t('cmp.data.country')}</th>
              {list.map((g) => (
                <th key={g.country.code} className="py-2 pr-3 text-right">
                  <span className="block font-mono text-[11px] font-medium text-ink">{countryName(g.country)}</span>
                  <span className="block font-mono text-[9px] font-normal text-ink-soft">
                    {g.cities.join(' / ')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.label} className="border-b border-ink/[0.07]">
                <td className="py-1.5 pr-3 text-[12px] text-ink-soft">{f.label}</td>
                {list.map((g) => (
                  <td key={g.country.code} className="py-1.5 pr-3 text-right font-data text-[11.5px] tabular-nums text-ink">
                    {f.valueOf(g.country)}
                  </td>
                ))}
              </tr>
            ))}
            {list.some((g) => g.country.visaOverview) ? (
              <tr className="border-b border-ink/[0.07] align-top">
                <td className="py-1.5 pr-3 text-[12px] text-ink-soft">{t('cmp.data.visaOverview')}</td>
                {list.map((g) => (
                  <td key={g.country.code} className="max-w-[180px] py-1.5 pr-3 text-right text-[11px] leading-[1.6] text-ink">
                    {g.country.visaOverview ?? '—'}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-ink-soft/70">
        {t('cty.footnote', { date: formatDate(list[0]?.country.updatedAt ?? '') })}
      </p>
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
