// 数据卡区：生活成本对比（真实字段计算 + 规则模板结论） + 公开数据对比表（仅列数据库实际字段）
// + 国家级参考对比行（第六轮：同国城市合并为一列，参考信息不参与打分）
import { useState } from 'react';
import { CLIMATE_LABEL } from '../../lib/engine';
import { compareCost, type CompareRow } from '../../lib/compare';
import { getCountry } from '../../data/countries';
import type { Country } from '../../data/types';

const fmt = (n: number): string => `$${n.toLocaleString('en-US')}`;

export default function CompareDataCards({ rows }: { rows: CompareRow[] }) {
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
      label: '气候',
      valueOf: (r) =>
        r.city.climate != null
          ? CLIMATE_LABEL[r.city.climate]
          : (r.city.climateDetail?.summary ?? '—'),
    },
    {
      label: '年均气温',
      valueOf: (r) =>
        r.city.tempC != null
          ? `${r.city.tempC}°C`
          : r.city.climateDetail != null
            ? `${r.city.climateDetail.avgTempC}°C`
            : '—',
    },
    { label: '月均综合成本', valueOf: (r) => (r.city.monthlyCostUSD != null ? `~${fmt(r.city.monthlyCostUSD)}` : '—') },
    { label: '成本指数 · NYC=100', valueOf: (r) => (r.city.costIndex != null ? `${r.city.costIndex}` : '—') },
    { label: '市中心 1 居租金', valueOf: (r) => (r.city.rent1brUSD != null ? fmt(r.city.rent1brUSD) : '—') },
    { label: '平价一餐', valueOf: (r) => (r.city.mealUSD != null ? fmt(r.city.mealUSD) : '—') },
    { label: '宽带中位', valueOf: (r) => (r.city.internetMbps != null ? `${r.city.internetMbps} Mbps` : '—') },
    { label: '安全指数', valueOf: (r) => (r.city.safety != null ? `${r.city.safety}/100` : '—') },
    { label: '医疗指数', valueOf: (r) => (r.city.healthcareIndex != null ? `${r.city.healthcareIndex}` : '—') },
    { label: '污染指数', valueOf: (r) => (r.city.pollutionIndex != null ? `${r.city.pollutionIndex}` : '—') },
    { label: '通勤指数', valueOf: (r) => (r.city.trafficIndex != null ? `${r.city.trafficIndex}` : '—') },
    { label: '购买力指数', valueOf: (r) => (r.city.purchasingPowerIndex != null ? `${r.city.purchasingPowerIndex}` : '—') },
    { label: '游民社区', valueOf: (r) => (r.city.community != null ? `${r.city.community}/5` : '—') },
    { label: '英语友好', valueOf: (r) => (r.city.english != null ? `${r.city.english}/5` : '—') },
    { label: '生活节奏', valueOf: (r) => (r.city.pace != null ? `${r.city.pace}/5` : '—') },
    {
      label: '数字游民签证',
      valueOf: (r) =>
        r.city.digitalNomadVisa === true ? '有' : r.city.digitalNomadVisa === false ? '—' : '待核实',
      toneOf: (r) => (r.city.digitalNomadVisa === true ? 'text-moss' : 'text-ink-soft'),
    },
  ];

  return (
    <section className="border-t hairline">
      <div className="mx-auto max-w-almanac px-6 py-12 md:px-10">
        <p className="eyebrow">chart 03 · 数据卡</p>
        <h2 className="mt-2 font-display text-[22px] font-bold tracking-tight md:text-[26px]">成本与公开数据</h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* 生活成本对比卡 */}
          <div className="card-paper p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-[16px] font-bold">生活成本对比</h3>
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
                    aria-label={slot === 0 ? '城市 A' : '城市 B'}
                  >
                    {rows.map((r, i) => (
                      <option key={r.city.id} value={i} disabled={slot === 0 ? i === bi : i === ai}>
                        {slot === 0 ? 'A · ' : 'B · '}
                        {r.city.nameZh}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-y hairline py-4 text-center">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">成本差</p>
                <p className="mt-1 font-mono text-[17px] text-ink">
                  {costDiff.diffUSD != null ? `$${Math.abs(costDiff.diffUSD).toLocaleString('en-US')}` : '—'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">相对差</p>
                <p className="mt-1 font-mono text-[17px] text-ink">{costDiff.diffPct != null ? `${costDiff.diffPct}%` : '—'}</p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">指数差</p>
                <p className="mt-1 font-mono text-[17px] text-ink">
                  {costDiff.diffIndex != null ? Math.abs(costDiff.diffIndex) : '—'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-[1.8] text-ink-soft">{costDiff.conclusion}</p>
            <p className="mt-3 font-mono text-[9.5px] leading-relaxed text-ink-soft/70">
              口径：月均综合成本 = 市区一居室租金 + 水电网 + 餐饮 + 交通（USD，2026 年初估算，因生活方式而异）；成本指数为 Numbeo 口径（NYC=100）。
            </p>
          </div>

          {/* 公开数据对比表 */}
          <div className="card-paper p-5 md:p-7">
            <h3 className="font-heading text-[16px] font-bold">公开数据对比表</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse">
                <thead>
                  <tr className="border-b border-ink/15 text-left">
                    <th className="py-2 pr-3 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-ink-soft">字段</th>
                    {rows.map((r) => (
                      <th key={r.city.id} className="py-2 pr-3 text-right font-mono text-[11px] font-medium text-ink">
                        {r.city.nameZh}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row) => (
                    <tr key={row.label} className="border-b border-ink/[0.07]">
                      <td className="py-1.5 pr-3 text-[12px] text-ink-soft">{row.label}</td>
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
              仅列城市数据库实际字段；医疗质量等未入库字段不参与对比。签证政策为 2026 年初快照，出行前请以官方最新信息为准。
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
  const groups = new Map<string, { country: Country; cities: string[] }>();
  for (const r of rows) {
    const c = getCountry(r.city.countryCode);
    if (!c) continue;
    const g = groups.get(c.code);
    if (g) g.cities.push(r.city.nameZh);
    else groups.set(c.code, { country: c, cities: [r.city.nameZh] });
  }
  if (groups.size === 0) return null;
  const list = [...groups.values()];

  const fields: { label: string; valueOf: (c: Country) => string }[] = [
    { label: '首都', valueOf: (c) => c.capital ?? '—' },
    { label: '官方语言', valueOf: (c) => c.languages?.join('、') ?? '—' },
    { label: '货币', valueOf: (c) => c.currency ?? '—' },
    { label: '人口', valueOf: (c) => (c.population != null ? formatPop(c.population) : '—') },
    { label: '人均 GDP', valueOf: (c) => (c.gdpPerCapitaUSD != null ? `$${c.gdpPerCapitaUSD.toLocaleString('en-US')}` : '—') },
    { label: 'HDI', valueOf: (c) => (c.hdi != null ? c.hdi.toFixed(3) : '—') },
    { label: 'GPI 和平指数', valueOf: (c) => (c.gpi != null ? `${c.gpi.score.toFixed(2)} · ${c.gpi.rank}` : '—') },
    { label: 'CPI 廉洁指数', valueOf: (c) => (c.cpi != null ? `${c.cpi}/100` : '—') },
    { label: '国家安全', valueOf: (c) => (c.numbeoSafety != null ? `${c.numbeoSafety}/100` : '—') },
    { label: '医疗（国家）', valueOf: (c) => (c.numbeoHealthcare != null ? `${c.numbeoHealthcare}/100` : '—') },
    { label: '宽带均速', valueOf: (c) => (c.internetMbpsFixed != null ? `${c.internetMbpsFixed} Mbps` : '—') },
    { label: '最高边际个税率', valueOf: (c) => (c.taxTopRatePct != null ? `${c.taxTopRatePct}%` : '—') },
  ];

  return (
    <div className="card-paper mt-8 p-5 md:p-7">
      <h3 className="font-heading text-[16px] font-bold">国家级参考对比</h3>
      <p className="mt-1 text-[12px] text-ink-soft">
        同国城市合并显示；国家宏观数据仅作背景参考，不参与城市打分。
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-ink/15 text-left">
              <th className="py-2 pr-3 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-ink-soft">国家</th>
              {list.map((g) => (
                <th key={g.country.code} className="py-2 pr-3 text-right">
                  <span className="block font-mono text-[11px] font-medium text-ink">{g.country.nameZh}</span>
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
                <td className="py-1.5 pr-3 text-[12px] text-ink-soft">数字游民签证概览</td>
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
        国家数据截至 {list[0]?.country.updatedAt} · 来源：World Bank（CC BY 4.0）/ UNDP HDR / Vision of Humanity GPI（引用）/
        Transparency International CPI（引用）/ Numbeo 国家指数；个税率为事实性标注，不构成税务建议。
      </p>
    </div>
  );
}

function formatPop(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)} 亿`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(0)} 万`;
  return n.toLocaleString('en-US');
}
