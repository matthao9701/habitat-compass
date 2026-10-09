import { getCountry } from '../../data/countries';
import type { CityMatch } from '../../lib/engine';
import { useI18n, getCurrentLang } from '../../i18n';
import { countryName, formatDate } from '../../lib/format';
import { currencyLabel, languageLabel, visaOverviewLabel } from '../../i18n/countryGlossary';
import { PassportVisaBlock, LongStayBlock } from './PassportVisaBlock';

/**
 * CountryCards — 报告页「国家概况」参考卡（第六轮）
 * 参考信息层：不进引擎加权。按 Top5 城市所属国家去重展示国家级数据，缺失字段显示「—」。
 */
export default function CountryCards({ matches }: { matches: CityMatch[] }) {
  const { t } = useI18n();
  // 同国城市只展示一次，保持首次出现顺序
  const seen = new Set<string>();
  const rows: { match: CityMatch }[] = [];
  for (const m of matches) {
    if (seen.has(m.city.countryCode)) continue;
    seen.add(m.city.countryCode);
    rows.push({ match: m });
  }
  if (rows.length === 0) return null;

  return (
    <section className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
      <p className="eyebrow mb-3">country context</p>
      <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">{t('report.country.title')}</h2>
      <p className="mb-10 text-[13px] leading-relaxed text-ink-soft">
        {t('cty.sectionNote')}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {rows.map(({ match }) => (
          <CountryCard key={match.city.countryCode} match={match} />
        ))}
      </div>
    </section>
  );
}

function CountryCard({ match }: { match: CityMatch }) {
  const { t } = useI18n();
  const country = getCountry(match.city.countryCode);
  if (!country) return null;

  return (
    <article className="card-paper p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight text-ink">
            {countryName(country)}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
            {country.nameEn} · {country.code}
          </p>
        </div>
        <p className="shrink-0 font-mono text-[10px] text-ink-soft">
          {t('cty.coverage', { count: country.cityCount })}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px] sm:grid-cols-3">
        <Stat label={t('cty.capital')} value={country.capital ?? '—'} />
        <Stat label={t('cty.languages')} value={country.languages?.map((l) => languageLabel(l)).join(' / ') ?? '—'} />
        <Stat label={t('cty.currency')} value={currencyLabel(country.currency)} />
        <Stat label={t('cty.population')} value={country.population != null ? formatPop(country.population) : '—'} />
        <Stat
          label={t('cty.gdp')}
          value={
            country.gdpPerCapitaUSD != null
              ? `$${country.gdpPerCapitaUSD.toLocaleString('en-US')}`
              : '—'
          }
        />
        <Stat label="HDI" value={country.hdi != null ? country.hdi.toFixed(3) : '—'} />
        <Stat
          label={t('cty.gpi')}
          value={
            country.gpi != null
              ? `${country.gpi.score.toFixed(2)} · ${t('cty.gpiRank', { rank: country.gpi.rank })}`
              : '—'
          }
        />
        <Stat label={t('cty.cpi')} value={country.cpi != null ? `${country.cpi} / 100` : '—'} />
        <Stat
          label={t('cty.natSafety')}
          value={country.safetyScore != null ? `${country.safetyScore} / 100` : '—'}
        />
        <Stat
          label={t('cty.natHealthcare')}
          value={country.healthcareScore != null ? `${country.healthcareScore} / 100` : '—'}
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
        <div className="mt-4 rounded-[6px] bg-paper-deep/70 px-4 py-3">
          <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
            {t('cty.visaOverview')}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-[1.7]">{visaOverviewLabel(country.visaOverview)}</p>
        </div>
      ) : null}

      <PassportVisaBlock country={country} />
      <LongStayBlock country={country} />

      <p className="mt-4 border-t hairline pt-3 font-mono text-[9px] leading-[1.8] text-ink-soft/75">
        {t('cty.footnote2', { date: formatDate(country.updatedAt) })}
      </p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-data text-[12px] tabular-nums text-ink">{value}</dd>
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
