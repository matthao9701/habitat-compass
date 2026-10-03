import { getCountry } from '../../data/countries';
import type { CityMatch } from '../../lib/engine';

/**
 * CountryCards — 报告页「国家概况」参考卡（第六轮）
 * 参考信息层：不进引擎加权。按 Top5 城市所属国家去重展示国家级数据，缺失字段显示「—」。
 */
export default function CountryCards({ matches }: { matches: CityMatch[] }) {
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
      <h2 className="mb-2 font-display text-2xl font-bold tracking-tight md:text-3xl">国家概况</h2>
      <p className="mb-10 text-[13px] leading-relaxed text-ink-soft">
        推荐城市所在国家的宏观数据，仅作背景参考——不参与城市打分。缺失数据以「—」标示。
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
  const country = getCountry(match.city.countryCode);
  if (!country) return null;

  return (
    <article className="card-paper p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-bold tracking-tight text-ink">
            {country.nameZh}
          </h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
            {country.nameEn} · {country.code}
          </p>
        </div>
        <p className="shrink-0 font-mono text-[10px] text-ink-soft">
          覆盖城市 {country.cityCount} 座
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px] sm:grid-cols-3">
        <Stat label="首都" value={country.capital ?? '—'} />
        <Stat label="官方语言" value={country.languages?.join('、') ?? '—'} />
        <Stat label="货币" value={country.currency ?? '—'} />
        <Stat label="人口" value={country.population != null ? formatPop(country.population) : '—'} />
        <Stat
          label="人均 GDP"
          value={
            country.gdpPerCapitaUSD != null
              ? `$${country.gdpPerCapitaUSD.toLocaleString('en-US')}`
              : '—'
          }
        />
        <Stat label="HDI" value={country.hdi != null ? country.hdi.toFixed(3) : '—'} />
        <Stat
          label="GPI 和平指数"
          value={
            country.gpi != null
              ? `${country.gpi.score.toFixed(2)} · 第 ${country.gpi.rank} 位`
              : '—'
          }
        />
        <Stat label="CPI 廉洁指数" value={country.cpi != null ? `${country.cpi} / 100` : '—'} />
        <Stat
          label="国家安全（Numbeo）"
          value={country.numbeoSafety != null ? `${country.numbeoSafety} / 100` : '—'}
        />
        <Stat
          label="医疗（Numbeo）"
          value={country.numbeoHealthcare != null ? `${country.numbeoHealthcare} / 100` : '—'}
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
        <div className="mt-4 rounded-[6px] bg-paper-deep/70 px-4 py-3">
          <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
            数字游民签证概览 · 国家级
          </p>
          <p className="mt-1.5 text-[12.5px] leading-[1.7]">{country.visaOverview}</p>
        </div>
      ) : null}

      <p className="mt-4 border-t hairline pt-3 font-mono text-[9px] leading-[1.8] text-ink-soft/75">
        数据截至 {country.updatedAt} · 来源：World Bank（CC BY 4.0）· UNDP HDR · Vision of Humanity GPI（引用）·
        Transparency International CPI（引用）· Numbeo 国家指数；个税率为事实性标注，不构成税务建议。
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
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)} 亿`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(0)} 万`;
  return n.toLocaleString('en-US');
}
